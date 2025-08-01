#!/usr/bin/env bun

// Script detalhado para testar comportamentos específicos da API
// Execute com: bun run test-financesweb-detailed.ts

import { FINANCESWEB_CONFIG } from "./src/config/financesweb";

interface TestResult {
  endpoint: string;
  success: boolean;
  totalRecords?: number;
  sampleData?: any;
  error?: string;
  responseStructure?: string;
  supportsPagination?: boolean;
  availableFields?: string[];
}

const results: TestResult[] = [];

async function makeRequest(tabela: string, filtro?: string, options?: any) {
  const requestBody = {
    api_key: FINANCESWEB_CONFIG.apiKey,
    tabela,
    ...(filtro && { filtro }),
    ...options,
  };

  const response = await fetch(FINANCESWEB_CONFIG.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function analyzeEndpoint(tabela: string, filtro?: string): Promise<TestResult> {
  console.log(`\n🔍 Analisando: ${tabela} ${filtro ? `(filtro: ${filtro})` : ""}`);
  
  const result: TestResult = {
    endpoint: `${tabela}${filtro ? ` [${filtro}]` : ""}`,
    success: false,
  };

  try {
    // Primeira requisição sem paginação
    const data = await makeRequest(tabela, filtro);
    result.success = true;

    // Determinar estrutura da resposta
    if (Array.isArray(data)) {
      result.responseStructure = "Array direto";
      result.totalRecords = data.length;
      if (data.length > 0) {
        result.sampleData = data[0];
        result.availableFields = Object.keys(data[0]);
      }
    } else if (typeof data === "object") {
      result.responseStructure = `Objeto com chaves: ${Object.keys(data).join(", ")}`;
      
      // Procurar array de dados
      const dataKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (dataKey) {
        result.totalRecords = data[dataKey].length;
        if (data[dataKey].length > 0) {
          result.sampleData = data[dataKey][0];
          result.availableFields = Object.keys(data[dataKey][0]);
        }
      }
    }

    // Testar paginação
    if (result.totalRecords && result.totalRecords > 0) {
      try {
        const paginatedData = await makeRequest(tabela, filtro, { limit: 5, offset: 0 });
        const recordCount = Array.isArray(paginatedData) 
          ? paginatedData.length 
          : Object.values(paginatedData).find(v => Array.isArray(v))?.length || 0;
        
        result.supportsPagination = recordCount === 5;
      } catch {
        result.supportsPagination = false;
      }
    }

    console.log(`✅ Sucesso! ${result.totalRecords || 0} registros encontrados`);
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.log(`❌ Erro: ${result.error}`);
  }

  results.push(result);
  return result;
}

async function testPaginationBehavior() {
  console.log("\n📄 TESTANDO COMPORTAMENTO DE PAGINAÇÃO");
  
  const testCases = [
    { limit: 10, offset: 0 },
    { limit: 50, offset: 0 },
    { limit: 100, offset: 0 },
    { limit: 10, offset: 10 },
    { limit: 10, offset: 100 },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Testando limit=${testCase.limit}, offset=${testCase.offset}`);
      const data = await makeRequest("vw_pedidos_venda_produtos", null, testCase);
      const count = Array.isArray(data) ? data.length : 
        Object.values(data).find(v => Array.isArray(v))?.length || 0;
      console.log(`  ✓ Retornou ${count} registros`);
    } catch (error) {
      console.log(`  ✗ Erro: ${error}`);
    }
  }
}

async function testFilterOperators() {
  console.log("\n🔧 TESTANDO OPERADORES DE FILTRO");
  
  const filterTests = [
    { tabela: "produtos", filtro: "fnc_pro_status=eq.Ativo", desc: "Igual (eq)" },
    { tabela: "produtos", filtro: "fnc_pro_preco_venda=gt.0", desc: "Maior que (gt)" },
    { tabela: "produtos", filtro: "fnc_pro_preco_venda=gte.10", desc: "Maior ou igual (gte)" },
    { tabela: "produtos", filtro: "fnc_pro_preco_venda=lt.100", desc: "Menor que (lt)" },
    { tabela: "produtos", filtro: "fnc_pro_preco_venda=lte.50", desc: "Menor ou igual (lte)" },
    { tabela: "produtos", filtro: "fnc_pro_descricao=like.*ARROZ*", desc: "Like com wildcards" },
    { tabela: "produtos", filtro: "fnc_pro_descricao=ilike.*arroz*", desc: "iLike (case insensitive)" },
    { tabela: "pessoas", filtro: "fnc_pes_tipo=in.(PJ,PF)", desc: "In (múltiplos valores)" },
    { tabela: "produtos", filtro: "fnc_pro_status=neq.Inativo", desc: "Diferente (neq)" },
  ];

  for (const test of filterTests) {
    console.log(`\n  ${test.desc}: ${test.filtro}`);
    try {
      const data = await makeRequest(test.tabela, test.filtro);
      const count = Array.isArray(data) ? data.length : 
        Object.values(data).find(v => Array.isArray(v))?.length || 0;
      console.log(`  ✓ Funcionou! ${count} registros`);
    } catch (error) {
      console.log(`  ✗ Não suportado: ${error}`);
    }
  }
}

async function runDetailedTests() {
  console.log("🚀 INICIANDO TESTES DETALHADOS DA API FINANCESWEB");
  console.log("=".repeat(60));

  if (!FINANCESWEB_CONFIG.apiKey) {
    console.error("❌ Configure FINANCESWEB_API_KEY!");
    process.exit(1);
  }

  // 1. Testar endpoints principais
  console.log("\n1️⃣ ENDPOINTS PRINCIPAIS");
  await analyzeEndpoint("produtos");
  await analyzeEndpoint("operadores");
  await analyzeEndpoint("pessoas");
  await analyzeEndpoint("vw_pedidos_venda_produtos");

  // 2. Testar variações de nomes de tabelas
  console.log("\n2️⃣ VARIAÇÕES DE NOMES");
  await analyzeEndpoint("produto"); // singular
  await analyzeEndpoint("pedidos_venda_produtos");
  await analyzeEndpoint("pedidos_vendas_produtos");
  await analyzeEndpoint("vw_pedidos_vendas_produtos");

  // 3. Testar paginação
  await testPaginationBehavior();

  // 4. Testar operadores de filtro
  await testFilterOperators();

  // 5. Gerar relatório final
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 RELATÓRIO FINAL");
  console.log("=".repeat(60));

  const successfulEndpoints = results.filter(r => r.success);
  const failedEndpoints = results.filter(r => !r.success);

  console.log(`\n✅ Endpoints funcionando (${successfulEndpoints.length}):`);
  for (const result of successfulEndpoints) {
    console.log(`\n  📌 ${result.endpoint}`);
    console.log(`     - Estrutura: ${result.responseStructure}`);
    console.log(`     - Total de registros: ${result.totalRecords}`);
    console.log(`     - Suporta paginação: ${result.supportsPagination ? "Sim" : "Não"}`);
    if (result.availableFields && result.availableFields.length > 0) {
      console.log(`     - Campos (${result.availableFields.length}): ${result.availableFields.slice(0, 5).join(", ")}...`);
    }
  }

  console.log(`\n❌ Endpoints falhando (${failedEndpoints.length}):`);
  for (const result of failedEndpoints) {
    console.log(`  - ${result.endpoint}: ${result.error}`);
  }

  // Salvar relatório em arquivo
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: successfulEndpoints.length,
      failed: failedEndpoints.length,
    },
    results: results,
  };

  await Bun.write("financesweb-api-report.json", JSON.stringify(report, null, 2));
  console.log("\n💾 Relatório completo salvo em: financesweb-api-report.json");
}

// Executar testes
runDetailedTests().catch(error => {
  console.error(`\n❌ Erro fatal: ${error}`);
  process.exit(1);
});