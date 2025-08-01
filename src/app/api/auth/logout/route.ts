import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';
import { createCorsHeaders } from '@/config/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = createCorsHeaders(origin);
  
  try {
    // Create response
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { headers: corsHeaders }
    );
    
    // Clear auth cookies
    clearAuthCookies(response);
    
    return response;
  } catch (error) {
    console.error('[API Route] Logout error:', error);
    return NextResponse.json(
      { error: 'Error during logout' },
      { status: 500, headers: corsHeaders }
    );
  }
}