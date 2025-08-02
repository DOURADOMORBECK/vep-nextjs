'use client';

import { useAuth } from '@/hooks/useAuth';
import LoadingOverlay from './common/LoadingOverlay';

export default function DataInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, dataInitialized, isLoading } = useAuth();

  // Se ainda está carregando o auth, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingOverlay show={true} message="Carregando..." />
      </div>
    );
  }

  // Se está autenticado mas dados não foram inicializados, mostra loading
  if (isAuthenticated && !dataInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Preparando o sistema...</h2>
          <p className="text-gray-400">Carregando dados para uma melhor experiência</p>
        </div>
      </div>
    );
  }

  // Renderiza os filhos quando tudo estiver pronto
  return <>{children}</>;
}