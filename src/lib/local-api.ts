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

  // Orders
  async getOrders(filters?: {
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
    return fetch(`/api/pedidos/${id}`);
  },

  async searchOrders(search: string) {
    return fetch(`/api/pedidos?search=${encodeURIComponent(search)}`);
  },

  async getOrderStats() {
    return fetch('/api/pedidos/stats');
  },

  // Placeholder for other endpoints that will be migrated later
  async getUsers() {
    // TODO: Implement local users API
    return new Response(JSON.stringify([]), { status: 200 });
  },

  async getOperators() {
    // TODO: Implement local operators API
    return new Response(JSON.stringify([]), { status: 200 });
  },

  async getUserLogs() {
    // TODO: Implement local user logs API
    return new Response(JSON.stringify([]), { status: 200 });
  },

  async getDeliveries(_params?: Record<string, string>) {
    // TODO: Implement local deliveries API
    return new Response(JSON.stringify([]), { status: 200 });
  },

  async getDeliveryStats() {
    // TODO: Implement local delivery stats API
    return new Response(JSON.stringify({
      totalRoutes: 0,
      activeRoutes: 0,
      todayDeliveries: 0,
      totalPoints: 0
    }), { status: 200 });
  },

  async getDriverDeliveryStats(_driverId: string) {
    // TODO: Implement local driver stats API
    return new Response(JSON.stringify({
      totalRoutes: 0,
      completedRoutes: 0,
      todayDeliveries: 0,
      avgDeliveryTimeMinutes: 0
    }), { status: 200 });
  }
};