import { NextRequest, NextResponse } from 'next/server';

interface ProxyConfig {
  internalUrl: string;
  externalUrl: string;
}

export function createProxyHandler(config: ProxyConfig) {
  // Handle OPTIONS requests for CORS preflight
  const optionsHandler = async (request: NextRequest) => {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  };

  const handler = async (request: NextRequest) => {
    try {
      // Use internal URL only when deployed on Railway
      const isRailwayProduction = process.env.RAILWAY_ENVIRONMENT === 'production';
      const baseUrl = isRailwayProduction ? config.internalUrl : config.externalUrl;
      
      // Get the path after /api/proxy/[service]
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const apiIndex = pathParts.indexOf('api');
      const proxyIndex = pathParts.indexOf('proxy');
      
      // Reconstruct the target path
      const targetPath = proxyIndex >= 0 && proxyIndex + 2 < pathParts.length 
        ? '/' + pathParts.slice(proxyIndex + 2).join('/')
        : '';
      
      const targetUrl = `${baseUrl}${targetPath}${url.search}`;
      
      console.log(`[Proxy] ${request.method} ${request.url} -> ${targetUrl}`);

      // Forward the request
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth token if present
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      let body;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          body = await request.text();
        } catch {
          body = undefined;
        }
      }

      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
      });

      const data = await response.text();
      
      // Create response with CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Em produção, especificar domínios
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      };

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
      return NextResponse.json(
        { error: 'Proxy error' },
        { status: 500 }
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