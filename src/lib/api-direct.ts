// Direct API calls to Railway APIs with simple endpoints
// Based on actual Railway API documentation

import { fetchWithInterceptor } from './api-interceptor';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Helper to build headers
const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Direct Railway API calls
export const api = {
  // Auth/Users API (api-users-production-54ed.up.railway.app)
  auth: {
    // POST /login
    login: async (email: string, password: string) => {
      const response = await fetchWithInterceptor('https://api-users-production-54ed.up.railway.app/login', {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email, password })
      });
      return response;
    },

    // POST /register
    register: async (name: string, email: string, password: string) => {
      const response = await fetchWithInterceptor('https://api-users-production-54ed.up.railway.app/register', {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ name, email, password })
      });
      return response;
    },

    // GET /me
    getMe: async () => {
      const response = await fetchWithInterceptor('https://api-users-production-54ed.up.railway.app/me', {
        headers: getHeaders()
      });
      return response;
    },

    // GET /users (admin only)
    getUsers: async () => {
      const response = await fetchWithInterceptor('https://api-users-production-54ed.up.railway.app/users', {
        headers: getHeaders()
      });
      return response;
    },

    // PUT /me
    updateMe: async (data: { name?: string; password?: string }) => {
      const response = await fetchWithInterceptor('https://api-users-production-54ed.up.railway.app/me', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response;
    }
  },

  // Jornada Produto API (api-jornada-produto-production.up.railway.app)
  products: {
    // GET /jornada-produto/orders
    getOrders: async (status?: string, limit = 100, offset = 0) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      
      const response = await fetchWithInterceptor(
        `https://api-jornada-produto-production.up.railway.app/jornada-produto/orders?${params}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /jornada-produto/orders/:orderId
    getOrder: async (orderId: string) => {
      const response = await fetchWithInterceptor(
        `https://api-jornada-produto-production.up.railway.app/jornada-produto/orders/${orderId}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /jornada-produto/orders/:orderId/items
    getOrderItems: async (orderId: string) => {
      const response = await fetchWithInterceptor(
        `https://api-jornada-produto-production.up.railway.app/jornada-produto/orders/${orderId}/items`, {
        headers: getHeaders()
      });
      return response;
    }
  },

  // Delivery API (api-delivery-production-0851.up.railway.app)
  delivery: {
    // GET /delivery
    getAll: async () => {
      const response = await fetchWithInterceptor('https://api-delivery-production-0851.up.railway.app/delivery', {
        headers: getHeaders()
      });
      return response;
    },

    // GET /delivery/:id
    getById: async (id: string) => {
      const response = await fetchWithInterceptor(
        `https://api-delivery-production-0851.up.railway.app/delivery/${id}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /delivery/status/:status
    getByStatus: async (status: string) => {
      const response = await fetchWithInterceptor(
        `https://api-delivery-production-0851.up.railway.app/delivery/status/${status}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /delivery/driver/:driverId
    getByDriver: async (driverId: string) => {
      const response = await fetchWithInterceptor(
        `https://api-delivery-production-0851.up.railway.app/delivery/driver/${driverId}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /delivery/stats
    getStats: async () => {
      const response = await fetchWithInterceptor(
        'https://api-delivery-production-0851.up.railway.app/delivery/stats', {
        headers: getHeaders()
      });
      return response;
    },

    // GET /delivery/:routeId/points
    getRoutePoints: async (routeId: string) => {
      const response = await fetchWithInterceptor(
        `https://api-delivery-production-0851.up.railway.app/delivery/${routeId}/points`, {
        headers: getHeaders()
      });
      return response;
    }
  },

  // Customers API (api-customers-production.up.railway.app)
  customers: {
    // GET /customer
    getAll: async (params?: { active?: boolean; type?: 'PJ' | 'PF'; limit?: number; offset?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.active !== undefined) queryParams.append('active', String(params.active));
      if (params?.type) queryParams.append('type', params.type);
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.offset) queryParams.append('offset', String(params.offset));
      
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/customer${queryParams.toString() ? '?' + queryParams : ''}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /customer/:id
    getById: async (id: string) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/customer/${id}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /customer/code/:code
    getByCode: async (code: string) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/customer/code/${code}`, {
        headers: getHeaders()
      });
      return response;
    },

    // POST /customer
    create: async (data: any) => {
      const response = await fetchWithInterceptor('https://api-customers-production.up.railway.app/customer', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response;
    },

    // PUT /customer/:id
    update: async (id: string, data: any) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/customer/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response;
    },

    // DELETE /customer/:id
    delete: async (id: string) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/customer/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return response;
    }
  },

  // Suppliers API (also uses api-customers-production.up.railway.app)
  suppliers: {
    // GET /supplier
    getAll: async (params?: { active?: boolean; type?: 'PJ' | 'PF'; category?: string; limit?: number; offset?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.active !== undefined) queryParams.append('active', String(params.active));
      if (params?.type) queryParams.append('type', params.type);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.offset) queryParams.append('offset', String(params.offset));
      
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/supplier${queryParams.toString() ? '?' + queryParams : ''}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /supplier/:id
    getById: async (id: string) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/supplier/${id}`, {
        headers: getHeaders()
      });
      return response;
    },

    // GET /supplier/code/:code
    getByCode: async (code: string) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/supplier/code/${code}`, {
        headers: getHeaders()
      });
      return response;
    },

    // POST /supplier
    create: async (data: any) => {
      const response = await fetchWithInterceptor('https://api-customers-production.up.railway.app/supplier', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response;
    },

    // PUT /supplier/:id
    update: async (id: string, data: any) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/supplier/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response;
    },

    // DELETE /supplier/:id
    delete: async (id: string) => {
      const response = await fetchWithInterceptor(
        `https://api-customers-production.up.railway.app/supplier/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return response;
    }
  }
};

// Export for compatibility with existing code
export const railwayApiDirect = api;