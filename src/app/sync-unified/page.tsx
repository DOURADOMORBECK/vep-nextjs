'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface SyncEntity {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  lastSync?: Date;
  recordCount?: number;
  status?: 'idle' | 'syncing' | 'success' | 'error';
}

const SYNC_ENTITIES: SyncEntity[] = [
  {
    id: 'produtos',
    name: 'Produtos',
    icon: 'fa-box',
    color: 'blue',
    description: 'Catálogo de produtos e serviços'
  },
  {
    id: 'pessoas',
    name: 'Clientes e Fornecedores',
    icon: 'fa-users',
    color: 'green',
    description: 'Base de clientes e fornecedores'
  },
  {
    id: 'operadores',
    name: 'Operadores',
    icon: 'fa-user-gear',
    color: 'purple',
    description: 'Usuários do sistema ERP'
  },
  {
    id: 'pedidos',
    name: 'Pedidos',
    icon: 'fa-clipboard-list',
    color: 'orange',
    description: 'Pedidos de venda'
  }
];

export default function SyncUnifiedPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [entities, setEntities] = useState<SyncEntity[]>(SYNC_ENTITIES);
  const [syncing, setSyncing] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    // Carregar status inicial
    loadSyncStatus();
    
    // Auto sync se habilitado
    const interval = autoSync ? setInterval(performAutoSync, 300000) : null; // 5 minutos
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAdmin, router, autoSync]);

  // Carregar status de sincronização
  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      if (response.ok) {
        const data = await response.json();
        // Atualizar status das entidades
        setEntities(prevEntities => 
          prevEntities.map(entity => ({
            ...entity,
            lastSync: data[entity.id]?.lastSync,
            recordCount: data[entity.id]?.recordCount,
            status: 'idle'
          }))
        );
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  // Sincronizar entidades selecionadas
  const syncSelected = async () => {
    if (selectedEntities.length === 0) {
      toast.error('Selecione pelo menos uma entidade para sincronizar');
      return;
    }

    setSyncing(true);
    const toastId = toast.loading('Preparando sincronização...');

    try {
      // Atualizar status para syncing
      setEntities(prev => 
        prev.map(e => ({
          ...e,
          status: selectedEntities.includes(e.id) ? 'syncing' : e.status
        }))
      );

      // Sincronizar cada entidade
      for (const entityId of selectedEntities) {
        const entity = entities.find(e => e.id === entityId);
        if (!entity) continue;

        toast.loading(`Sincronizando ${entity.name}...`, { id: toastId });

        try {
          const response = await fetch(`/api/sync/smart?entity=${entityId}`, {
            method: 'POST'
          });

          const data = await response.json();

          if (data.success && data.results?.[0]) {
            const result = data.results[0];
            
            // Atualizar status da entidade
            setEntities(prev => 
              prev.map(e => 
                e.id === entityId 
                  ? {
                      ...e,
                      status: 'success',
                      lastSync: new Date(),
                      recordCount: result.total || 0
                    }
                  : e
              )
            );

            toast.success(
              `${entity.name}: ${result.total || 0} registros sincronizados`,
              { duration: 3000 }
            );
          } else {
            throw new Error(data.error || 'Erro na sincronização');
          }
        } catch (error) {
          // Marcar como erro
          setEntities(prev => 
            prev.map(e => 
              e.id === entityId 
                ? { ...e, status: 'error' }
                : e
            )
          );

          toast.error(`Erro ao sincronizar ${entity.name}`);
        }
      }

      toast.success('Sincronização concluída!', { id: toastId });
      setLastSyncTime(new Date());
      setSelectedEntities([]);
      
    } catch (error) {
      toast.error('Erro durante sincronização', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Sincronizar tudo
  const syncAll = async () => {
    setSelectedEntities(entities.map(e => e.id));
    setTimeout(() => syncSelected(), 100);
  };

  // Auto sync
  const performAutoSync = async () => {
    if (!syncing) {
      await syncAll();
    }
  };

  // Toggle seleção
  const toggleSelection = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  // Formatar tempo relativo
  const formatRelativeTime = (date: Date | undefined) => {
    if (!date) return 'Nunca sincronizado';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Agora mesmo';
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout 
      title="Central de Sincronização" 
      subtitle="Mantenha seus dados sempre atualizados"
    >
      <div className="p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Status Geral</h2>
              <p className="text-gray-400">
                {lastSyncTime 
                  ? `Última sincronização: ${formatRelativeTime(lastSyncTime)}`
                  : 'Nenhuma sincronização realizada nesta sessão'
                }
              </p>
            </div>

            <div className="flex gap-3">
              {/* Auto Sync Toggle */}
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span className="text-sm">Sincronização Automática</span>
              </label>

              {/* Botões de ação */}
              <button
                onClick={syncAll}
                disabled={syncing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                Sincronizar Tudo
              </button>
            </div>
          </div>
        </div>

        {/* Entidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {entities.map((entity) => (
            <div 
              key={entity.id}
              className={`
                bg-gray-800 rounded-lg p-6 transition-all cursor-pointer
                ${selectedEntities.includes(entity.id) ? 'ring-2 ring-primary-500' : ''}
                ${syncing ? 'opacity-75' : 'hover:bg-gray-700/50'}
              `}
              onClick={() => !syncing && toggleSelection(entity.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={selectedEntities.includes(entity.id)}
                      onChange={() => toggleSelection(entity.id)}
                      disabled={syncing}
                      className="rounded text-primary-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    bg-${entity.color}-900/20 text-${entity.color}-400
                  `}>
                    <i className={`fas ${entity.icon} text-xl`}></i>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{entity.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{entity.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {entity.recordCount !== undefined 
                          ? `${entity.recordCount.toLocaleString('pt-BR')} registros`
                          : 'Sem dados'
                        }
                      </span>
                      <span className="text-gray-500">
                        {formatRelativeTime(entity.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="ml-4">
                  {entity.status === 'syncing' && (
                    <i className="fas fa-spinner fa-spin text-blue-400"></i>
                  )}
                  {entity.status === 'success' && (
                    <i className="fas fa-check-circle text-green-400"></i>
                  )}
                  {entity.status === 'error' && (
                    <i className="fas fa-exclamation-circle text-red-400"></i>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ações selecionadas */}
        {selectedEntities.length > 0 && !syncing && (
          <div className="bg-primary-900/20 border border-primary-600/30 rounded-lg p-4 flex items-center justify-between">
            <p className="text-primary-200">
              {selectedEntities.length} entidade{selectedEntities.length > 1 ? 's' : ''} selecionada{selectedEntities.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={syncSelected}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-sync"></i>
              Sincronizar Selecionadas
            </button>
          </div>
        )}

        {/* Loading overlay */}
        <LoadingOverlay 
          show={syncing} 
          message="Sincronizando dados..." 
          blur={false}
        />
      </div>
    </DashboardLayout>
  );
}