#!/usr/bin/env node

/**
 * Script para executar testes automatizados das APIs Railway
 * 
 * Uso:
 *   npm run test-apis
 *   node scripts/test-apis.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Configuração das URLs das APIs (substitua com as URLs reais)
const API_CONFIG = {
  AUTH_API: process.env.BUN_USERS_SERVICE_URL || 'https://your-users-api.railway.app',
  PRODUCTS_API: process.env.BUN_JORNADA_PRODUTO_SERVICE_URL || 'https://your-products-api.railway.app',
  CLIENTS_API: process.env.BUN_CUSTOMERS_SERVICE_URL || 'https://your-customers-api.railway.app',
  ORDERS_API: process.env.BUN_DASHBOARD_SERVICE_URL || 'https://your-dashboard-api.railway.app',
  SUPPLIERS_API: process.env.BUN_CUSTOMERS_SERVICE_URL || 'https://your-customers-api.railway.app',
  USERLOGS_API: process.env.BUN_USERLOG_SERVICE_URL || 'https://your-userlog-api.railway.app',
  DELIVERY_API: process.env.BUN_DELIVERY_SERVICE_URL || 'https://your-delivery-api.railway.app',
  VEHICLES_API: process.env.BUN_VEHICLES_SERVICE_URL || 'https://your-vehicles-api.railway.app',
};

// Token de autenticação (será preenchido após login)
let authToken = '';

// Dados de teste
const testData = {
  product: {
    code: 'TEST001',
    name: 'Produto Teste',
    description: 'Produto criado automaticamente para teste',
    category: 'Frutas',
    unit: 'KG',
    price: 10.50,
    stock: 100,
    minStock: 10,
    supplier: 'Fornecedor Teste',
    barcode: '7890000000001',
    active: true
  },
  client: {
    code: 'CLI001',
    name: 'Cliente Teste',
    type: 'PJ',
    document: '00000000000191',
    email: 'teste@empresa.com',
    phone: '11999999999',
    whatsapp: '11999999999',
    address: 'Rua Teste',
    number: '123',
    complement: 'Sala 1',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000000',
    latitude: -23.550520,
    longitude: -46.633308,
    deliveryNotes: 'Entregar das 8h às 17h',
    active: true
  }
};

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const defaultOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(defaultOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: null
        };
        
        try {
          result.data = JSON.parse(data);
        } catch {
          result.data = data;
        }
        
        resolve(result);
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Função para construir URL completa
function buildUrl(baseUrl, endpoint) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

// Função para testar um endpoint
async function testEndpoint(name, url, options = {}) {
  const startTime = Date.now();
  console.log(`\nTestando: ${name}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await makeRequest(url, options);
    const duration = Date.now() - startTime;
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duração: ${duration}ms`);
    
    const result = {
      endpoint: name,
      method: options.method || 'GET',
      url,
      timestamp: new Date().toISOString(),
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      duration,
      data: response.data
    };
    
    if (result.success) {
      console.log('✅ Sucesso');
    } else {
      console.log('❌ Falha');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Erro:', error.message);
    return {
      endpoint: name,
      method: options.method || 'GET',
      url,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes das APIs Railway...\n');
  
  const results = [];
  const startTime = Date.now();
  
  // 1. Teste de autenticação
  console.log('====== AUTENTICAÇÃO ======');
  const authResult = await testEndpoint(
    'POST /auth/login',
    buildUrl(API_CONFIG.AUTH_API, '/auth/login'),
    {
      method: 'POST',
      body: {
        email: 'admin@veplim.com',
        password: 'admin123',
        role: 'admin'
      }
    }
  );
  results.push(authResult);
  
  // Extrair token se login bem-sucedido
  if (authResult.success && authResult.data && authResult.data.token) {
    authToken = authResult.data.token;
    console.log('Token obtido:', authToken.substring(0, 20) + '...');
  }
  
  // Headers com autenticação
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  
  // 2. Teste de Produtos
  console.log('\n====== PRODUTOS ======');
  
  // Listar produtos
  results.push(await testEndpoint(
    'GET /api/products',
    buildUrl(API_CONFIG.PRODUCTS_API, '/api/products'),
    { headers: authHeaders }
  ));
  
  // Criar produto
  const createProductResult = await testEndpoint(
    'POST /api/products',
    buildUrl(API_CONFIG.PRODUCTS_API, '/api/products'),
    {
      method: 'POST',
      headers: authHeaders,
      body: testData.product
    }
  );
  results.push(createProductResult);
  
  // 3. Teste de Clientes
  console.log('\n====== CLIENTES ======');
  
  // Listar clientes
  results.push(await testEndpoint(
    'GET /api/customers',
    buildUrl(API_CONFIG.CLIENTS_API, '/api/customers'),
    { headers: authHeaders }
  ));
  
  // Criar cliente
  results.push(await testEndpoint(
    'POST /api/customers',
    buildUrl(API_CONFIG.CLIENTS_API, '/api/customers'),
    {
      method: 'POST',
      headers: authHeaders,
      body: testData.client
    }
  ));
  
  // 4. Teste de Pedidos
  console.log('\n====== PEDIDOS ======');
  
  results.push(await testEndpoint(
    'GET /api/orders',
    buildUrl(API_CONFIG.ORDERS_API, '/api/orders'),
    { headers: authHeaders }
  ));
  
  // 5. Teste de Entregas
  console.log('\n====== ENTREGAS ======');
  
  results.push(await testEndpoint(
    'GET /api/deliveries',
    buildUrl(API_CONFIG.DELIVERY_API, '/api/deliveries'),
    { headers: authHeaders }
  ));
  
  // 6. Teste de Veículos
  console.log('\n====== VEÍCULOS ======');
  
  results.push(await testEndpoint(
    'GET /api/vehicles',
    buildUrl(API_CONFIG.VEHICLES_API, '/api/vehicles'),
    { headers: authHeaders }
  ));
  
  // 7. Teste de UserLogs
  console.log('\n====== USER LOGS ======');
  
  results.push(await testEndpoint(
    'POST /api/logs',
    buildUrl(API_CONFIG.USERLOGS_API, '/api/logs'),
    {
      method: 'POST',
      headers: authHeaders,
      body: {
        action: 'API_TEST_COMPLETED',
        details: {
          module: 'API_TEST',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        userId: 'test-script',
        module: 'API_TEST'
      }
    }
  ));
  
  const duration = Date.now() - startTime;
  
  // Resumo dos testes
  console.log('\n====== RESUMO ======');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`Total de testes: ${results.length}`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Falha: ${failCount}`);
  console.log(`⏱️ Duração total: ${duration}ms`);
  
  // Salvar resultados
  await saveResults(results);
  
  return results;
}

// Função para salvar resultados em arquivos JSON
async function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const resultsDir = path.join(__dirname, '..', 'api-test-results');
  const responsesDir = path.join(resultsDir, 'responses');
  
  try {
    // Criar diretórios
    await fs.mkdir(resultsDir, { recursive: true });
    await fs.mkdir(responsesDir, { recursive: true });
    
    // Salvar resultado completo
    const summary = {
      timestamp: new Date().toISOString(),
      duration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
    const summaryFile = path.join(resultsDir, `test-results-${timestamp}.json`);
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Resumo salvo em: ${summaryFile}`);
    
    // Salvar respostas individuais
    for (const result of results) {
      if (result.success && result.data) {
        const filename = `${result.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
        const filepath = path.join(responsesDir, filename);
        await fs.writeFile(filepath, JSON.stringify(result.data, null, 2));
      }
    }
    
    // Criar índice
    const index = results
      .filter(r => r.success && r.data)
      .map(r => ({
        endpoint: r.endpoint,
        method: r.method,
        status: r.status,
        file: `${r.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}.json`
      }));
    
    const indexFile = path.join(responsesDir, 'index.json');
    await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
    console.log(`📁 Respostas individuais salvas em: ${responsesDir}`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar resultados:', error);
  }
}

// Executar testes
runAllTests()
  .then(() => {
    console.log('\n✅ Testes concluídos!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });