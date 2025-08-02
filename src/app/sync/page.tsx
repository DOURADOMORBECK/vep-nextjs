'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import { useUserLogger, USER_ACTIONS, MODULES } from '@/hooks/useUserLogger';

interface SyncStatus {
  entity: string;
  lastSync: string | null;
  lastRecordDate: string | null;
  recordCount: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  lastError?: string;
}

interface SyncResult {
  entity: string;
  totalRecords: number;
  inserted: number;
  updated: number;
  errors: number;
  duration: number;
  isIncremental: boolean;
}

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<SyncResult[]>([]);
  const { logAction } = useUserLogger();

  // Carregar status inicial
  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(data.status);
      } else {
        toast.error('Erro ao carregar status de sincronização');
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast.error('Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    // Atualizar status a cada 30 segundos
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Executar sincronização
  const performSync = async (entity?: string, mode: 'full' | 'incremental' = 'full') => {
    setSyncing(true);
    setSyncingEntity(entity || 'all');
    
    logAction({
      action: USER_ACTIONS.CREATE,
      module: MODULES.SYSTEM,
      details: {
        operation: 'sync',
        entity: entity || 'all',
        mode
      }
    });

    try {
      const url = entity 
        ? `/api/sync?entity=${entity}&mode=${mode}`
        : `/api/sync?mode=${mode}`;

      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success(
          `Sincronização ${mode === 'incremental' ? 'incremental' : 'completa'} concluída!`
        );
        setLastResults(data.results);
        
        // Recarregar status
        await loadStatus();
        
        // Log de sucesso
        logAction({
          action: USER_ACTIONS.UPDATE,
          module: MODULES.SYSTEM,
          details: {
            operation: 'sync_complete',
            entity: entity || 'all',
            mode,
            totals: data.totals
          }
        });
      } else {
        toast.error(`Erro na sincronização: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao executar sincronização');
    } finally {
      setSyncing(false);
      setSyncingEntity(null);
    }
  };

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'fa-check-circle';
      case 'running': return 'fa-spinner fa-spin';
      case 'error': return 'fa-exclamation-circle';
      default: return 'fa-clock';
    }
  };

  return (
    <DashboardLayout title="Sincronização ERP" subtitle="Gerencie a sincronização de dados com o FinancesWeb">
      <div className="p-6">
        {/* Header com ações */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Controle de Sincronização</h2>
              <p className="text-gray-400">
                Sincronize dados do ERP FinancesWeb com o banco de dados local
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => performSync(undefined, 'incremental')}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fa-solid fa-sync mr-2"></i>
                Sincronização Incremental
              </button>
              <button
                onClick={() => performSync(undefined, 'full')}
                disabled={syncing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fa-solid fa-download mr-2"></i>
                Sincronização Completa
              </button>
            </div>
          </div>
        </div>

        {/* Status das entidades */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-4 bg-gray-700 border-b border-gray-600">
            <h3 className="font-medium text-white">Status das Entidades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">Entidade</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Última Sincronização</th>
                  <th className="px-6 py-3 text-left font-medium">Registros</th>
                  <th className="px-6 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                      <p>Carregando status...</p>
                    </td>
                  </tr>
                ) : syncStatus.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      <p>Nenhuma entidade configurada</p>
                    </td>
                  </tr>
                ) : (
                  syncStatus.map((entity) => (
                    <tr key={entity.entity} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium capitalize">
                          {entity.entity}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <i className={`fa-solid ${getStatusIcon(entity.status)} ${getStatusColor(entity.status)}`}></i>
                          <span className={`text-sm ${getStatusColor(entity.status)}`}>
                            {entity.status === 'completed' && 'Concluído'}
                            {entity.status === 'running' && 'Em execução'}
                            {entity.status === 'error' && 'Erro'}
                            {entity.status === 'pending' && 'Pendente'}
                          </span>
                        </div>
                        {entity.lastError && (
                          <p className="text-xs text-red-400 mt-1">{entity.lastError}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(entity.lastSync)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          {entity.recordCount.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => performSync(entity.entity, 'incremental')}
                            disabled={syncing}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Sincronização incremental"
                          >
                            {syncingEntity === entity.entity ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fa-solid fa-sync"></i>
                            )}
                          </button>
                          <button
                            onClick={() => performSync(entity.entity, 'full')}
                            disabled={syncing}
                            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Sincronização completa"
                          >
                            <i className="fa-solid fa-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos resultados */}
        {lastResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Últimos Resultados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lastResults.map((result) => (
                <div key={result.entity} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium capitalize mb-2">{result.entity}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-white">{result.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Inseridos:</span>
                      <span className="text-green-400">+{result.inserted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Atualizados:</span>
                      <span className="text-blue-400">{result.updated}</span>
                    </div>
                    {result.errors > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Erros:</span>
                        <span className="text-red-400">{result.errors}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-600">
                      <span className="text-gray-400">Duração:</span>
                      <span className="text-white">{(result.duration / 1000).toFixed(2)}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações sobre sincronização automática */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            <i className="fa-solid fa-info-circle mr-2"></i>
            Sincronização Automática
          </h3>
          <div className="space-y-3 text-gray-300">
            <p>
              <i className="fa-solid fa-clock text-blue-400 mr-2"></i>
              A sincronização incremental é executada automaticamente a cada 1 hora
            </p>
            <p>
              <i className="fa-solid fa-database text-green-400 mr-2"></i>
              Apenas registros novos ou alterados são sincronizados no modo incremental
            </p>
            <p>
              <i className="fa-solid fa-shield text-yellow-400 mr-2"></i>
              Todas as operações são registradas no histórico de ações do sistema
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}