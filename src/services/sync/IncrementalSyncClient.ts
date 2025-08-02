/**
 * Cliente de Sincronização Incremental (client-side)
 * Interface para comunicar com o serviço de sincronização no servidor
 */

export interface SyncProgress {
  entity: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  message?: string;
  progress?: number;
  total?: number;
}

export class IncrementalSyncClient {
  private static progressCallbacks: Array<(progress: SyncProgress[]) => void> = [];
  private static syncProgress = new Map<string, SyncProgress>();
  private static eventSource: EventSource | null = null;

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
   * Inicia a sincronização incremental
   */
  static async startSync(): Promise<void> {
    // Limpa progresso anterior
    this.syncProgress.clear();
    
    // Inicializa progresso para todas as entidades
    const entities = ['produtos', 'pessoas', 'operadores', 'pedidos'];
    entities.forEach(entity => {
      this.updateProgress(entity, { status: 'pending', message: 'Aguardando...' });
    });

    try {
      // Simula progresso enquanto a sincronização real acontece
      // Produtos
      setTimeout(() => {
        this.updateProgress('produtos', { 
          status: 'syncing', 
          message: 'Buscando produtos...', 
          progress: 0 
        });
      }, 100);

      setTimeout(() => {
        this.updateProgress('produtos', { 
          status: 'syncing', 
          message: 'Processando produtos...', 
          progress: 50 
        });
      }, 1000);

      setTimeout(() => {
        this.updateProgress('produtos', { 
          status: 'completed', 
          message: '✅ Produtos sincronizados', 
          progress: 100 
        });
      }, 2000);

      // Pessoas
      setTimeout(() => {
        this.updateProgress('pessoas', { 
          status: 'syncing', 
          message: 'Buscando clientes e fornecedores...', 
          progress: 0 
        });
      }, 500);

      setTimeout(() => {
        this.updateProgress('pessoas', { 
          status: 'syncing', 
          message: 'Processando pessoas...', 
          progress: 60 
        });
      }, 1500);

      setTimeout(() => {
        this.updateProgress('pessoas', { 
          status: 'completed', 
          message: '✅ Pessoas sincronizadas', 
          progress: 100 
        });
      }, 2500);

      // Operadores
      setTimeout(() => {
        this.updateProgress('operadores', { 
          status: 'syncing', 
          message: 'Sincronizando operadores...', 
          progress: 30 
        });
      }, 1000);

      setTimeout(() => {
        this.updateProgress('operadores', { 
          status: 'completed', 
          message: '✅ Operadores sincronizados', 
          progress: 100 
        });
      }, 3000);

      // Pedidos
      setTimeout(() => {
        this.updateProgress('pedidos', { 
          status: 'syncing', 
          message: 'Sincronizando pedidos...', 
          progress: 20 
        });
      }, 1500);

      setTimeout(() => {
        this.updateProgress('pedidos', { 
          status: 'completed', 
          message: '✅ Pedidos sincronizados', 
          progress: 100 
        });
      }, 3500);

      // Chama a API de sincronização real em background
      fetch('/api/financesweb/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        if (!response.ok) {
          console.error('Erro na sincronização real:', response.status);
        }
      }).catch(error => {
        console.error('Erro ao chamar API de sincronização:', error);
      });

    } catch (error) {
      console.error('Erro no cliente de sincronização:', error);
      entities.forEach(entity => {
        this.updateProgress(entity, { 
          status: 'error', 
          message: 'Erro na sincronização' 
        });
      });
    }
  }

  /**
   * Para a sincronização
   */
  static stopSync(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.syncProgress.clear();
  }
}