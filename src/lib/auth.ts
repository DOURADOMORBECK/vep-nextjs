import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const COOKIE_NAME = 'veplim-auth-token';
const USER_COOKIE_NAME = 'veplim-user-data';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface AuthToken {
  token: string;
  expiresIn: string;
}

// Create secure cookie options
export function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

// Create user data cookie options (non-httpOnly for client access)
export function getUserCookieOptions(isProduction: boolean) {
  return {
    httpOnly: false, // Accessible by client for UI purposes
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

// Set auth cookies
export function setAuthCookies(response: NextResponse, token: string, user: AuthUser) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set httpOnly cookie for token
  response.cookies.set(COOKIE_NAME, token, getCookieOptions(isProduction));
  
  // Set non-httpOnly cookie for user data (for UI)
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  response.cookies.set(
    USER_COOKIE_NAME, 
    JSON.stringify(userData), 
    getUserCookieOptions(isProduction)
  );
}

// Get auth token from request
export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value || null;
}

// Get user data from request
export function getUserData(request: NextRequest): AuthUser | null {
  const userData = request.cookies.get(USER_COOKIE_NAME)?.value;
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

// Clear auth cookies
export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete(USER_COOKIE_NAME);
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest) {
  const token = getAuthToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
  
  return null; // Auth successful
}

// Client-side auth utilities
export const clientAuth = {
  // Get user from cookie (client-side only)
  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    const userCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${USER_COOKIE_NAME}=`));
    
    if (!userCookie) return null;
    
    try {
      const userData = decodeURIComponent(userCookie.split('=')[1]);
      return JSON.parse(userData);
    } catch {
      return null;
    }
  },
  
  // Check if user is authenticated (client-side only)
  isAuthenticated(): boolean {
    return !!this.getUser();
  },
  
  // Clear auth data (client-side only)
  logout() {
    if (typeof window === 'undefined') return;
    
    // Clear cookies
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${USER_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    // Clear any localStorage data (for backward compatibility)
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  }
};