import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders } from '@/config/cors';
import { loginSchema, sanitizeEmail, type LoginRequest } from '@/lib/validation';
import { withApiMiddleware, AUTH_RATE_LIMIT, createErrorResponse } from '@/lib/api-middleware';
import { API_CONFIG, buildUrl } from '@/config/api';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
}

// Main login handler
async function loginHandler(request: NextRequest, validatedData?: LoginRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  const corsHeaders = createCorsHeaders(origin);
  
  if (!validatedData) {
    return createErrorResponse('Dados de login são obrigatórios', 400, undefined, origin);
  }

  const { email, password } = validatedData;
  const sanitizedEmail = sanitizeEmail(email);

    // Use centralized API configuration
    const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
    const apiUrl = buildUrl(API_CONFIG.AUTH_API, '/login');
    const fallbackUrl = isRailwayProduction 
      ? 'https://api-users-production-54ed.up.railway.app/login'
      : apiUrl;

    console.log(`[API Route] Login attempt for: ${sanitizedEmail}`);
    console.log(`[API Route] Using API URL: ${apiUrl}`);
    console.log(`[API Route] Environment:`, { NODE_ENV: process.env.NODE_ENV, RAILWAY_ENV: process.env.RAILWAY_ENV, isRailwayProduction });

    let response;
    try {
      // Implementar timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: sanitizedEmail,
          password 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      console.error('[API Route] Network error:', fetchError);
      
      // Se estamos em produção e a URL interna falhou, tenta a pública
      if (isRailwayProduction && apiUrl !== fallbackUrl) {
        console.log('[API Route] Internal URL failed, trying public URL...');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email: sanitizedEmail,
              password 
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
        } catch (fallbackError: unknown) {
          console.error('[API Route] Fallback to public URL also failed:', fallbackError);
          
          if (fallbackError instanceof Error && fallbackError.name === 'AbortError') {
            return NextResponse.json(
              { error: 'A requisição demorou muito para responder. Por favor, tente novamente.' },
              { status: 504, headers: corsHeaders }
            );
          }
          
          return NextResponse.json(
            { error: 'Não foi possível conectar ao servidor de autenticação. Por favor, tente novamente.' },
            { status: 503, headers: corsHeaders }
          );
        }
      } else {
        // Não estamos em produção ou já tentamos a URL pública
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return NextResponse.json(
            { error: 'A requisição demorou muito para responder. Por favor, tente novamente.' },
            { status: 504, headers: corsHeaders }
          );
        }
        
        return NextResponse.json(
          { error: 'Não foi possível conectar ao servidor de autenticação. Por favor, tente novamente.' },
          { status: 503, headers: corsHeaders }
        );
      }
    }

    let data;
    try {
      const text = await response.text();
      console.log(`[API Route] Response text:`, text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('[API Route] JSON parse error:', parseError);
      data = { error: 'Resposta inválida do servidor' };
    }

    if (!response.ok) {
      console.error(`[API Route] Login failed:`, data);
      return NextResponse.json(
        { error: data.error || 'Credenciais inválidas' },
        { 
          status: response.status,
          headers: corsHeaders
        }
      );
    }

    console.log(`[API Route] Login successful for: ${sanitizedEmail}`);
    // Ensure we have the expected structure
    if (!data.token || !data.user) {
      console.error('[API Route] Invalid success response structure:', data);
      return NextResponse.json(
        { error: 'Resposta inválida do servidor de autenticação' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Import auth utilities
    const { setAuthCookies } = await import('@/lib/auth');
    
    // Create response with auth data
    const loginResponse = NextResponse.json(data, {
      headers: corsHeaders
    });
    
    // Set secure httpOnly cookies
    setAuthCookies(loginResponse, data.token, data.user);
    
    return loginResponse;
}

// Export the wrapped handler with middleware
export const POST = withApiMiddleware(loginHandler, {
  validationSchema: loginSchema,
  rateLimit: AUTH_RATE_LIMIT,
  methods: ['POST']
});