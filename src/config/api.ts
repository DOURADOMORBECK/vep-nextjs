// Configuração das APIs reais no Railway (Bun Services)
export const API_CONFIG = {
  // Base URLs das APIs deployadas no Railway com Bun
  AUTH_API: process.env.NEXT_PUBLIC_BUN_USERS_SERVICE_URL || process.env.BUN_USERS_SERVICE_URL || 'https://your-users-api.railway.app',
  PRODUCTS_API: process.env.NEXT_PUBLIC_BUN_JORNADA_PRODUTO_SERVICE_URL || process.env.BUN_JORNADA_PRODUTO_SERVICE_URL || 'https://your-products-api.railway.app',
  CLIENTS_API: process.env.NEXT_PUBLIC_BUN_CUSTOMERS_SERVICE_URL || process.env.BUN_CUSTOMERS_SERVICE_URL || 'https://your-customers-api.railway.app',
  ORDERS_API: process.env.NEXT_PUBLIC_BUN_DASHBOARD_SERVICE_URL || process.env.BUN_DASHBOARD_SERVICE_URL || 'https://your-dashboard-api.railway.app',
  OPERATORS_API: process.env.NEXT_PUBLIC_BUN_USERS_SERVICE_URL || process.env.BUN_USERS_SERVICE_URL || 'https://your-users-api.railway.app',
  SUPPLIERS_API: process.env.NEXT_PUBLIC_BUN_CUSTOMERS_SERVICE_URL || process.env.BUN_CUSTOMERS_SERVICE_URL || 'https://your-customers-api.railway.app',
  USERLOGS_API: process.env.NEXT_PUBLIC_BUN_USERLOG_SERVICE_URL || process.env.BUN_USERLOG_SERVICE_URL || 'https://your-userlog-api.railway.app',
  DELIVERY_API: process.env.NEXT_PUBLIC_BUN_DELIVERY_SERVICE_URL || process.env.BUN_DELIVERY_SERVICE_URL || 'https://your-delivery-api.railway.app',
  AUDIT_API: process.env.NEXT_PUBLIC_BUN_AUDIT_SERVICE_URL || process.env.BUN_AUDIT_SERVICE_URL || 'https://your-audit-api.railway.app',
  VEHICLES_API: process.env.NEXT_PUBLIC_BUN_VEHICLES_SERVICE_URL || process.env.BUN_VEHICLES_SERVICE_URL || 'https://your-vehicles-api.railway.app',
};

// Headers padrão para as requisições
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Função helper para construir URLs completas
export const buildUrl = (baseUrl: string, endpoint: string) => {
  // Remove barra final da baseUrl e inicial do endpoint
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
};