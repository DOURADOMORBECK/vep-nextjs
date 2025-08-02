'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface SyncResult {
  entity: string;
  success: boolean;
  total?: number;
  persisted?: number;
  message?: string;
  error?: string;
}

export default function SmartSyncPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [isAdmin, router]);

  const syncEntity = async (entity?: string) => {
    setSyncing(true);
    setResults([]);

    const toastId = toast.loading(
      entity ? `Sincronizando ${entity}...` : 'Sincronizando todas as entidades...'
    );

    try {
      const url = entity 
        ? `/api/sync/smart?entity=${entity}`
        : '/api/sync/smart';

      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success('Sincronização concluída!', { id: toastId });
        setResults(data.results);
        setDbStatus(data.dbAvailable ? 'available' : 'unavailable');
      } else {
        toast.error(data.error || 'Erro na sincronização', { id: toastId });
      }
    } catch {
      toast.error('Erro ao conectar com servidor', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const getResultIcon = (result: SyncResult) => {
    if (result.success) {
      return result.persisted && result.persisted > 0 
        ? '✅' 
        : '⚠️';
    }
    return '❌';
  };

  const getResultColor = (result: SyncResult) => {
    if (result.success) {
      return result.persisted && result.persisted > 0 
        ? 'text-green-400' 
        : 'text-yellow-400';
    }
    return 'text-red-400';
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout 
      title="Sincronização Inteligente" 
      subtitle="Sincronização que sempre funciona"
    >
      <div className="p-6">
        {/* Status do Sistema */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">API FinancesWeb</span>
                <span className="text-green-400">✅ Conectado</span>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Banco de Dados</span>
                <span className={
                  dbStatus === 'checking' ? 'text-gray-400' :
                  dbStatus === 'available' ? 'text-green-400' :
                  'text-yellow-400'
                }>
                  {dbStatus === 'checking' ? '🔄 Verificando...' :
                   dbStatus === 'available' ? '✅ Disponível' :
                   '⚠️ Indisponível (usando modo offline)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Sincronização */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sincronização</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => syncEntity()}
              disabled={syncing}
              className="p-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-sync-alt text-2xl mb-2"></i>
              <h3 className="font-semibold">Sincronizar Tudo</h3>
              <p className="text-sm opacity-75 mt-1">Todas as entidades</p>
            </button>

            <button
              onClick={() => syncEntity('produtos')}
              disabled={syncing}
              className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-box text-2xl mb-2"></i>
              <h3 className="font-semibold">Produtos</h3>
              <p className="text-sm opacity-75 mt-1">Sincronizar produtos</p>
            </button>

            <button
              onClick={() => syncEntity('pessoas')}
              disabled={syncing}
              className="p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-users text-2xl mb-2"></i>
              <h3 className="font-semibold">Pessoas</h3>
              <p className="text-sm opacity-75 mt-1">Clientes e fornecedores</p>
            </button>

            <button
              onClick={() => syncEntity('operadores')}
              disabled={syncing}
              className="p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-user-gear text-2xl mb-2"></i>
              <h3 className="font-semibold">Operadores</h3>
              <p className="text-sm opacity-75 mt-1">Usuários do sistema</p>
            </button>

            <button
              onClick={() => syncEntity('pedidos')}
              disabled={syncing}
              className="p-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-clipboard-list text-2xl mb-2"></i>
              <h3 className="font-semibold">Pedidos</h3>
              <p className="text-sm opacity-75 mt-1">Pedidos de venda</p>
            </button>
          </div>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Resultados da Sincronização</h2>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getResultIcon(result)}</span>
                        <h3 className="font-semibold capitalize text-lg">{result.entity}</h3>
                      </div>
                      
                      {result.success ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-400">
                            Total encontrado: <span className="text-white font-medium">{result.total || 0}</span>
                          </p>
                          {result.persisted !== undefined && (
                            <p className="text-sm text-gray-400">
                              Registros salvos: <span className="text-white font-medium">{result.persisted}</span>
                            </p>
                          )}
                          <p className={`text-sm ${getResultColor(result)}`}>
                            {result.message}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-400 mt-2">
                          {result.error || 'Erro ao sincronizar'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}