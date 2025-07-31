import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Use internal Railway URL in production, external URL in development
    const isProduction = process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT;
    const apiUrl = isProduction 
      ? 'http://api-users.railway.internal:3000/login'
      : 'https://api-users-production-54ed.up.railway.app/login';

    console.log(`[API Route] Login attempt for: ${email}`);
    console.log(`[API Route] Using API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.toLowerCase(),
        password 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[API Route] Login failed:`, data);
      return NextResponse.json(
        { error: data.error || 'Credenciais inválidas' },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    console.log(`[API Route] Login successful for: ${email}`);
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('[API Route] Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}