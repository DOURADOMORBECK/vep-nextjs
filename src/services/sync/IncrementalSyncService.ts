/**
 * Serviço de Sincronização Incremental com FinancesWeb
 * Sincroniza apenas dados novos ou alterados desde a última sincronização
 */

import { fetchFromAPI } from '@/app/api/financesweb/sync/config';
import { ProdutoFinanceswebService, type ProdutoFinancesweb } from '@/services/database/financesweb/produtoFinanceswebService';
import { OperadorFinanceswebService, type OperadorFinancesweb } from '@/services/database/financesweb/operadorFinanceswebService';
import { PessoaFinanceswebService, type PessoaFinancesweb } from '@/services/database/financesweb/pessoaFinanceswebService';
import { PedidoDetalheFinanceswebService, type PedidoDetalheFinancesweb } from '@/services/database/financesweb/pedidoDetalheFinanceswebService';

interface SyncProgress {
  entity: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  message?: string;
  progress?: number;
  total?: number;
}

interface IncrementalSyncResult {
  success: boolean;
  syncedEntities: string[];
  errors: Array<{ entity: string; error: string }>;
  details: Record<string, {
    novos: number;
    atualizados: number;
    erros: number;
    total: number;
  }>;
}

interface SyncService<T> {
  createTable(): Promise<void>;
  upsertMany(data: T[]): Promise<{ inseridos: number; atualizados: number; erros: number }>;
}

export class IncrementalSyncService {
  private static progressCallbacks: Array<(progress: SyncProgress[]) => void> = [];
  private static syncProgress: Map<string, SyncProgress> = new Map();

  /**
   * Registra um callback para acompanhar o progresso da sincronização
   */
  static onProgress(callback: (progress: SyncProgress[]) => void): () => void {
    this.progressCallbacks.push(callback);
    // Retorna função para remover o callback
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Atualiza o progresso e notifica os callbacks
   */
  private static updateProgress(entity: string, update: Partial<SyncProgress>) {
    const current = this.syncProgress.get(entity) || { entity, status: 'pending' };
    this.syncProgress.set(entity, { ...current, ...update });
    
    const progressArray = Array.from(this.syncProgress.values());
    this.progressCallbacks.forEach(cb => cb(progressArray));
  }

  /**
   * Executa sincronização incremental de todas as entidades
   */
  static async syncAll(): Promise<IncrementalSyncResult> {
    console.log('🚀 Iniciando sincronização incremental com FinancesWeb...');
    
    const result: IncrementalSyncResult = {
      success: true,
      syncedEntities: [],
      errors: [],
      details: {}
    };

    // Inicializa progresso
    const entities = ['produtos', 'pessoas', 'operadores', 'pedidos'];
    entities.forEach(entity => {
      this.updateProgress(entity, { status: 'pending', message: 'Aguardando...' });
    });

    try {
      // Obtém última sincronização
      const lastSyncDate = await this.getLastSyncDate();
      console.log(`📅 Última sincronização: ${lastSyncDate || 'Nunca'}`);

      // Sincroniza cada entidade
      await this.syncEntity<ProdutoFinancesweb>('produtos', 'fnc_produtos_e_servicos', 
        new ProdutoFinanceswebService() as SyncService<ProdutoFinancesweb>, lastSyncDate, result);
      
      await this.syncEntity<PessoaFinancesweb>('pessoas', 'fnc_pessoas', 
        new PessoaFinanceswebService() as SyncService<PessoaFinancesweb>, lastSyncDate, result);
      
      await this.syncEntity<OperadorFinancesweb>('operadores', 'fnc_operadores', 
        new OperadorFinanceswebService() as SyncService<OperadorFinancesweb>, lastSyncDate, result);
      
      await this.syncEntity<PedidoDetalheFinancesweb>('pedidos', 'vw_pedidos_venda_produtos', 
        new PedidoDetalheFinanceswebService() as SyncService<PedidoDetalheFinancesweb>, lastSyncDate, result);

      // Salva timestamp da sincronização
      await this.saveLastSyncDate();

    } catch (error) {
      console.error('❌ Erro geral na sincronização:', error);
      result.success = false;
      result.errors.push({ 
        entity: 'geral', 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }

    // Limpa progresso após 5 segundos
    setTimeout(() => {
      this.syncProgress.clear();
    }, 5000);

    return result;
  }

  /**
   * Sincroniza uma entidade específica
   */
  private static async syncEntity<T>(
    entityName: string,
    tableName: string,
    service: SyncService<T>,
    lastSyncDate: string | null,
    result: IncrementalSyncResult
  ): Promise<void> {
    try {
      this.updateProgress(entityName, { 
        status: 'syncing', 
        message: 'Buscando dados...',
        progress: 0 
      });

      // Monta filtro incremental se houver última sincronização
      let filtro: string | undefined;
      if (lastSyncDate) {
        // Formato do filtro depende da API do FinancesWeb
        // Exemplo: "updated_at > '2024-01-01 00:00:00'"
        filtro = `updated_at > '${lastSyncDate}'`;
      }

      console.log(`🔄 Sincronizando ${entityName}...${filtro ? ' (incremental)' : ' (completo)'}`);
      
      // Busca dados do FinancesWeb
      const data = await fetchFromAPI(tableName, filtro) as T[];
      
      this.updateProgress(entityName, { 
        message: `${data.length} registros encontrados`,
        total: data.length 
      });

      if (data.length === 0) {
        this.updateProgress(entityName, { 
          status: 'completed', 
          message: 'Nenhum dado novo',
          progress: 100 
        });
        result.details[entityName] = { novos: 0, atualizados: 0, erros: 0, total: 0 };
        return;
      }

      // Garante que a tabela existe
      await service.createTable();

      // Processa dados em lotes para melhor performance
      const batchSize = 100;
      let processed = 0;
      const syncResult = { inseridos: 0, atualizados: 0, erros: 0 };

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResult = await service.upsertMany(batch);
        
        syncResult.inseridos += batchResult.inseridos || 0;
        syncResult.atualizados += batchResult.atualizados || 0;
        syncResult.erros += batchResult.erros || 0;
        
        processed += batch.length;
        this.updateProgress(entityName, { 
          progress: Math.round((processed / data.length) * 100),
          message: `Processando... ${processed}/${data.length}` 
        });
      }

      // Atualiza resultado final
      result.syncedEntities.push(entityName);
      result.details[entityName] = {
        novos: syncResult.inseridos,
        atualizados: syncResult.atualizados,
        erros: syncResult.erros,
        total: data.length
      };

      this.updateProgress(entityName, { 
        status: 'completed', 
        message: `✅ ${syncResult.inseridos} novos, ${syncResult.atualizados} atualizados`,
        progress: 100 
      });

      console.log(`✅ ${entityName} sincronizado:`, syncResult);

    } catch (error) {
      console.error(`❌ Erro ao sincronizar ${entityName}:`, error);
      
      this.updateProgress(entityName, { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      });

      result.errors.push({
        entity: entityName,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Obtém a data da última sincronização
   */
  private static async getLastSyncDate(): Promise<string | null> {
    try {
      const response = await fetch('/api/sync/status');
      if (!response.ok) return null;

      const status = await response.json();
      
      // Encontra a sincronização mais antiga para fazer incremental de todos
      let oldestSyncDate: string | null = null;
      let oldestSyncTime: number | null = null;
      
      Object.values(status).forEach((entityStatus: unknown) => {
        const statusObj = entityStatus as { lastSync?: string };
        if (statusObj.lastSync) {
          const syncTime = new Date(statusObj.lastSync).getTime();
          if (oldestSyncTime === null || syncTime < oldestSyncTime) {
            oldestSyncTime = syncTime;
            oldestSyncDate = statusObj.lastSync;
          }
        }
      });

      return oldestSyncDate;
    } catch {
      return null;
    }
  }

  /**
   * Salva a data da sincronização atual
   */
  private static async saveLastSyncDate(): Promise<void> {
    try {
      // O endpoint de status deve ser atualizado automaticamente
      // pelos serviços de sincronização
      const timestamp = new Date().toISOString();
      localStorage.setItem('lastFinancesWebSync', timestamp);
    } catch (error) {
      console.error('Erro ao salvar data de sincronização:', error);
    }
  }

  /**
   * Verifica se precisa sincronizar
   */
  static async needsSync(): Promise<boolean> {
    const lastSync = await this.getLastSyncDate();
    if (!lastSync) return true;

    const hoursSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 1; // Sincroniza a cada hora
  }
}