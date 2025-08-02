#!/usr/bin/env node

/**
 * Test Script - Verificar se todos os dados mockados foram removidos
 * Execute com: node test-real-data.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando remoção de dados mockados...\n');

const issues = [];

// Test 1: Check SmartDataService
console.log('1️⃣ Verificando SmartDataService...');
const smartDataPath = './src/services/data/SmartDataService.ts';
if (fs.existsSync(smartDataPath)) {
  const smartDataContent = fs.readFileSync(smartDataPath, 'utf8');
  if (smartDataContent.includes('getDefaultProducts') || smartDataContent.includes('getDefaultCustomers')) {
    issues.push('❌ SmartDataService ainda contém métodos de dados padrão');
  } else if (smartDataContent.includes('Produto de Limpeza Multiuso') || smartDataContent.includes('Cliente Exemplo')) {
    issues.push('❌ SmartDataService ainda contém dados mockados');
  } else {
    console.log('✅ SmartDataService limpo');
  }
}

// Test 2: Check Dashboard Service
console.log('\n2️⃣ Verificando DashboardService...');
const dashboardServicePath = './src/services/database/dashboardService.ts';
if (fs.existsSync(dashboardServicePath)) {
  const dashboardContent = fs.readFileSync(dashboardServicePath, 'utf8');
  if (!dashboardContent.includes('produtos_financesweb') || !dashboardContent.includes('pessoas_financesweb')) {
    issues.push('❌ DashboardService não está usando as tabelas corretas');
  } else {
    console.log('✅ DashboardService usando tabelas corretas');
  }
}

// Test 3: Check Sync Status API
console.log('\n3️⃣ Verificando Sync Status API...');
const syncStatusPath = './src/app/api/sync/status/route.ts';
if (fs.existsSync(syncStatusPath)) {
  const syncStatusContent = fs.readFileSync(syncStatusPath, 'utf8');
  if (syncStatusContent.includes('2 * 60 * 60 * 1000') || syncStatusContent.includes('recordCount: 967')) {
    issues.push('❌ Sync Status API ainda retorna dados mockados');
  } else if (syncStatusContent.includes('SyncService.getSyncStatus')) {
    console.log('✅ Sync Status API usando dados reais');
  } else {
    issues.push('❌ Sync Status API não está usando SyncService');
  }
}

// Test 4: Check Dashboard Page
console.log('\n4️⃣ Verificando Dashboard Page...');
const dashboardPagePath = './src/app/dashboard/page.tsx';
if (fs.existsSync(dashboardPagePath)) {
  const dashboardContent = fs.readFileSync(dashboardPagePath, 'utf8');
  if (dashboardContent.includes("{ id: '#1247', cliente: 'Supermercado Central'")) {
    issues.push('❌ Dashboard ainda contém pedidos hardcoded');
  } else if (dashboardContent.includes('recentOrders.map')) {
    console.log('✅ Dashboard usando dados dinâmicos');
  }
}

// Test 5: Check Products Page
console.log('\n5️⃣ Verificando Products Page...');
const productsPagePath = './src/app/produtos/page.tsx';
if (fs.existsSync(productsPagePath)) {
  const productsContent = fs.readFileSync(productsPagePath, 'utf8');
  if (productsContent.includes('DEMO_PRODUCTS') || productsContent.includes('Detergente Neutro 5L')) {
    issues.push('❌ Products page ainda contém dados de demonstração');
  } else {
    console.log('✅ Products page sem dados mockados');
  }
}

// Test 6: Check Customers Page
console.log('\n6️⃣ Verificando Customers Page...');
const customersPagePath = './src/app/clientes/page.tsx';
if (fs.existsSync(customersPagePath)) {
  const customersContent = fs.readFileSync(customersPagePath, 'utf8');
  if (customersContent.includes('DEMO_CUSTOMERS') || customersContent.includes('Supermercado Central')) {
    issues.push('❌ Customers page ainda contém dados de demonstração');
  } else {
    console.log('✅ Customers page sem dados mockados');
  }
}

// Test 7: Check Delivery Map
console.log('\n7️⃣ Verificando Delivery Map...');
const deliveryMapPath = './src/components/DeliveryMap.tsx';
if (fs.existsSync(deliveryMapPath)) {
  const deliveryContent = fs.readFileSync(deliveryMapPath, 'utf8');
  if (deliveryContent.includes('Marcos Oliveira') || deliveryContent.includes('Ana Silva')) {
    issues.push('❌ Delivery Map ainda contém pontos de entrega de exemplo');
  } else if (deliveryContent.includes('Nenhuma entrega em andamento')) {
    console.log('✅ Delivery Map com estado vazio adequado');
  }
}

// Test 8: Check API Error Handling
console.log('\n8️⃣ Verificando tratamento de erros nas APIs...');
const productsApiPath = './src/app/api/produtos/route.ts';
if (fs.existsSync(productsApiPath)) {
  const productsApiContent = fs.readFileSync(productsApiPath, 'utf8');
  if (productsApiContent.includes('DATABASE_URL') && productsApiContent.includes('status: 503')) {
    console.log('✅ API de produtos com tratamento de erro adequado');
  } else {
    issues.push('❌ API de produtos sem tratamento de erro de banco de dados');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMO DA VERIFICAÇÃO:\n');

if (issues.length === 0) {
  console.log('🎉 SUCESSO! Todos os dados mockados foram removidos!');
  console.log('✅ A aplicação está usando apenas dados reais do PostgreSQL');
} else {
  console.log('⚠️  PROBLEMAS ENCONTRADOS:\n');
  issues.forEach(issue => console.log(issue));
  console.log('\n❗ Corrija os problemas acima antes de fazer deploy');
  process.exit(1);
}

console.log('\n💡 Dica: Certifique-se de ter o DATABASE_URL configurado para testar com dados reais');