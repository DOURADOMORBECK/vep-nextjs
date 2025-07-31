// URLs públicas das APIs para desenvolvimento
const DEV_API_URLS = {
  AUTH_API: 'https://api-users-production-54ed.up.railway.app',
  PRODUCTS_API: 'https://api-jornada-produto-production.up.railway.app',
  CLIENTS_API: 'https://api-customers-production.up.railway.app',
  ORDERS_API: 'https://api-dashboard-production-f3c4.up.railway.app',
  OPERATORS_API: 'https://api-users-production-54ed.up.railway.app',
  SUPPLIERS_API: 'https://api-customers-production.up.railway.app',
  USERLOGS_API: 'https://api-userlog-production.up.railway.app',
  DELIVERY_API: 'https://api-delivery-production-0851.up.railway.app',
  AUDIT_API: 'https://api-audit-production.up.railway.app',
  VEHICLES_API: 'https://api-vehicles-production.up.railway.app',
};

// URLs internas do Railway para produção (quando deployado no Railway)
const PROD_API_URLS = {
  AUTH_API: process.env.BUN_USERS_SERVICE_URL || 'http://api-users.railway.internal',
  PRODUCTS_API: process.env.BUN_JORNADA_PRODUTO_SERVICE_URL || 'http://api-jornada-produto.railway.internal',
  CLIENTS_API: process.env.BUN_CUSTOMERS_SERVICE_URL || 'http://api-customers.railway.internal',
  ORDERS_API: process.env.BUN_DASHBOARD_SERVICE_URL || 'http://api-dashboard.railway.internal',
  OPERATORS_API: process.env.BUN_USERS_SERVICE_URL || 'http://api-users.railway.internal',
  SUPPLIERS_API: process.env.BUN_CUSTOMERS_SERVICE_URL || 'http://api-customers.railway.internal',
  USERLOGS_API: process.env.BUN_USERLOG_SERVICE_URL || 'http://api-userlog.railway.internal',
  DELIVERY_API: process.env.BUN_DELIVERY_SERVICE_URL || 'http://api-delivery.railway.internal',
  AUDIT_API: process.env.BUN_AUDIT_SERVICE_URL || 'http://api-audit.railway.internal',
  VEHICLES_API: process.env.BUN_VEHICLES_SERVICE_URL || 'http://api-vehicles.railway.internal',
};

// Determina se está deployado no Railway em produção
const isRailwayProduction = process.env.RAILWAY_ENVIRONMENT === 'production';

// Configuração das APIs reais no Railway (Bun Services)
// Em desenvolvimento: usa URLs públicas (.up.railway.app)
// Em produção no Railway: usa URLs internas (.railway.internal)
export const API_CONFIG = isRailwayProduction ? PROD_API_URLS : DEV_API_URLS;

// Log da configuração atual (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    mode: isRailwayProduction ? 'PRODUCTION (Internal URLs)' : 'DEVELOPMENT (Public URLs)',
    example: API_CONFIG.AUTH_API
  });
}

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