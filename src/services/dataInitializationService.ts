/**
 * Serviço de Inicialização de Dados
 * Carrega automaticamente todos os dados necessários após o login
 */

interface InitializationResult {
  success: boolean;
  errors: string[];
  loadedEntities: string[];
}

export class DataInitializationService {
  private static readonly ENTITIES = [
    { name: 'produtos', endpoint: '/api/produtos', priority: 1 },
    { name: 'clientes', endpoint: '/api/clientes', priority: 1 },
    { name: 'fornecedores', endpoint: '/api/fornecedores', priority: 2 },
    { name: 'pedidos', endpoint: '/api/pedidos', priority: 3 },
    { name: 'operadores', endpoint: '/api/operadores', priority: 2 },
    { name: 'usuarios', endpoint: '/api/usuarios', priority: 2 }
  ];

  /**
   * Inicializa todos os dados necessários
   */
  static async initializeAllData(): Promise<InitializationResult> {
    console.log('🚀 Iniciando carregamento automático de dados...');
    
    const result: InitializationResult = {
      success: true,
      errors: [],
      loadedEntities: []
    };

    try {
      // Primeiro, tenta sincronizar com o ERP se necessário
      await this.checkAndSyncIfNeeded();

      // Carrega entidades por prioridade
      const sortedEntities = [...this.ENTITIES].sort((a, b) => a.priority - b.priority);
      
      // Agrupa por prioridade para carregar em paralelo
      const priorityGroups = sortedEntities.reduce((acc, entity) => {
        if (!acc[entity.priority]) acc[entity.priority] = [];
        acc[entity.priority].push(entity);
        return acc;
      }, {} as Record<number, typeof sortedEntities>);

      // Carrega cada grupo de prioridade em paralelo
      for (const priority of Object.keys(priorityGroups).sort()) {
        const entities = priorityGroups[Number(priority)];
        
        await Promise.all(
          entities.map(async (entity) => {
            try {
              await this.loadEntity(entity);
              result.loadedEntities.push(entity.name);
              console.log(`✅ ${entity.name} carregados`);
            } catch (error) {
              const errorMsg = `Erro ao carregar ${entity.name}: ${error}`;
              console.error(`❌ ${errorMsg}`);
              result.errors.push(errorMsg);
            }
          })
        );
      }

      // Armazena timestamp da última inicialização
      localStorage.setItem('lastDataInitialization', new Date().toISOString());
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na inicialização: ${error}`);
    }

    console.log('📊 Resultado da inicialização:', result);
    return result;
  }

  /**
   * Verifica se precisa sincronizar com o ERP
   */
  private static async checkAndSyncIfNeeded(): Promise<void> {
    try {
      // Verifica o status da sincronização
      const statusResponse = await fetch('/api/sync/status');
      if (!statusResponse.ok) return;

      const status = await statusResponse.json();
      
      // Se não há dados ou última sync foi há mais de 24h, sincroniza
      const needsSync = Object.keys(status).length === 0 || 
        Object.values(status).every((entityStatus: unknown) => {
          const statusObj = entityStatus as { lastSync?: string };
          if (!statusObj.lastSync) return true;
          const lastSync = new Date(statusObj.lastSync);
          const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
          return hoursSinceSync > 24;
        });

      if (needsSync) {
        console.log('🔄 Sincronizando dados com o ERP...');
        
        // Sincroniza todas as entidades principais
        const syncResponse = await fetch('/api/sync/smart?entity=all', {
          method: 'POST'
        });
        
        if (syncResponse.ok) {
          console.log('✅ Sincronização concluída');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/sincronizar:', error);
    }
  }

  /**
   * Carrega dados de uma entidade específica
   */
  private static async loadEntity(entity: { name: string; endpoint: string }): Promise<void> {
    const response = await fetch(entity.endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Cache os dados no localStorage para acesso rápido
    const cacheKey = `cache_${entity.name}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Obtém dados cacheados
   */
  static getCachedData<T>(entityName: string): T[] | null {
    const cacheKey = `cache_${entityName}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    try {
      const { data, timestamp } = JSON.parse(cached);
      
      // Verifica se o cache não está muito antigo (max 1 hora)
      const cacheAge = Date.now() - new Date(timestamp).getTime();
      if (cacheAge > 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Limpa todos os caches
   */
  static clearAllCaches(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('lastDataInitialization');
  }

  /**
   * Verifica se precisa recarregar os dados
   */
  static needsDataRefresh(): boolean {
    const lastInit = localStorage.getItem('lastDataInitialization');
    if (!lastInit) return true;
    
    const hoursSinceInit = (Date.now() - new Date(lastInit).getTime()) / (1000 * 60 * 60);
    return hoursSinceInit > 1; // Recarrega a cada hora
  }
}