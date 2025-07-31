'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  isCollapsed?: boolean;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: 'fa-chart-line', label: 'Dashboard', path: '/dashboard' },
    { icon: 'fa-clipboard-list', label: 'Pedidos', path: '/pedidos' },
    { icon: 'fa-box', label: 'Produtos', path: '/produtos' },
    { icon: 'fa-users', label: 'Clientes', path: '/clientes' },
    { icon: 'fa-truck-field', label: 'Fornecedores', path: '/fornecedores' },
    { icon: 'fa-user-gear', label: 'Operadores', path: '/operadores' },
    { icon: 'fa-user-group', label: 'Usuários', path: '/usuarios' },
    { icon: 'fa-truck', label: 'Jornada da Entrega', path: '/jornada-entrega' },
    { icon: 'fa-box-open', label: 'Jornada do Pedido', path: '/jornada-pedido' },
    { icon: 'fa-industry', label: 'Jornada do Produto', path: '/jornada-produto' },
    { icon: 'fa-clock-rotate-left', label: 'Histórico de Ações', path: '/userlogs' },
    { icon: 'fa-server', label: 'Status das APIs', path: '/api-status' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-800 border-r border-gray-700 flex-shrink-0 transition-all duration-300`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center md:justify-start h-16 px-4 border-b border-gray-700">
          <img 
            src="/logo_veplim.png" 
            alt="VepLim" 
            className={`${isCollapsed ? 'h-8' : 'h-10'} transition-all duration-300`}
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
            <div className="flex-shrink-0">
              <img 
                className="h-8 w-8 rounded-full" 
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" 
                alt="Avatar"
              />
            </div>
            {!isCollapsed && (
              <>
                <div className="ml-3 hidden md:block">
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-gray-400">admin@empresa.com</p>
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