import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders } from '@/config/cors';

interface ProxyConfig {
  internalUrl: string;
  externalUrl: string;
}

export function createProxyHandler(config: ProxyConfig) {
  // Handle OPTIONS requests for CORS preflight
  const optionsHandler = async (request: NextRequest) => {
    const origin = request.headers.get('origin');
    return new NextResponse(null, {
      status: 200,
      headers: createCorsHeaders(origin),
    });
  };

  const handler = async (request: NextRequest) => {
    try {
      // Use internal URL only when deployed on Railway
      const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
      const baseUrl = isRailwayProduction ? config.internalUrl : config.externalUrl;
      
      // Get the path after /api/proxy/[service]
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      // const apiIndex = pathParts.indexOf('api');
      const proxyIndex = pathParts.indexOf('proxy');
      
      // Reconstruct the target path
      const targetPath = proxyIndex >= 0 && proxyIndex + 2 < pathParts.length 
        ? '/' + pathParts.slice(proxyIndex + 2).join('/')
        : '';
      
      const targetUrl = `${baseUrl}${targetPath}${url.search}`;
      
      console.log(`[Proxy] ${request.method} ${request.url} -> ${targetUrl}`);
      console.log(`[Proxy] Base URL: ${baseUrl}, Target Path: ${targetPath}`);
      console.log(`[Proxy] Is Railway Production: ${isRailwayProduction}`);

      // Forward the request
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth token if present
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      // Extract token from cookies and add as Authorization header
      const cookies = request.cookies;
      const authToken = cookies.get('veplim-auth-token');
      if (authToken && !authHeader) {
        headers['Authorization'] = `Bearer ${authToken.value}`;
        console.log(`[Proxy] Added auth token to headers`);
      }

      // Forward cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      let body;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          body = await request.text();
        } catch {
          body = undefined;
        }
      }

      console.log(`[Proxy] Sending request with headers:`, {
        ...headers,
        'Authorization': headers['Authorization'] ? 'Bearer [REDACTED]' : 'Not set'
      });
      
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        credentials: 'include',
      });

      const data = await response.text();
      
      // Log error responses
      if (!response.ok) {
        console.error(`[Proxy] Error response from ${targetUrl}:`, {
          status: response.status,
          statusText: response.statusText,
          data: data.substring(0, 500) // First 500 chars to avoid huge logs
        });
      }
      
      // Create response with CORS headers
      const origin = request.headers.get('origin');
      const corsHeaders = createCorsHeaders(origin);

      // Try to parse as JSON, otherwise return as text
      try {
        const jsonData = JSON.parse(data);
        return NextResponse.json(jsonData, { 
          status: response.status,
          headers: corsHeaders
        });
      } catch {
        return new NextResponse(data, { 
          status: response.status,
          headers: { 
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
    } catch (error) {
      console.error('[Proxy] Error:', error);
      const origin = request.headers.get('origin');
      const corsHeaders = createCorsHeaders(origin);
      
      return NextResponse.json(
        { error: 'Proxy error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500, headers: corsHeaders }
      );
    }
  };

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
    OPTIONS: optionsHandler,
  };
}