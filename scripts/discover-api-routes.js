#!/usr/bin/env node

/**
 * Script para descobrir as rotas reais das APIs Railway
 */

const https = require('https');

// API que está funcionando
const WORKING_API = 'https://api-users-production-54ed.up.railway.app';

// Possíveis variações de rotas para testar
const AUTH_ROUTES = [
  '/auth/login',
  '/api/auth/login',
  '/login',
  '/api/login',
  '/users/login',
  '/api/users/login',
  '/authenticate',
  '/api/authenticate',
];

const USER_ROUTES = [
  '/users',
  '/api/users',
  '/user',
  '/api/user',
  '/operators',
  '/api/operators',
];

async function testRoute(baseUrl, route, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(baseUrl + route);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 5000
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          route,
          method: reqOptions.method,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data.substring(0, 300)
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        route,
        method: reqOptions.method,
        error: err.message
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function discoverRoutes() {
  console.log('🔍 Descobrindo rotas das APIs Railway...\n');
  
  // Testar API de usuários que está funcionando
  console.log('📍 API Users/Auth:', WORKING_API);
  console.log('─'.repeat(60));
  
  // Testar rotas de autenticação
  console.log('\n🔐 Testando rotas de autenticação:');
  for (const route of AUTH_ROUTES) {
    // GET
    const getResult = await testRoute(WORKING_API, route);
    if (!getResult.error && getResult.status !== 404) {
      console.log(`  GET ${route}: ${getResult.status} ${getResult.statusText}`);
    }
    
    // POST com credenciais
    const postResult = await testRoute(WORKING_API, route, {
      method: 'POST',
      body: {
        email: 'admin@veplim.com',
        password: 'admin123'
      }
    });
    if (!postResult.error && postResult.status !== 404) {
      const icon = postResult.status >= 200 && postResult.status < 300 ? '✅' : '⚠️';
      console.log(`  POST ${route}: ${icon} ${postResult.status} ${postResult.statusText}`);
      if (postResult.data) {
        console.log(`    Response: ${postResult.data.replace(/\n/g, ' ').substring(0, 100)}...`);
      }
    }
  }
  
  // Testar rotas de usuários
  console.log('\n👥 Testando rotas de usuários:');
  for (const route of USER_ROUTES) {
    const result = await testRoute(WORKING_API, route);
    if (!result.error && result.status !== 404) {
      const icon = result.status >= 200 && result.status < 300 ? '✅' : 
                   result.status === 401 ? '🔒' : '⚠️';
      console.log(`  GET ${route}: ${icon} ${result.status} ${result.statusText}`);
      if (result.status === 401) {
        console.log('    (Requer autenticação)');
      }
    }
  }
  
  // Testar outras APIs para encontrar padrões
  console.log('\n\n🔍 Testando padrões em outras APIs:');
  
  const OTHER_APIS = [
    { name: 'Produtos', url: 'https://api-jornada-produto-production.up.railway.app' },
    { name: 'Clientes', url: 'https://api-customers-production.up.railway.app' },
  ];
  
  const COMMON_PATTERNS = [
    '',
    '/products',
    '/api/products',
    '/produto',
    '/api/produto',
    '/customers',
    '/api/customers',
    '/cliente',
    '/api/cliente',
  ];
  
  for (const api of OTHER_APIS) {
    console.log(`\n${api.name}: ${api.url}`);
    let found = false;
    
    for (const route of COMMON_PATTERNS) {
      const result = await testRoute(api.url, route);
      if (!result.error && result.status !== 404) {
        const icon = result.status >= 200 && result.status < 300 ? '✅' : 
                     result.status === 401 ? '🔒' : '⚠️';
        console.log(`  GET ${route || '/'}: ${icon} ${result.status} ${result.statusText}`);
        if (result.data && result.status < 400) {
          console.log(`    Response: ${result.data.replace(/\n/g, ' ').substring(0, 100)}...`);
        }
        found = true;
      }
    }
    
    if (!found) {
      console.log('  ❌ Nenhuma rota encontrada');
    }
  }
  
  console.log('\n\n📝 Dicas:');
  console.log('- A API de Users está online e respondendo na raiz');
  console.log('- As outras APIs podem ter estruturas de rotas diferentes');
  console.log('- Pode ser necessário verificar a documentação ou código fonte das APIs');
  console.log('- Algumas rotas podem requerer autenticação JWT');
}

// Executar descoberta
discoverRoutes()
  .then(() => {
    console.log('\n✅ Descoberta concluída!');
  })
  .catch(error => {
    console.error('\n❌ Erro:', error);
  });