'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isCollapsed?: boolean;
}

interface User {
  name?: string;
  email?: string;
  role?: string;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { canAccess, isAdmin, isOwner } = useAuth();

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const allMenuItems = [
    { icon: 'fa-chart-line', label: 'Dashboard', path: '/dashboard', feature: 'dashboard' },
    { icon: 'fa-clipboard-list', label: 'Pedidos', path: '/pedidos', feature: 'orders' },
    { icon: 'fa-box', label: 'Produtos', path: '/produtos', feature: 'products' },
    { icon: 'fa-users', label: 'Clientes', path: '/clientes', feature: 'customers' },
    { icon: 'fa-truck-field', label: 'Fornecedores', path: '/fornecedores', feature: 'suppliers' },
    { icon: 'fa-user-gear', label: 'Operadores', path: '/operadores', feature: 'operators' },
    { icon: 'fa-user-group', label: 'Usuários', path: '/usuarios', feature: 'users', requireAdmin: true },
    { icon: 'fa-truck', label: 'Jornada da Entrega', path: '/jornada-entrega', feature: 'deliveries' },
    { icon: 'fa-box-open', label: 'Jornada do Pedido', path: '/jornada-pedido', feature: 'orders' },
    { icon: 'fa-industry', label: 'Jornada do Produto', path: '/jornada-produto', feature: 'products' },
    { icon: 'fa-clock-rotate-left', label: 'Histórico de Ações', path: '/userlogs', feature: 'logs', requireAdmin: true },
    { icon: 'fa-sync', label: 'Sincronização', path: '/sync-v2', feature: 'sync', requireAdmin: true },
    { icon: 'fa-magic', label: 'Sincronização Inteligente', path: '/sync-smart', feature: 'sync', requireAdmin: true },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    // Admin and owner see everything
    if (isAdmin || isOwner) return true;
    
    // Check if item requires admin
    if (item.requireAdmin) return false;
    
    // Check feature permission
    return canAccess(item.feature);
  });

  const handleLogout = async () => {
    try {
      // Call the logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear local storage (non-sensitive data)
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        // Redirect to login
        router.push('/login');
      } else {
        console.error('Logout failed');
        // Still redirect on error
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect on error
      router.push('/login');
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-800 border-r border-gray-700 flex-shrink-0 transition-all duration-300`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center md:justify-start h-16 px-4 border-b border-gray-700">
          <Image 
            src="/logo_veplim.png" 
            alt="VepLim" 
            width={isCollapsed ? 32 : 40}
            height={isCollapsed ? 32 : 40}
            className="transition-all duration-300"
          />
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-white ml-3">Gestão VepLim</h1>
          )}
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.path
                      ? 'bg-gray-700 text-primary-400'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} w-6 h-6 ${isCollapsed ? '' : 'md:mr-3'} text-center`}></i>
                  {!isCollapsed && <span className="hidden md:block">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 relative">
              <Image 
                className="rounded-full" 
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" 
                alt="Avatar"
                width={32}
                height={32}
              />
            </div>
            {!isCollapsed && (
              <>
                <div className="ml-3 hidden md:block">
                  <p className="text-sm font-medium text-white">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-gray-400">{user?.email || 'Carregando...'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-auto text-gray-400 hover:text-white"
                  title="Sair"
                >
                  <i className="fa-solid fa-sign-out-alt"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}