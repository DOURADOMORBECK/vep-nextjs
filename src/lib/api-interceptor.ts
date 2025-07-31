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

  // Se estamos no browser, use proxy routes locais para evitar CORS
  if (typeof window !== 'undefined' && url.includes('.railway.app')) {
    // Mapeamento de serviços Railway para rotas proxy
    const serviceMap = {
      'api-users': '/api/proxy/users',
      'api-userlog': '/api/logs', // UserLogs tem rota especial
      'api-jornada-produto': '/api/proxy/products',
      'api-customers': '/api/proxy/customers',
      'api-dashboard': '/api/proxy/orders',
      'api-delivery': '/api/proxy/delivery',
      'api-vehicles': '/api/proxy/vehicles',
    };
    
    // Tratamento especial para login
    if (url.includes('/login')) {
      console.log(`[Interceptor] Proxying login to /api/auth/login`);
      return fetch('/api/auth/login', {
        ...options,
        headers: defaultHeaders
      });
    }
    
    // Encontra o serviço na URL
    let proxyUrl = url;
    for (const [service, proxyPath] of Object.entries(serviceMap)) {
      if (url.includes(service)) {
        const urlParts = new URL(url);
        // Para UserLog API, o path já está correto em /api/logs
        if (service === 'api-userlog') {
          // Se a URL termina com /logs, use apenas o proxyPath base
          if (urlParts.pathname.endsWith('/logs')) {
            proxyUrl = proxyPath;
          } else {
            // Para outras rotas do userlog, adicione o pathname
            proxyUrl = `${proxyPath}${urlParts.pathname}`;
          }
          proxyUrl += urlParts.search; // Adiciona query params se houver
        } else {
          proxyUrl = `${proxyPath}${urlParts.pathname}${urlParts.search}`;
        }
        break;
      }
    }
    
    console.log(`[Interceptor] Proxying ${url} to ${proxyUrl}`);
    
    return fetch(proxyUrl, {
      ...options,
      headers: defaultHeaders
    });
  }

  return fetch(url, {
    ...options,
    headers: defaultHeaders
  });
}

import { API_CONFIG, buildUrl, getDefaultHeaders } from '@/config/api';
import { CreateCustomerData, CreateSupplierData } from '@/types/customers';
import { User, CreateUserData, UpdateUserData, LoginData, RegisterData } from '@/types/users';

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
    const loginUrl = buildUrl(API_CONFIG.AUTH_API, '/login');
    console.log('Login URL:', loginUrl);
    console.log('Login payload:', { email: email.toLowerCase(), password: '***' });
    
    return fetchWithInterceptor(loginUrl, {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.toLowerCase(), // Garantir que o email está em lowercase
        password 
      })
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
  
  async createProduct(data: {
    nome: string;
    descricao?: string;
    preco?: number;
    estoque?: number;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, '/produto'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateProduct(id: string, data: {
    nome?: string;
    descricao?: string;
    preco?: number;
    estoque?: number;
  }) {
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

  // Jornada Produto - Orders
  async getJornadaProdutoOrders(params?: { status?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/jornada-produto/orders?${queryString}` : '/jornada-produto/orders';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getJornadaProdutoOrder(orderId: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/jornada-produto/orders/${orderId}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getJornadaProdutoOrderItems(orderId: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/jornada-produto/orders/${orderId}/items`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Jornada Produto - Items
  async getJornadaProdutoItems(params?: { status?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/jornada-produto/items?${queryString}` : '/jornada-produto/items';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getJornadaProdutoItem(itemId: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/jornada-produto/items/${itemId}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Jornada Produto - Stats
  async getJornadaProdutoStats() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, '/jornada-produto/stats'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Jornada Produto - Update Status
  async updateJornadaProdutoOrderStatus(orderId: string, status: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/jornada-produto/orders/${orderId}/status`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({ status })
    });
  },

  async updateJornadaProdutoItemStatus(itemId: string, status: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.PRODUCTS_API, `/jornada-produto/items/${itemId}/status`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({ status })
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
  
  async createClient(data: CreateCustomerData) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, '/customer'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async getCustomerByDocument(document: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/customer/document/${document}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  // Suppliers (Fornecedores)
  async getSuppliers(filters?: { status?: string; tipo_pessoa?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo_pessoa) params.append('tipo_pessoa', filters.tipo_pessoa);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/supplier${query}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getSupplier(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/supplier/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async createSupplier(data: CreateSupplierData) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, '/supplier'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateSupplier(id: string, data: Partial<CreateSupplierData>) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/supplier/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async deleteSupplier(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/supplier/${id}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())  
    });
  },
  
  async getSupplierByDocument(document: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.CLIENTS_API, `/supplier/document/${document}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async updateClient(id: string, data: Partial<CreateCustomerData>) {
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

  async getUserLogs(params?: { 
    userId?: string; 
    action?: string; 
    module?: string; 
    startDate?: string; 
    endDate?: string; 
    limit?: number; 
    offset?: number 
  }) {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.module) queryParams.append('module', params.module);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/logs?${queryString}` : '/logs';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getUserLog(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, `/logs/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getUserLogsByUser(userId: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/logs/user/${userId}?${queryString}` : `/logs/user/${userId}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getUserLogsByAction(action: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/logs/action/${action}?${queryString}` : `/logs/action/${action}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getUserLogsByModule(module: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/logs/module/${module}?${queryString}` : `/logs/module/${module}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getUserLogStats() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, '/logs/stats'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async cleanupUserLogs(days: number = 90) {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days.toString());
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.USERLOGS_API, `/logs/cleanup?${queryParams}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
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

  // Dashboard Stats
  async getDashboardStats() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/stats'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardOrdersByStatus() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/orders-by-status'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardItemsByStatus() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/items-by-status'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardDeliveriesByStatus() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/deliveries-by-status'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardRecentActivity() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/recent-activity'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardTopProducts() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/top-products'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardTopCustomers() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/top-customers'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDashboardAlertsAndNotifications() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.ORDERS_API, '/dashboard/alerts'), {
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
  async getDeliveries(params?: { status?: string; driver_id?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.driver_id) queryParams.append('driver_id', params.driver_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/delivery?${queryString}` : '/delivery';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async getDelivery(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async createDeliveryRoute(data: {
    route_code: string;
    driver_id?: number;
    driver_name?: string;
    vehicle_id?: string;
    status?: string;
    total_points?: number;
    distance_km?: number;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, '/delivery'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  async updateDeliveryRoute(id: string, data: {
    driver_id?: number;
    driver_name?: string;
    vehicle_id?: string;
    status?: string;
    total_points?: number;
    completed_points?: number;
    start_time?: string;
    end_time?: string;
    distance_km?: number;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  async startDeliveryRoute(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}/start`), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async finishDeliveryRoute(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}/finish`), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Delivery Points
  async getDeliveryPoints(routeId: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${routeId}/points`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDeliveryPoint(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/points/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async addDeliveryPoint(routeId: string, data: {
    sequence?: number;
    customer_id?: number;
    customer_name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    status?: string;
    notes?: string;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${routeId}/points`), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  async updateDeliveryPoint(id: string, data: {
    sequence?: number;
    customer_name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    status?: string;
    arrival_time?: string;
    departure_time?: string;
    signature_url?: string;
    photo_url?: string;
    notes?: string;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/points/${id}`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  async markPointAsDelivered(id: string, data: {
    signature_url?: string;
    photo_url?: string;
    notes?: string;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/points/${id}/deliver`), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  // Delivery Statistics
  async getDeliveryStats() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, '/delivery/stats'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getDriverDeliveryStats(driverId: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/stats/driver/${driverId}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  // Legacy method for backward compatibility
  async updateDeliveryStatus(id: string, status: string, location?: { lat: number, lng: number }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.DELIVERY_API, `/delivery/${id}/status`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify({ status, location })
    });
  },

  // Audit Logs
  async createAuditLog(data: {
    user_id: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    old_values?: any;
    new_values?: any;
    severity?: string;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, '/audit/logs'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  async getAuditLogs(params?: { 
    user_id?: string; 
    action?: string; 
    resource_type?: string;
    severity?: string;
    startDate?: string; 
    endDate?: string; 
    limit?: number; 
    offset?: number 
  }) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.resource_type) queryParams.append('resource_type', params.resource_type);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/audit/logs?${queryString}` : '/audit/logs';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditLog(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, `/audit/logs/${id}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditLogsByUser(userId: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/audit/logs/user/${userId}?${queryString}` : `/audit/logs/user/${userId}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditLogsByAction(action: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/audit/logs/action/${action}?${queryString}` : `/audit/logs/action/${action}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditLogsByResource(resourceType: string, resourceId: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/audit/logs/resource/${resourceType}/${resourceId}?${queryString}` : `/audit/logs/resource/${resourceType}/${resourceId}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditLogsByDateRange(start: string, end: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('start', start);
    queryParams.append('end', end);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, `/audit/logs/date-range?${queryParams}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditStats() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, '/audit/stats'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getAuditSecurityAlerts(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/audit/security-alerts?${queryString}` : '/audit/security-alerts';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async cleanupAuditLogs(days: number = 365) {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days.toString());
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUDIT_API, `/audit/logs/cleanup?${queryParams}`), {
      method: 'DELETE',
      headers: getDefaultHeaders(getAuthToken())
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
  
  async createVehicle(data: {
    id_tracked_unit: string;
    lat?: string;
    long?: string;
    speed?: string;
    heading?: string;
    altitude?: string;
    valid_gps?: string;
    ignition?: string;
    event_date?: string;
    update_date?: string;
  }) {
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

  // Vehicle Positions
  async getVehiclePositions(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/positions?${queryString}` : '/positions';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getLatestVehiclePositions() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, '/positions/latest'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getVehiclePositionStats() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, '/positions/stats'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getVehiclePositionsByDateRange(start: string, end: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('start', start);
    queryParams.append('end', end);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/positions/range?${queryParams}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getVehiclesWithValidGPS(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/positions/valid-gps?${queryString}` : '/positions/valid-gps';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getVehiclesWithIgnitionOn(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/positions/ignition-on?${queryString}` : '/positions/ignition-on';
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getVehiclesByArea(bounds: { minLat: number; maxLat: number; minLong: number; maxLong: number }, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('minLat', bounds.minLat.toString());
    queryParams.append('maxLat', bounds.maxLat.toString());
    queryParams.append('minLong', bounds.minLong.toString());
    queryParams.append('maxLong', bounds.maxLong.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/positions/area?${queryParams}`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getVehiclePositionsById(id: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/positions/vehicle/${id}?${queryString}` : `/positions/vehicle/${id}`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, url), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async getLatestVehiclePositionById(id: string) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/positions/vehicle/${id}/latest`), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },

  async updateVehiclePosition(id: string, data: {
    lat: string;
    long: string;
    speed?: string;
    heading?: string;
    altitude?: string;
    valid_gps?: string;
    ignition?: string;
    event_date?: string;
  }) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, `/vehicle/${id}/position`), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },

  async getVehicleHistory(id: string, params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/vehicle/${id}/history?${queryString}` : `/vehicle/${id}/history`;
    
    return fetchWithInterceptor(buildUrl(API_CONFIG.VEHICLES_API, url), {
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
  
  async createUser(data: CreateUserData) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/users'), {
      method: 'POST',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async register(data: RegisterData) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/register'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async getCurrentUser() {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/me'), {
      headers: getDefaultHeaders(getAuthToken())
    });
  },
  
  async updateCurrentUser(data: UpdateUserData) {
    return fetchWithInterceptor(buildUrl(API_CONFIG.AUTH_API, '/me'), {
      method: 'PUT',
      headers: getDefaultHeaders(getAuthToken()),
      body: JSON.stringify(data)
    });
  },
  
  async updateUser(id: string, data: UpdateUserData) {
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