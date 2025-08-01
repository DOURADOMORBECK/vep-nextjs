import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { createCorsHeaders } from '@/config/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = createCorsHeaders(origin);
  
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    const authUser = await verifyToken(token);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Get fresh user data from database
    const { UserService } = await import('@/services/database/userService');
    const user = await UserService.findById(parseInt(authUser.id));
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[API Route] Get user error:', error);
    return NextResponse.json(
      { error: 'Error getting user data' },
      { status: 500, headers: corsHeaders }
    );
  }
}