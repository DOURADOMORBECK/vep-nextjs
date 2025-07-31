import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password } = body;

    // Use internal Railway URL only when deployed on Railway
    const isRailwayProduction = process.env.RAILWAY_ENVIRONMENT === 'production';
    const apiUrl = isRailwayProduction 
      ? 'http://api-users.railway.internal:3000/login'
      : 'https://api-users-production-54ed.up.railway.app/login';

    console.log(`[API Route] Login attempt for: ${email}`);
    console.log(`[API Route] Using API URL: ${apiUrl}`);
    console.log(`[API Route] Environment:`, { NODE_ENV: process.env.NODE_ENV, RAILWAY_ENV: process.env.RAILWAY_ENVIRONMENT });

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
          email: email.toLowerCase().trim(),
          password 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      console.error('[API Route] Network error:', {
        name: fetchError.name,
        message: fetchError.message,
        apiUrl,
        timestamp: new Date().toISOString()
      });
      
      // Diferenciar tipos de erro
      if (fetchError.name === 'AbortError') {
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

    console.log(`[API Route] Login successful for: ${email}`);
    // Ensure we have the expected structure
    if (!data.token || !data.user) {
      console.error('[API Route] Invalid success response structure:', data);
      return NextResponse.json(
        { error: 'Resposta inválida do servidor de autenticação' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(data, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[API Route] Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição. Por favor, tente novamente.' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}