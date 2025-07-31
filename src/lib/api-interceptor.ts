// Função simples para fazer chamadas às APIs
export async function fetchWithInterceptor(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Adiciona headers padrão
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers: defaultHeaders
  });
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
  async login(email: string, password: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/login'), {
      method: 'POST',
      body: JSON.stringify({ email, password })
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
  
  async createProduct(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, '/produto'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateProduct(id: string, data: unknown) {
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
  
  async createClient(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, '/customer'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateClient(id: string, data: unknown) {
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
  
  async createOrder(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/order'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateOrder(id: string, data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, `/order/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  // UserLogs
  async logUserAction(action: string, details: Record<string, unknown>) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, '/logs'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({
        action,
        details,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous',
        module: (details.module as string) || 'GENERAL'
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
  
  async createOperator(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.OPERATORS_API, '/users'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({ ...data, role: 'operator' })
    });
  },
  
  async updateOperator(id: string, data: unknown) {
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
  
  async createSupplier(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.SUPPLIERS_API, '/supplier'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateSupplier(id: string, data: unknown) {
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
  
  async createVehicle(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, '/vehicle'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateVehicle(id: string, data: unknown) {
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
  
  async createUser(data: unknown) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/users'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateUser(id: string, data: unknown) {
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