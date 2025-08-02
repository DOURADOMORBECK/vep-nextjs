import { useState, useEffect } from 'react';
import { clientAuth, AuthUser } from '@/lib/auth';
import { DataInitializationService } from '@/services/dataInitializationService';
import toast from 'react-hot-toast';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  canAccess: (feature: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  logout: () => void;
  dataInitialized: boolean;
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
  const [dataInitialized, setDataInitialized] = useState(false);

  useEffect(() => {
    const userData = clientAuth.getUser();
    setUser(userData);
    setIsLoading(false);
    
    // Se o usuário está autenticado e os dados não foram inicializados
    if (userData && !dataInitialized) {
      initializeUserData();
    }
  }, [dataInitialized]);

  const initializeUserData = async () => {
    // Verifica se precisa recarregar
    if (!DataInitializationService.needsDataRefresh()) {
      setDataInitialized(true);
      return;
    }

    const toastId = toast.loading('Carregando dados do sistema...');
    
    try {
      const result = await DataInitializationService.initializeAllData();
      
      if (result.success) {
        toast.success(`Dados carregados: ${result.loadedEntities.join(', ')}`, {
          id: toastId,
          duration: 3000
        });
      } else if (result.errors.length > 0) {
        toast.error('Alguns dados não puderam ser carregados', { id: toastId });
        console.error('Erros na inicialização:', result.errors);
      }
      
      setDataInitialized(true);
    } catch (error) {
      toast.error('Erro ao carregar dados iniciais', { id: toastId });
      console.error('Erro na inicialização:', error);
      setDataInitialized(true); // Marca como inicializado mesmo com erro
    }
  };

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
    // Limpa os caches ao fazer logout
    DataInitializationService.clearAllCaches();
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
    logout,
    dataInitialized
  };
}