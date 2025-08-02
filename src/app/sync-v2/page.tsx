'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface SyncStatus {
  entity: string;
  last_sync_date: string | null;
  record_count: number;
  status: string;
  last_error: string | null;
}

interface SyncResult {
  entity: string;
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  status: string;
}

export default function SyncV2Page() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus[]>([]);
  const [lastResult, setLastResult] = useState<SyncResult[] | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'configured' | 'missing'>('checking');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    checkApiKey();
    loadStatus();
  }, [isAdmin, router]);

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/env-check');
      const data = await response.json();
      
      setApiKeyStatus(
        data.financesweb?.apiKeyConfigured ? 'configured' : 'missing'
      );
    } catch {
      setApiKeyStatus('missing');
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sync/v2');
      const data = await response.json();
      
      if (data.success && data.entities) {
        setStatus(data.entities);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSync = async (entity?: string, mode: 'full' | 'incremental' = 'full') => {
    // Verificar API key primeiro
    if (apiKeyStatus === 'missing') {
      toast.error('Configure FINANCESWEB_API_KEY no Railway primeiro!');
      return;
    }

    setSyncing(true);
    setLastResult(null);

    const toastId = toast.loading(
      `Iniciando sincronização ${mode === 'full' ? 'completa' : 'incremental'}...`
    );

    try {
      const url = entity 
        ? `/api/sync/v2?entity=${entity}&mode=${mode}`
        : `/api/sync/v2?mode=${mode}`;

      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message, { id: toastId });
        setLastResult(data.details);
        await loadStatus(); // Recarregar status
      } else {
        toast.error(data.error || 'Erro na sincronização', { id: toastId });
        
        // Mostrar dicas de troubleshooting
        if (data.troubleshooting) {
          Object.values(data.troubleshooting).forEach((tip) => {
            toast(String(tip), { icon: '💡', duration: 5000 });
          });
        }
      }
    } catch {
      toast.error('Erro ao conectar com servidor', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout 
      title="Sincronização v2" 
      subtitle="Sistema robusto de sincronização com ERP"
    >
      <div className="p-6">
        {/* Status da API Key */}
        <div className={`rounded-lg p-4 mb-6 ${
          apiKeyStatus === 'configured' 
            ? 'bg-green-900/20 border border-green-500/30' 
            : 'bg-yellow-900/20 border border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${
                apiKeyStatus === 'configured' ? 'text-green-300' : 'text-yellow-300'
              }`}>
                {apiKeyStatus === 'configured' 
                  ? '✅ API Key Configurada' 
                  : '⚠️ API Key Não Configurada'}
              </h3>
              <p className={`text-sm mt-1 ${
                apiKeyStatus === 'configured' ? 'text-green-200' : 'text-yellow-200'
              }`}>
                {apiKeyStatus === 'configured'
                  ? 'Sistema pronto para sincronizar com FinancesWeb'
                  : 'Configure FINANCESWEB_API_KEY no Railway para habilitar sincronização'}
              </p>
            </div>
            <button
              onClick={checkApiKey}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            >
              Verificar Novamente
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ações de Sincronização</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => performSync(undefined, 'full')}
              disabled={syncing || apiKeyStatus !== 'configured'}
              className="p-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-download text-2xl mb-2"></i>
              <h3 className="font-semibold">Sincronização Completa</h3>
              <p className="text-sm opacity-75 mt-1">Sincroniza todos os dados do zero</p>
            </button>

            <button
              onClick={() => performSync(undefined, 'incremental')}
              disabled={syncing || apiKeyStatus !== 'configured'}
              className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <i className="fas fa-sync text-2xl mb-2"></i>
              <h3 className="font-semibold">Sincronização Incremental</h3>
              <p className="text-sm opacity-75 mt-1">Atualiza apenas dados novos</p>
            </button>
          </div>
        </div>

        {/* Resultado da Última Sincronização */}
        {lastResult && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Resultado da Sincronização</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lastResult.map((result) => (
                <div key={result.entity} className="bg-gray-900 rounded-lg p-4">
                  <h3 className="font-semibold capitalize mb-2">{result.entity}</h3>
                  <div className="space-y-1 text-sm">
                    <p>Total: <span className="text-white font-medium">{result.total}</span></p>
                    <p>Inseridos: <span className="text-green-400 font-medium">{result.inserted}</span></p>
                    <p>Atualizados: <span className="text-blue-400 font-medium">{result.updated}</span></p>
                    <p>Status: <span className={getStatusColor(result.status)}>{result.status}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status das Entidades */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Status das Entidades</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
              <p className="mt-2 text-gray-400">Carregando status...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Entidade</th>
                    <th className="text-left py-3 px-4">Última Sincronização</th>
                    <th className="text-left py-3 px-4">Registros</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {status.map((item) => (
                    <tr key={item.entity} className="border-b border-gray-700/50">
                      <td className="py-3 px-4 capitalize font-medium">{item.entity}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(item.last_sync_date)}</td>
                      <td className="py-3 px-4">{item.record_count.toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4">
                        <span className={getStatusColor(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => performSync(item.entity, 'full')}
                          disabled={syncing || apiKeyStatus !== 'configured'}
                          className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 text-sm"
                        >
                          Sincronizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}