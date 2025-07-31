import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Determinar a URL da API baseado no ambiente
    const isProduction = process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT;
    const apiUrl = isProduction 
      ? 'http://api-users-production-54ed.railway.internal:3000/login'
      : 'https://api-users-production-54ed.up.railway.app/login';

    console.log('Login attempt for:', email);
    console.log('Using API URL:', apiUrl);

    // Call the Railway Users API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseText = await response.text();
    console.log('API Response status:', response.status);
    console.log('API Response:', responseText);

    if (!response.ok) {
      // Tentar parsear a resposta de erro
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json(
          { error: errorData.error || 'Usuário ou senha inválidos' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: 'Usuário ou senha inválidos' },
          { status: 401 }
        );
      }
    }

    // Parse successful response
    const data = JSON.parse(responseText);
    
    return NextResponse.json({
      token: data.token,
      user: data.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao conectar com o servidor. Tente novamente.' },
      { status: 500 }
    );
  }
}