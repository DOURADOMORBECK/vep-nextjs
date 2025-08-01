// API middleware for validation, error handling, and security
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from './validation';
import { ensureValidation } from './startup-validation';
import { createCorsHeaders } from '@/config/cors';

// Rate limiting store (in-memory for simplicity, should use Redis in production)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

// Default rate limit: 100 requests per 15 minutes
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 100
};

// Strict rate limit for auth endpoints: 5 attempts per 15 minutes
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  keyGenerator: (request) => {
    // Use IP + User-Agent for more granular limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent.slice(0, 50)}`;
  }
};

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
  return (request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } => {
    const key = config.keyGenerator ? config.keyGenerator(request) : 
                 request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    const now = Date.now();
    const limit = rateLimitStore.get(key);
    
    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      rateLimitStore.set(key, {
        attempts: 1,
        resetTime: now + config.windowMs
      });
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }
    
    if (limit.attempts >= config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: limit.resetTime
      };
    }
    
    // Increment attempts
    limit.attempts++;
    rateLimitStore.set(key, limit);
    
    return {
      allowed: true,
      remaining: config.maxAttempts - limit.attempts,
      resetTime: limit.resetTime
    };
  };
}

/**
 * API middleware wrapper that handles common concerns
 */
export function withApiMiddleware<T = any>(
  handler: (request: NextRequest, validatedData?: T) => Promise<NextResponse>,
  options: {
    validationSchema?: z.ZodSchema<T>;
    rateLimit?: RateLimitConfig;
    requireAuth?: boolean;
    methods?: string[];
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const origin = request.headers.get('origin');
    const corsHeaders = createCorsHeaders(origin);
    
    try {
      // Ensure startup validation has been performed
      ensureValidation();
      
      // Check HTTP method
      if (options.methods && !options.methods.includes(request.method)) {
        return NextResponse.json(
          { error: `Method ${request.method} not allowed` },
          { status: 405, headers: corsHeaders }
        );
      }
      
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimiter = rateLimit(options.rateLimit);
        const rateLimitResult = rateLimiter(request);
        
        if (!rateLimitResult.allowed) {
          const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
          
          return NextResponse.json(
            { 
              error: 'Muitas tentativas. Tente novamente mais tarde.',
              retryAfter: retryAfter
            },
            { 
              status: 429,
              headers: {
                ...corsHeaders,
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': options.rateLimit.maxAttempts.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
              }
            }
          );
        }
        
        // Add rate limit headers
        Object.assign(corsHeaders, {
          'X-RateLimit-Limit': options.rateLimit.maxAttempts.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
        });
      }
      
      // Validate request body if schema provided
      let validatedData: T | undefined;
      if (options.validationSchema && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          const body = await request.json();
          const validation = validateRequest(options.validationSchema, body);
          
          if (!validation.success) {
            return NextResponse.json(
              { 
                error: 'Dados inválidos',
                details: validation.errors
              },
              { status: 400, headers: corsHeaders }
            );
          }
          
          validatedData = validation.data;
        } catch (jsonError) {
          return NextResponse.json(
            { error: 'JSON inválido' },
            { status: 400, headers: corsHeaders }
          );
        }
      }
      
      // TODO: Add authentication middleware if requireAuth is true
      // This would verify JWT token or session
      
      // Call the actual handler
      const response = await handler(request, validatedData);
      
      // Ensure CORS headers are added to the response
      if (response.headers) {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('API middleware error:', error);
      
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500, headers: corsHeaders }
      );
    }
  };
}

/**
 * Error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, any>,
  origin?: string | null
): NextResponse {
  const corsHeaders = createCorsHeaders(origin);
  
  return NextResponse.json(
    { 
      error: message,
      ...(details && { details })
    },
    { status, headers: corsHeaders }
  );
}

/**
 * Success response helper
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200,
  origin?: string | null
): NextResponse {
  const corsHeaders = createCorsHeaders(origin);
  
  return NextResponse.json(
    {
      ...(message && { message }),
      data
    },
    { status, headers: corsHeaders }
  );
}

/**
 * Clean up rate limit store (should be called periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, limit] of rateLimitStore.entries()) {
    if (now > limit.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limit store every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);