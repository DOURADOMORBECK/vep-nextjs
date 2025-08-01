import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getAuthToken } from '@/lib/auth';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

// Define role-based access control
const rolePermissions = {
  owner: {
    // Owner has access to everything
    allowAll: true,
    routes: []
  },
  admin: {
    // Admin has access to everything
    allowAll: true,
    routes: []
  },
  manager: {
    // Manager has access to most features except system settings
    allowAll: false,
    routes: [
      '/dashboard',
      '/produtos',
      '/clientes',
      '/fornecedores',
      '/pedidos',
      '/entregas',
      '/operadores',
      '/relatorios',
      '/api/**'
    ],
    blockedRoutes: ['/usuarios', '/configuracoes']
  },
  supervisor: {
    // Supervisor has access to operational features
    allowAll: false,
    routes: [
      '/dashboard',
      '/produtos',
      '/clientes',
      '/fornecedores',
      '/pedidos',
      '/entregas',
      '/relatorios',
      '/api/**'
    ],
    blockedRoutes: ['/usuarios', '/operadores', '/configuracoes']
  },
  operator: {
    // Operator has limited access
    allowAll: false,
    routes: [
      '/dashboard',
      '/produtos',
      '/clientes',
      '/pedidos',
      '/entregas',
      '/api/products/**',
      '/api/customers/**',
      '/api/orders/**',
      '/api/delivery/**'
    ],
    blockedRoutes: ['/usuarios', '/operadores', '/fornecedores', '/relatorios', '/configuracoes']
  },
  user: {
    // Basic user has minimal access
    allowAll: false,
    routes: [
      '/dashboard',
      '/produtos',
      '/api/products/**',
      '/api/auth/me',
      '/api/auth/logout'
    ],
    blockedRoutes: ['/**']
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check authentication
  const token = getAuthToken(request);
  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and get user
  const user = verifyToken(token);
  if (!user) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based permissions
  const permissions = rolePermissions[user.role as keyof typeof rolePermissions];
  
  if (!permissions) {
    // Unknown role, deny access
    return NextResponse.json(
      { error: 'Access denied: Invalid role' },
      { status: 403 }
    );
  }

  // Admin and owner have access to everything
  if (permissions.allowAll) {
    return NextResponse.next();
  }

  // Check if route is explicitly blocked
  if (permissions.blockedRoutes?.some(route => {
    const pattern = route.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    return new RegExp(`^${pattern}$`).test(pathname);
  })) {
    return NextResponse.json(
      { error: 'Access denied: Insufficient permissions' },
      { status: 403 }
    );
  }

  // Check if route is allowed
  const isAllowed = permissions.routes.some(route => {
    const pattern = route.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    return new RegExp(`^${pattern}$`).test(pathname);
  });

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Access denied: Insufficient permissions' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};