'use client';

import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredFeature?: string;
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  requiredFeature,
  fallback = null 
}: RoleGuardProps) {
  const { user, canAccess, isAdmin, isOwner } = useAuth();

  // Admin and owner bypass all restrictions
  if (isAdmin || isOwner) {
    return <>{children}</>;
  }

  // Check role requirement
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Check feature requirement
  if (requiredFeature && !canAccess(requiredFeature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}