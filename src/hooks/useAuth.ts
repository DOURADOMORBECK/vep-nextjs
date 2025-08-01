import { useState, useEffect } from 'react';
import { clientAuth, AuthUser } from '@/lib/auth';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  canAccess: (feature: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  logout: () => void;
}

// Define feature permissions by role
const featurePermissions: Record<string, string[]> = {
  // Admin and owner can access everything
  admin: ['*'],
  owner: ['*'],
  
  // Manager permissions
  manager: [
    'dashboard',
    'products',
    'customers',
    'suppliers',
    'orders',
    'deliveries',
    'operators',
    'reports'
  ],
  
  // Supervisor permissions
  supervisor: [
    'dashboard',
    'products',
    'customers',
    'suppliers',
    'orders',
    'deliveries',
    'reports'
  ],
  
  // Operator permissions
  operator: [
    'dashboard',
    'products',
    'customers',
    'orders',
    'deliveries'
  ],
  
  // Basic user permissions
  user: [
    'dashboard',
    'products'
  ]
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = clientAuth.getUser();
    setUser(userData);
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  const canAccess = (feature: string): boolean => {
    if (!user) return false;
    
    // Admin and owner can access everything
    if (isAdmin || isOwner) return true;
    
    const permissions = featurePermissions[user.role] || [];
    
    // Check if user has wildcard permission
    if (permissions.includes('*')) return true;
    
    // Check specific permission
    return permissions.includes(feature);
  };

  const logout = () => {
    clientAuth.logout();
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isOwner,
    canAccess,
    hasRole,
    logout
  };
}