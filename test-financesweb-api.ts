#!/usr/bin/env bun

// Script de testes para explorar a API FinancesWeb
// Execute com: bun run test-financesweb-api.ts

import { FINANCESWEB_CONFIG } from "./src/config/financesweb";

// Configuração de cores para output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Helper para log colorido
function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper para testar uma requisição
async function testRequest(
  tabela: string,
  filtro?: string,
  options?: { limit?: number; offset?: number }
) {
  log(`\n${"=".repeat(60)}`, colors.bright);
  log(`Testando: ${tabela}`, colors.cyan);
  if (filtro) log(`Filtro: ${filtro}`, colors.blue);
  log("=".repeat(60), colors.bright);

  try {
    const requestBody: any = {
      api_key: FINANCESWEB_CONFIG.apiKey,
      tabela,
      ...(filtro && { filtro }),
      ...(options?.limit && { limit: options.limit }),
      ...(options?.offset && { offset: options.offset }),
    };

    log("\n📤 Request Body:", colors.yellow);
    console.log(JSON.stringify(requestBody, null, 2));

    const startTime = Date.now();
    const response = await fetch(FINANCESWEB_CONFIG.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const responseTime = Date.now() - startTime;

    log(`\n📡 Response Status: ${response.status} (${responseTime}ms)`, colors.blue);
    log(`Headers:`, colors.yellow);
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      log("\n❌ Resposta não é JSON válido:", colors.red);
      console.log(responseText.substring(0, 500));
      return null;
    }

    log("\n✅ Resposta parseada com sucesso!", colors.green);

    // Analisar estrutura da resposta
    log("\n📊 Análise da Resposta:", colors.cyan);
    log(`  - Tipo: ${Array.isArray(data) ? "Array" : typeof data}`, colors.yellow);
    
    if (Array.isArray(data)) {
      log(`  - Total de registros: ${data.length}`, colors.yellow);
      if (data.length > 0) {
        log(`  - Campos do primeiro registro:`, colors.yellow);
        Object.keys(data[0]).forEach(key => {
          const value = data[0][key];
          const type = value === null ? "null" : typeof value;
          console.log(`    ${key}: ${type}`);
        });
        
        log("\n📋 Amostra (primeiro registro):", colors.blue);
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else if (typeof data === "object") {
      log(`  - Chaves do objeto: ${Object.keys(data).join(", ")}`, colors.yellow);
      
      // Verificar se os dados estão em alguma propriedade específica
      const possibleDataKeys = [tabela, "data", "records", "items", "result"];
      for (const key of possibleDataKeys) {
        if (data[key] && Array.isArray(data[key])) {
          log(`  - Dados encontrados em: data.${key}`, colors.green);
          log(`  - Total de registros: ${data[key].length}`, colors.yellow);
          
          if (data[key].length > 0) {
            log("\n📋 Amostra (primeiro registro):", colors.blue);
            console.log(JSON.stringify(data[key][0], null, 2));
          }
          break;
        }
      }
    }

    return data;
  } catch (error) {
    log(`\n❌ Erro na requisição: ${error}`, colors.red);
    return null;
  }
}

// Testes específicos para cada endpoint
async function runTests() {
  log("\n🚀 Iniciando bateria de testes da API FinancesWeb", colors.bright + colors.green);
  log(`API URL: ${FINANCESWEB_CONFIG.baseUrl}`, colors.cyan);
  log(`API Key: ${FINANCESWEB_CONFIG.apiKey ? "✓ Configurada" : "✗ Não configurada"}`, 
    FINANCESWEB_CONFIG.apiKey ? colors.green : colors.red);

  if (!FINANCESWEB_CONFIG.apiKey) {
    log("\n❌ Configure FINANCESWEB_API_KEY antes de executar os testes!", colors.red);
    process.exit(1);
  }

  // 1. Testar Produtos
  log("\n\n1️⃣  TESTANDO PRODUTOS", colors.bright + colors.yellow);
  await testRequest("produtos");
  await testRequest("produtos", "fnc_pro_status=eq.Ativo");
  await testRequest("produtos", null, { limit: 5 });

  // 2. Testar Operadores
  log("\n\n2️⃣  TESTANDO OPERADORES", colors.bright + colors.yellow);
  await testRequest("operadores");
  await testRequest("operadores", "fnc_ope_status=eq.Ativo");

  // 3. Testar Pessoas com diferentes filtros
  log("\n\n3️⃣  TESTANDO PESSOAS", colors.bright + colors.yellow);
  await testRequest("pessoas");
  await testRequest("pessoas", "fnc_pes_tipo=eq.PJ");
  await testRequest("pessoas", "fnc_pes_tipo=eq.PF");
  await testRequest("pessoas", "fnc_pes_tipo_cadastro=eq.Cliente");
  await testRequest("pessoas", "fnc_pes_tipo_cadastro=eq.Fornecedor");
  await testRequest("pessoas", "fnc_pes_tipo=eq.PJ&fnc_pes_tipo_cadastro=eq.Cliente");

  // 4. Testar Pedidos com diferentes abordagens
  log("\n\n4️⃣  TESTANDO PEDIDOS", colors.bright + colors.yellow);
  await testRequest("vw_pedidos_venda_produtos");
  await testRequest("vw_pedidos_venda_produtos", "fnc_nat_origem=eq.1");
  await testRequest("vw_pedidos_venda_produtos", null, { limit: 10 });
  await testRequest("vw_pedidos_venda_produtos", null, { limit: 100, offset: 0 });

  // 5. Testar outras possíveis tabelas/views
  log("\n\n5️⃣  EXPLORANDO OUTRAS TABELAS", colors.bright + colors.yellow);
  await testRequest("pedidos");
  await testRequest("pedidos_venda");
  await testRequest("vw_pedidos");
  await testRequest("marcas");
  await testRequest("grupos_produtos");
  await testRequest("departamentos");

  // 6. Testar filtros complexos
  log("\n\n6️⃣  TESTANDO FILTROS COMPLEXOS", colors.bright + colors.yellow);
  await testRequest("produtos", "fnc_pro_preco_venda=gt.0&fnc_pro_estoque_atual=gt.0");
  await testRequest("vw_pedidos_venda_produtos", "fnc_pve_data_emissao=gte.2024-01-01");

  log("\n\n✅ Bateria de testes concluída!", colors.bright + colors.green);
  log("\n📊 Resumo das descobertas:", colors.cyan);
  log("- Verifique os logs acima para entender a estrutura de cada endpoint", colors.yellow);
  log("- Note quais tabelas existem e quais não existem", colors.yellow);
  log("- Observe os campos disponíveis em cada tabela", colors.yellow);
  log("- Identifique se há suporte para paginação (limit/offset)", colors.yellow);
  log("- Veja como os filtros funcionam (operadores: eq, gt, gte, etc.)", colors.yellow);
}

// Executar testes
runTests().catch(error => {
  log(`\n❌ Erro fatal: ${error}`, colors.red);
  process.exit(1);
});