// Direct endpoint configuration based on Railway API documentation
// These are the actual endpoints used by the deployed APIs

export const API_ENDPOINTS = {
  // Users API endpoints
  auth: {
    login: '/login',
    register: '/register', 
    me: '/me',
    users: '/users',
  },
  
  // Jornada Produto API endpoints
  jornadaProduto: {
    orders: '/jornada-produto/orders',
    orderById: (orderId: string) => `/jornada-produto/orders/${orderId}`,
    orderItems: (orderId: string) => `/jornada-produto/orders/${orderId}/items`,
  },
  
  // Delivery API endpoints
  delivery: {
    all: '/delivery',
    byId: (id: string) => `/delivery/${id}`,
    byStatus: (status: string) => `/delivery/status/${status}`,
    byDriver: (driverId: string) => `/delivery/driver/${driverId}`,
    stats: '/delivery/stats',
    routePoints: (routeId: string) => `/delivery/${routeId}/points`,
  },
  
  // Audit API endpoints (based on api-customers.rtf which seems to contain audit endpoints)
  audit: {
    logs: '/audit/logs',
    logsByUser: (userId: string) => `/audit/logs/user/${userId}`,
    logsByAction: (action: string) => `/audit/logs/action/${action}`,
  }
};