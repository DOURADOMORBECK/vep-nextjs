// API Interceptor para salvar respostas em JSON durante desenvolvimento
interface ApiLogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestBody?: any;
  responseBody: any;
  duration: number;
}

class ApiInterceptor {
  private logs: Record<string, ApiLogEntry[]> = {};
  private enabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    if (this.enabled) {
      console.log('🔍 API Interceptor ativado - Salvando respostas em JSON');
      this.loadExistingLogs();
    }
  }

  private loadExistingLogs() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('api_logs');
      if (saved) {
        try {
          this.logs = JSON.parse(saved);
        } catch (e) {
          console.error('Erro ao carregar logs salvos:', e);
        }
      }
    }
  }

  private saveLogs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_logs', JSON.stringify(this.logs));
    }
  }

  private getEndpointKey(url: string, method: string): string {
    // Remove domínio e parâmetros de query para agrupar por endpoint
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname.replace(/\/\d+/g, '/:id'); // Substitui IDs por :id
    return `${method.toUpperCase()}_${path}`;
  }

  async intercept(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!this.enabled) {
      return fetch(url, options);
    }

    const startTime = Date.now();
    const method = options.method || 'GET';

    try {
      // Faz a requisição
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      // Clona a resposta para ler o body sem consumir
      const responseClone = response.clone();
      let responseBody: any;

      try {
        responseBody = await responseClone.json();
      } catch {
        responseBody = await responseClone.text();
      }

      // Cria entrada de log
      const logEntry: ApiLogEntry = {
        timestamp: new Date().toISOString(),
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        requestBody: options.body ? JSON.parse(options.body as string) : undefined,
        responseBody,
        duration
      };

      // Salva no log agrupado por endpoint
      const endpointKey = this.getEndpointKey(url, method);
      if (!this.logs[endpointKey]) {
        this.logs[endpointKey] = [];
      }
      this.logs[endpointKey].push(logEntry);

      // Limita a 10 últimas respostas por endpoint
      if (this.logs[endpointKey].length > 10) {
        this.logs[endpointKey] = this.logs[endpointKey].slice(-10);
      }

      // Salva no localStorage
      this.saveLogs();

      // Log no console para debug
      console.log(`✅ ${method} ${url} - ${response.status} (${duration}ms)`, responseBody);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${method} ${url} - Erro após ${duration}ms:`, error);
      throw error;
    }
  }

  // Exporta logs como arquivo JSON
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `api-logs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Limpa todos os logs
  clearLogs() {
    this.logs = {};
    this.saveLogs();
    console.log('🧹 Logs de API limpos');
  }

  // Obtém logs por endpoint
  getLogsByEndpoint(endpoint: string): ApiLogEntry[] {
    return this.logs[endpoint] || [];
  }

  // Obtém todos os endpoints logados
  getEndpoints(): string[] {
    return Object.keys(this.logs);
  }

  // Obtém estatísticas dos logs
  getStats() {
    const stats: Record<string, any> = {};
    
    Object.entries(this.logs).forEach(([endpoint, entries]) => {
      const durations = entries.map(e => e.duration);
      const statuses = entries.map(e => e.status);
      
      stats[endpoint] = {
        count: entries.length,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: statuses.filter(s => s >= 200 && s < 300).length / statuses.length * 100,
        lastCall: entries[entries.length - 1].timestamp
      };
    });

    return stats;
  }
}

// Singleton instance
const apiInterceptor = new ApiInterceptor();

// Função wrapper para fetch com interceptor
export async function fetchWithInterceptor(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Adiciona headers padrão
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  return apiInterceptor.intercept(url, {
    ...options,
    headers: defaultHeaders
  });
}

// Hook React para usar o interceptor
export function useApiInterceptor() {
  return {
    fetch: fetchWithInterceptor,
    exportLogs: () => apiInterceptor.exportLogs(),
    clearLogs: () => apiInterceptor.clearLogs(),
    getEndpoints: () => apiInterceptor.getEndpoints(),
    getLogsByEndpoint: (endpoint: string) => apiInterceptor.getLogsByEndpoint(endpoint),
    getStats: () => apiInterceptor.getStats()
  };
}

// Componente de Debug para visualizar logs
export function ApiDebugPanel() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md">
        <summary className="cursor-pointer text-white font-medium">
          🔍 API Debug Panel
        </summary>
        <div className="mt-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => apiInterceptor.exportLogs()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              📥 Exportar Logs
            </button>
            <button
              onClick={() => apiInterceptor.clearLogs()}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
            >
              🗑️ Limpar Logs
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            <div className="font-medium mb-2">Endpoints Logados:</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {apiInterceptor.getEndpoints().map(endpoint => (
                <div key={endpoint} className="bg-gray-700 px-2 py-1 rounded">
                  {endpoint}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <div className="font-medium mb-2">Estatísticas:</div>
            <pre className="bg-gray-700 p-2 rounded overflow-x-auto">
              {JSON.stringify(apiInterceptor.getStats(), null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}

import { API_CONFIG, buildUrl, getDefaultHeaders } from '@/config/api';

// Função helper para obter token do localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// API Railway Real - Integração com APIs deployadas (Bun Services)
export const railwayApi = {
  // Autenticação (Users Service)
  async login(email: string, password: string, role: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/login'), {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
  },

  // Produtos (Jornada Produto Service)
  async getProducts() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, '/produto'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getProduct(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/produto/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createProduct(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, '/produto'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateProduct(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/produto/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteProduct(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/produto/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Clientes (Customers Service)
  async getClients() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, '/customer'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getClient(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/customer/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createClient(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, '/customer'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateClient(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/customer/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteClient(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/customer/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Pedidos (Dashboard Service)
  async getOrders() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/order'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getOrder(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, `/order/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createOrder(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/order'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateOrder(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, `/order/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  // UserLogs
  async logUserAction(action: string, details: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, '/logs'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({
        action,
        details,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous',
        module: details.module || 'GENERAL'
      })
    });
  },

  // Operadores (Users Service)
  async getOperators() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.OPERATORS_API, '/users?role=operator'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getOperator(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.OPERATORS_API, `/users/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createOperator(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.OPERATORS_API, '/users'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({ ...data, role: 'operator' })
    });
  },
  
  async updateOperator(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.OPERATORS_API, `/users/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteOperator(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.OPERATORS_API, `/users/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Fornecedores (Customers Service)
  async getSuppliers() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.SUPPLIERS_API, '/supplier'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getSupplier(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.SUPPLIERS_API, `/supplier/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createSupplier(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.SUPPLIERS_API, '/supplier'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateSupplier(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.SUPPLIERS_API, `/supplier/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteSupplier(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.SUPPLIERS_API, `/supplier/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Entregas (Delivery Service)
  async getDeliveries() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, '/delivery'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getDelivery(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async updateDeliveryStatus(id: string, status: string, location?: { lat: number, lng: number }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}/status`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({ status, location })
    });
  },

  // Veículos (Vehicles Service)
  async getVehicles() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, '/vehicle'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getVehicle(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/vehicle/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createVehicle(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, '/vehicle'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateVehicle(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/vehicle/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteVehicle(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/vehicle/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Usuários (Users Service)
  async getUsers() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/users'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getUser(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, `/users/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createUser(data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/users'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateUser(id: string, data: any) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, `/users/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteUser(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, `/users/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
    });
  }
};

export default apiInterceptor;