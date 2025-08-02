// Local API client to replace external Railway APIs
export const localApi = {
  // Products
  async getProducts() {
    return fetch('/api/produtos');
  },

  async getProduct(id: string) {
    return fetch(`/api/produtos/${id}`);
  },

  async searchProducts(search: string) {
    return fetch(`/api/produtos?search=${encodeURIComponent(search)}`);
  },

  async getProductsByCategory(category: string) {
    return fetch(`/api/produtos?category=${encodeURIComponent(category)}`);
  },

  async getProductCategories() {
    return fetch('/api/produtos/categories');
  },

  async getProductStats() {
    return fetch('/api/produtos/stats');
  },

  // Customers
  async getCustomers() {
    return fetch('/api/clientes');
  },

  async getCustomer(id: string) {
    return fetch(`/api/clientes/${id}`);
  },

  async searchCustomers(search: string) {
    return fetch(`/api/clientes?search=${encodeURIComponent(search)}`);
  },

  async getCustomerStats() {
    return fetch('/api/clientes/stats');
  },

  // Suppliers
  async getSuppliers() {
    return fetch('/api/fornecedores');
  },

  async searchSuppliers(search: string) {
    return fetch(`/api/fornecedores?search=${encodeURIComponent(search)}`);
  },

  // Orders - Compatible with jornada-pedido page
  async getOrders(filters?: {
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    
    return fetch(`/api/orders?${params.toString()}`);
  },

  // Pedidos - Original format
  async getPedidos(filters?: {
    clienteId?: string;
    situacao?: string;
    dataInicio?: string;
    dataFim?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.clienteId) params.append('clienteId', filters.clienteId);
    if (filters?.situacao) params.append('situacao', filters.situacao);
    if (filters?.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) params.append('dataFim', filters.dataFim);
    
    return fetch(`/api/pedidos?${params.toString()}`);
  },

  async getOrder(id: string) {
    return fetch(`/api/orders/${id}`);
  },

  async searchOrders(search: string) {
    return fetch(`/api/pedidos?search=${encodeURIComponent(search)}`);
  },

  async getOrderStats() {
    return fetch('/api/pedidos/stats');
  },

  // Users API - Uses real operadores data
  async getUsers() {
    return fetch('/api/usuarios');
  },

  async getOperators() {
    return fetch('/api/operadores');
  },

  // Deliveries API - Uses real pedidos data for deliveries
  async getDeliveries() {
    return fetch('/api/entregas/pedidos');
  },

  async getDeliveryStats() {
    return fetch('/api/entregas/stats');
  },

  async getDriverDeliveryStats() {
    // Same as delivery stats for now since drivers are operators
    return fetch('/api/entregas/stats');
  },

  // Jornada Produto - Production data
  async getProductionData(limit?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    return fetch(`/api/jornada-produto?${params.toString()}`);
  },

  // User Logs - Real logs from PostgreSQL
  async getUserLogs(filters?: {
    userId?: string;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.module) params.append('module', filters.module);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    return fetch(`/api/logs?${params.toString()}`);
  },

  async getLogStats() {
    return fetch('/api/logs/stats');
  }
};