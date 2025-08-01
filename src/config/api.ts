// Função helper para configurar URLs inteligentes com logs informativos
const configureApiUrl = (envVar: string | undefined, fallbackUrl: string, serviceName: string, isDev: boolean = true) => {
  const envType = isDev ? 'NEXT_PUBLIC' : 'BUN_SERVICE';
  
  if (envVar) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${serviceName}: Usando variável de ambiente ${envType}`);
    }
    return envVar;
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️  ${serviceName}: Variável ${envType} não encontrada, usando URL pública padrão`);
    }
    return fallbackUrl;
  }
};

// URLs públicas das APIs para desenvolvimento (com logs inteligentes)
const DEV_API_URLS = {
  AUTH_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_USERS_URL, 
    'https://api-users-production-54ed.up.railway.app',
    'Users API'
  ),
  PRODUCTS_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_PRODUCTS_URL,
    'https://api-jornada-produto-production.up.railway.app',
    'Products API'
  ),
  CLIENTS_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_CUSTOMERS_URL,
    'https://api-customers-production.up.railway.app',
    'Customers API'
  ),
  ORDERS_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_DASHBOARD_URL,
    'https://api-dashboard-production-f3c4.up.railway.app',
    'Dashboard API'
  ),
  OPERATORS_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_USERS_URL,
    'https://api-users-production-54ed.up.railway.app',
    'Operators API (Users)'
  ),
  SUPPLIERS_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_CUSTOMERS_URL,
    'https://api-customers-production.up.railway.app',
    'Suppliers API (Customers)'
  ),
  USERLOGS_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_USERLOG_URL,
    'https://api-userlog-production.up.railway.app',
    'UserLog API'
  ),
  DELIVERY_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_DELIVERY_URL,
    'https://api-delivery-production-0851.up.railway.app',
    'Delivery API'
  ),
  AUDIT_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_AUDIT_URL,
    'https://api-audit-production.up.railway.app',
    'Audit API'
  ),
  VEHICLES_API: configureApiUrl(
    process.env.NEXT_PUBLIC_API_VEHICLES_URL,
    'https://api-vehicles-production.up.railway.app',
    'Vehicles API'
  ),
};

// URLs internas do Railway para produção (com logs inteligentes)
const PROD_API_URLS = {
  AUTH_API: configureApiUrl(
    process.env.BUN_USERS_SERVICE_URL,
    'http://api-users.railway.internal:8080',
    'Users API',
    false
  ),
  PRODUCTS_API: configureApiUrl(
    process.env.BUN_JORNADA_PRODUTO_SERVICE_URL,
    'http://api-jornada-produto.railway.internal:8080',
    'Products API',
    false
  ),
  CLIENTS_API: configureApiUrl(
    process.env.BUN_CUSTOMERS_SERVICE_URL,
    'http://api-customers.railway.internal:8080',
    'Customers API',
    false
  ),
  ORDERS_API: configureApiUrl(
    process.env.BUN_DASHBOARD_SERVICE_URL,
    'http://api-dashboard.railway.internal:8080',
    'Dashboard API',
    false
  ),
  OPERATORS_API: configureApiUrl(
    process.env.BUN_USERS_SERVICE_URL,
    'http://api-users.railway.internal:8080',
    'Operators API (Users)',
    false
  ),
  SUPPLIERS_API: configureApiUrl(
    process.env.BUN_CUSTOMERS_SERVICE_URL,
    'http://api-customers.railway.internal:8080',
    'Suppliers API (Customers)',
    false
  ),
  USERLOGS_API: configureApiUrl(
    process.env.BUN_USERLOG_SERVICE_URL,
    'http://api-userlog.railway.internal:8080',
    'UserLog API',
    false
  ),
  DELIVERY_API: configureApiUrl(
    process.env.BUN_DELIVERY_SERVICE_URL,
    'http://api-delivery.railway.internal:8080',
    'Delivery API',
    false
  ),
  AUDIT_API: configureApiUrl(
    process.env.BUN_AUDIT_SERVICE_URL,
    'http://api-audit.railway.internal:8080',
    'Audit API',
    false
  ),
  VEHICLES_API: configureApiUrl(
    process.env.BUN_VEHICLES_SERVICE_URL,
    'http://api-vehicles.railway.internal:8080',
    'Vehicles API',
    false
  ),
};

// Determina se está deployado no Railway em produção
const isRailwayProduction = process.env.RAILWAY_ENV === 'production';

// Configuração das APIs reais no Railway (Bun Services)
// Em desenvolvimento: usa URLs públicas (.up.railway.app)
// Em produção no Railway: usa URLs internas (.railway.internal)
export const API_CONFIG = isRailwayProduction ? PROD_API_URLS : DEV_API_URLS;

// Log inteligente da configuração apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('\n============================================');
  console.log('🚀 VEP NEXTJS - API CONFIGURATION STATUS');
  console.log('============================================');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Railway Environment: ${process.env.RAILWAY_ENV || 'not set'}`);
  console.log(`📍 Mode: ${isRailwayProduction ? 'PRODUCTION (Internal URLs)' : 'DEVELOPMENT (Public URLs)'}`);
  console.log('--------------------------------------------');
  
  // Contador de variáveis configuradas
  const envVarsSet = isRailwayProduction 
    ? Object.keys(PROD_API_URLS).filter(key => {
        const envVar = key === 'AUTH_API' || key === 'OPERATORS_API' ? process.env.BUN_USERS_SERVICE_URL :
                      key === 'CLIENTS_API' || key === 'SUPPLIERS_API' ? process.env.BUN_CUSTOMERS_SERVICE_URL :
                      key === 'PRODUCTS_API' ? process.env.BUN_JORNADA_PRODUTO_SERVICE_URL :
                      key === 'ORDERS_API' ? process.env.BUN_DASHBOARD_SERVICE_URL :
                      key === 'USERLOGS_API' ? process.env.BUN_USERLOG_SERVICE_URL :
                      key === 'DELIVERY_API' ? process.env.BUN_DELIVERY_SERVICE_URL :
                      key === 'AUDIT_API' ? process.env.BUN_AUDIT_SERVICE_URL :
                      key === 'VEHICLES_API' ? process.env.BUN_VEHICLES_SERVICE_URL :
                      undefined;
        return envVar !== undefined;
      })
    : Object.keys(DEV_API_URLS).filter(key => {
        const envVar = key === 'AUTH_API' || key === 'OPERATORS_API' ? process.env.NEXT_PUBLIC_API_USERS_URL :
                      key === 'CLIENTS_API' || key === 'SUPPLIERS_API' ? process.env.NEXT_PUBLIC_API_CUSTOMERS_URL :
                      key === 'PRODUCTS_API' ? process.env.NEXT_PUBLIC_API_PRODUCTS_URL :
                      key === 'ORDERS_API' ? process.env.NEXT_PUBLIC_API_DASHBOARD_URL :
                      key === 'USERLOGS_API' ? process.env.NEXT_PUBLIC_API_USERLOG_URL :
                      key === 'DELIVERY_API' ? process.env.NEXT_PUBLIC_API_DELIVERY_URL :
                      key === 'AUDIT_API' ? process.env.NEXT_PUBLIC_API_AUDIT_URL :
                      key === 'VEHICLES_API' ? process.env.NEXT_PUBLIC_API_VEHICLES_URL :
                      undefined;
        return envVar !== undefined;
      });
  
  const totalApis = Object.keys(API_CONFIG).length;
  const configuredApis = envVarsSet.length;
  
  console.log(`📊 Variáveis de ambiente: ${configuredApis}/${totalApis} configuradas`);
  
  if (configuredApis === totalApis) {
    console.log('✅ Todas as variáveis de ambiente estão configuradas!');
  } else if (configuredApis > 0) {
    console.log('⚠️  Algumas variáveis de ambiente não estão configuradas (usando URLs padrão)');
  } else {
    console.log('❌ Nenhuma variável de ambiente configurada (usando todas as URLs padrão)');
    console.log('💡 Configure as variáveis no arquivo .env.local para personalizar');
  }
  
  console.log('--------------------------------------------');
  console.log('📡 Endpoints finais configurados:');
  Object.entries(API_CONFIG).forEach(([key, url]) => {
    const isCustom = isRailwayProduction 
      ? (key === 'AUTH_API' || key === 'OPERATORS_API' ? !!process.env.BUN_USERS_SERVICE_URL :
         key === 'CLIENTS_API' || key === 'SUPPLIERS_API' ? !!process.env.BUN_CUSTOMERS_SERVICE_URL :
         key === 'PRODUCTS_API' ? !!process.env.BUN_JORNADA_PRODUTO_SERVICE_URL :
         key === 'ORDERS_API' ? !!process.env.BUN_DASHBOARD_SERVICE_URL :
         key === 'USERLOGS_API' ? !!process.env.BUN_USERLOG_SERVICE_URL :
         key === 'DELIVERY_API' ? !!process.env.BUN_DELIVERY_SERVICE_URL :
         key === 'AUDIT_API' ? !!process.env.BUN_AUDIT_SERVICE_URL :
         key === 'VEHICLES_API' ? !!process.env.BUN_VEHICLES_SERVICE_URL :
         false)
      : (key === 'AUTH_API' || key === 'OPERATORS_API' ? !!process.env.NEXT_PUBLIC_API_USERS_URL :
         key === 'CLIENTS_API' || key === 'SUPPLIERS_API' ? !!process.env.NEXT_PUBLIC_API_CUSTOMERS_URL :
         key === 'PRODUCTS_API' ? !!process.env.NEXT_PUBLIC_API_PRODUCTS_URL :
         key === 'ORDERS_API' ? !!process.env.NEXT_PUBLIC_API_DASHBOARD_URL :
         key === 'USERLOGS_API' ? !!process.env.NEXT_PUBLIC_API_USERLOG_URL :
         key === 'DELIVERY_API' ? !!process.env.NEXT_PUBLIC_API_DELIVERY_URL :
         key === 'AUDIT_API' ? !!process.env.NEXT_PUBLIC_API_AUDIT_URL :
         key === 'VEHICLES_API' ? !!process.env.NEXT_PUBLIC_API_VEHICLES_URL :
         false);
    
    const icon = isCustom ? '🔧' : '🌐';
    const source = isCustom ? '(env var)' : '(default)';
    console.log(`   ${icon} ${key.padEnd(15)}: ${url} ${source}`);
  });
  console.log('============================================\n');
}

// Headers padrão para as requisições
// Token agora é enviado automaticamente via httpOnly cookies
export const getDefaultHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Authorization header não é mais necessário pois usamos cookies httpOnly
  // Os cookies são enviados automaticamente quando incluímos credentials: 'include'
  
  return headers;
};

// Função helper para construir URLs completas
export const buildUrl = (baseUrl: string, endpoint: string) => {
  // Remove barra final da baseUrl e inicial do endpoint
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
};