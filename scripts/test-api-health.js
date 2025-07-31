#!/usr/bin/env node

/**
 * Script para testar a saúde das APIs Railway
 * Testa diferentes endpoints e formatos para diagnóstico
 */

const https = require('https');

// URLs das APIs
const API_URLS = [
  { name: 'Users/Auth', url: 'https://api-users-production-54ed.up.railway.app' },
  { name: 'Produtos', url: 'https://api-jornada-produto-production.up.railway.app' },
  { name: 'Clientes', url: 'https://api-customers-production.up.railway.app' },
  { name: 'Dashboard', url: 'https://api-dashboard-production-f3c4.up.railway.app' },
  { name: 'Entregas', url: 'https://api-delivery-production-0851.up.railway.app' },
  { name: 'UserLogs', url: 'https://api-userlog-production.up.railway.app' },
  { name: 'Auditoria', url: 'https://api-audit-production.up.railway.app' },
  { name: 'Veículos', url: 'https://api-vehicles-production.up.railway.app' },
];

// Possíveis endpoints de saúde
const HEALTH_ENDPOINTS = [
  '/',
  '/health',
  '/api/health',
  '/status',
  '/api/status',
  '/ping',
  '/api',
];

async function testUrl(url, endpoint = '') {
  return new Promise((resolve) => {
    const fullUrl = url + endpoint;
    const startTime = Date.now();
    
    https.get(fullUrl, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: fullUrl,
          status: res.statusCode,
          statusText: res.statusMessage,
          duration: Date.now() - startTime,
          headers: res.headers,
          data: data.substring(0, 200) // Primeiros 200 chars
        });
      });
    }).on('error', (err) => {
      resolve({
        url: fullUrl,
        error: err.message,
        duration: Date.now() - startTime
      });
    });
  });
}

async function runHealthChecks() {
  console.log('🏥 Verificando saúde das APIs Railway...\n');
  
  for (const api of API_URLS) {
    console.log(`\n📍 ${api.name} (${api.url})`);
    console.log('─'.repeat(60));
    
    let foundWorking = false;
    
    for (const endpoint of HEALTH_ENDPOINTS) {
      const result = await testUrl(api.url, endpoint);
      
      if (result.error) {
        console.log(`  ${endpoint || '/'}: ❌ Erro - ${result.error}`);
      } else {
        const icon = result.status >= 200 && result.status < 300 ? '✅' : 
                     result.status >= 400 && result.status < 500 ? '⚠️' : '❌';
        
        console.log(`  ${endpoint || '/'}: ${icon} ${result.status} ${result.statusText} (${result.duration}ms)`);
        
        if (result.status >= 200 && result.status < 400) {
          foundWorking = true;
          if (result.headers['content-type']) {
            console.log(`    Content-Type: ${result.headers['content-type']}`);
          }
          if (result.data) {
            console.log(`    Response: ${result.data.replace(/\n/g, ' ').substring(0, 100)}...`);
          }
        }
      }
    }
    
    if (!foundWorking) {
      console.log('\n  ⚠️  Nenhum endpoint funcionando encontrado');
    }
  }
  
  console.log('\n\n📝 Resumo:');
  console.log('- APIs podem estar offline ou com problemas de deployment');
  console.log('- Verifique o status no painel do Railway');
  console.log('- As rotas podem ser diferentes das esperadas');
  console.log('- Pode ser necessário autenticação em todos os endpoints');
}

// Executar verificações
runHealthChecks()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
  })
  .catch(error => {
    console.error('\n❌ Erro:', error);
  });