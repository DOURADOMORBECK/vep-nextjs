import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders } from '@/config/cors';
import { loginSchema, sanitizeEmail, type LoginRequest } from '@/lib/validation';
import { withApiMiddleware, AUTH_RATE_LIMIT, createErrorResponse } from '@/lib/api-middleware';
import { createToken, setAuthCookies } from '@/lib/auth';

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

  console.log(`[API Route] Login attempt for: ${sanitizedEmail}`);

  try {
    // Dynamic import to avoid build-time execution
    const { UserService } = await import('@/services/database/userService');
    
    // Check login attempts
    try {
      await UserService.checkLoginAttempts(sanitizedEmail);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 429, headers: corsHeaders }
      );
    }

    // Find user by email
    const user = await UserService.findByEmail(sanitizedEmail);
    
    if (!user || !user.is_active) {
      await UserService.incrementLoginAttempts(sanitizedEmail);
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const validPassword = await UserService.verifyPassword(user, password);
    
    if (!validPassword) {
      await UserService.incrementLoginAttempts(sanitizedEmail);
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Reset login attempts on successful login
    await UserService.resetLoginAttempts(user.id);

    // Create JWT token
    const token = await createToken({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });

    console.log(`[API Route] Login successful for: ${sanitizedEmail}`);
    
    // Create response data
    const responseData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        is_active: user.is_active,
      },
      message: 'Login realizado com sucesso'
    };
    
    // Create response with auth data
    const loginResponse = NextResponse.json(responseData, {
      headers: corsHeaders
    });
    
    // Set secure httpOnly cookies
    setAuthCookies(loginResponse, token, {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });
    
    return loginResponse;
  } catch (error) {
    console.error('[API Route] Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar login' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export the wrapped handler with middleware
export const POST = withApiMiddleware(loginHandler, {
  validationSchema: loginSchema,
  rateLimit: AUTH_RATE_LIMIT,
  methods: ['POST']
});