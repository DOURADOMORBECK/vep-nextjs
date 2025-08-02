/**
 * Serviço de Sincronização em Tempo Real com FinancesWeb
 * Implementa fetch real com progresso detalhado
 */

import { fetchFromAPI } from '@/app/api/financesweb/sync/config';

export interface SyncProgress {
  entity: string;
  status: 'pending' | 'fetching' | 'saving' | 'completed' | 'error';
  message?: string;
  current?: number;
  total?: number;
  percentage?: number;
  details?: {
    fetched?: number;
    saved?: number;
    errors?: number;
    duration?: number;
  };
}

export interface EntitySyncResult {
  entity: string;
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  errors: number;
  duration: number;
  errorDetails?: string[];
}

export interface SyncResult {
  success: boolean;
  timestamp: string;
  duration: number;
  entities: EntitySyncResult[];
  summary: {
    totalRecords: number;
    totalSaved: number;
    totalErrors: number;
  };
}

// Mapeamento de entidades para tabelas do FinancesWeb
const ENTITY_MAPPING = {
  produtos: {
    table: 'fnc_produtos_e_servicos',
    name: 'Produtos',
    estimatedSize: 5000, // Estimativa para cálculo de progresso
  },
  pessoas: {
    table: 'fnc_pessoas',
    name: 'Pessoas (Clientes/Fornecedores)',
    estimatedSize: 3000,
  },
  operadores: {
    table: 'fnc_operadores',
    name: 'Operadores',
    estimatedSize: 50,
  },
  pedidos: {
    table: 'vw_pedidos_venda_produtos',
    name: 'Pedidos Detalhados',
    estimatedSize: 10000,
  },
};

export class RealTimeSyncService {
  private static progressCallbacks: Array<(progress: SyncProgress[]) => void> = [];
  private static currentProgress = new Map<string, SyncProgress>();

  /**
   * Registra callback para acompanhar progresso
   */
  static onProgress(callback: (progress: SyncProgress[]) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Atualiza progresso e notifica callbacks
   */
  private static updateProgress(entity: string, update: Partial<SyncProgress>) {
    const current = this.currentProgress.get(entity) || { 
      entity, 
      status: 'pending',
      percentage: 0 
    };
    
    const updated = { ...current, ...update };
    
    // Calcula porcentagem se tiver current e total
    if (updated.current && updated.total) {
      updated.percentage = Math.round((updated.current / updated.total) * 100);
    }
    
    this.currentProgress.set(entity, updated);
    
    // Notifica callbacks
    const progressArray = Array.from(this.currentProgress.values());
    this.progressCallbacks.forEach(cb => cb(progressArray));
  }

  /**
   * Executa sincronização completa
   */
  static async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const results: EntitySyncResult[] = [];
    
    // Inicializa progresso
    Object.keys(ENTITY_MAPPING).forEach(entity => {
      this.updateProgress(entity, {
        status: 'pending',
        message: 'Aguardando...',
        percentage: 0,
      });
    });

    // Sincroniza cada entidade
    for (const [entity, config] of Object.entries(ENTITY_MAPPING)) {
      const result = await this.syncEntity(entity, config);
      results.push(result);
    }

    // Calcula resumo
    const summary = results.reduce((acc, result) => ({
      totalRecords: acc.totalRecords + result.totalFetched,
      totalSaved: acc.totalSaved + result.totalSaved,
      totalErrors: acc.totalErrors + result.errors,
    }), { totalRecords: 0, totalSaved: 0, totalErrors: 0 });

    return {
      success: results.every(r => r.success),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      entities: results,
      summary,
    };
  }

  /**
   * Sincroniza uma entidade específica
   */
  private static async syncEntity(
    entity: string,
    config: { table: string; name: string; estimatedSize: number }
  ): Promise<EntitySyncResult> {
    const startTime = Date.now();
    const result: EntitySyncResult = {
      entity,
      success: false,
      totalFetched: 0,
      totalSaved: 0,
      errors: 0,
      duration: 0,
      errorDetails: [],
    };

    try {
      // Fase 1: Buscar dados
      this.updateProgress(entity, {
        status: 'fetching',
        message: `Buscando ${config.name} do ERP...`,
        current: 0,
        total: config.estimatedSize,
      });

      console.log(`🔄 Sincronizando ${entity} (${config.table})...`);
      const data = await fetchFromAPI(config.table);
      
      result.totalFetched = Array.isArray(data) ? data.length : 0;
      console.log(`✅ ${result.totalFetched} ${entity} encontrados`);

      this.updateProgress(entity, {
        message: `${result.totalFetched} registros encontrados`,
        total: result.totalFetched,
      });

      if (result.totalFetched === 0) {
        this.updateProgress(entity, {
          status: 'completed',
          message: 'Nenhum registro encontrado',
          percentage: 100,
        });
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Fase 2: Salvar no banco
      this.updateProgress(entity, {
        status: 'saving',
        message: `Salvando ${config.name} no banco...`,
        current: 0,
      });

      // Salva em lotes
      const batchSize = 100;
      let savedCount = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        try {
          // Chama endpoint de salvamento
          const saveResponse = await fetch(`/api/financesweb/sync/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entity,
              data: batch,
            }),
          });

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            savedCount += saveResult.saved || batch.length;
            result.totalSaved = savedCount;
            
            this.updateProgress(entity, {
              current: savedCount,
              message: `Salvando... ${savedCount}/${result.totalFetched}`,
            });
          } else {
            result.errors += batch.length;
            result.errorDetails?.push(`Erro ao salvar lote ${i / batchSize + 1}`);
          }
        } catch (error) {
          result.errors += batch.length;
          result.errorDetails?.push(
            `Erro no lote ${i / batchSize + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          );
        }
      }

      // Atualiza status final
      result.success = result.totalSaved > 0;
      this.updateProgress(entity, {
        status: result.errors === 0 ? 'completed' : 'error',
        message: result.errors === 0 
          ? `✅ ${result.totalSaved} registros salvos`
          : `⚠️ ${result.totalSaved} salvos, ${result.errors} erros`,
        percentage: 100,
        details: {
          fetched: result.totalFetched,
          saved: result.totalSaved,
          errors: result.errors,
          duration: Date.now() - startTime,
        },
      });

    } catch (error) {
      console.error(`❌ Erro ao sincronizar ${entity}:`, error);
      result.errorDetails?.push(error instanceof Error ? error.message : 'Erro desconhecido');
      
      this.updateProgress(entity, {
        status: 'error',
        message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        percentage: 100,
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Limpa progresso
   */
  static clearProgress(): void {
    this.currentProgress.clear();
    this.progressCallbacks = [];
  }

  /**
   * Obtém snapshot do progresso atual
   */
  static getProgress(): SyncProgress[] {
    return Array.from(this.currentProgress.values());
  }
}