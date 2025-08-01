'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredFeature?: string;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredFeature,
  fallbackUrl = '/dashboard'
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole, canAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      router.push(fallbackUrl);
      return;
    }

    // Check feature requirement
    if (requiredFeature && !canAccess(requiredFeature)) {
      router.push(fallbackUrl);
      return;
    }
  }, [isLoading, isAuthenticated, requiredRole, requiredFeature, hasRole, canAccess, router, fallbackUrl]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthenticated || (requiredRole && !hasRole(requiredRole)) || (requiredFeature && !canAccess(requiredFeature))) {
    return null;
  }

  return <>{children}</>;
}