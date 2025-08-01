#!/usr/bin/env bun

// Teste de diferentes formatos de requisição
// Execute com: bun run test-financesweb-format.ts

const API_KEY = "18028EFB-5305-4B19-8CA0-8AA9D8636BE7";
const API_URL = "https://flow.financesweb.com.br/webhook/financeserp";

async function testFormat(description: string, body: any) {
  console.log(`\n🔍 ${description}`);
  console.log("📤 Body:", JSON.stringify(body, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    });
    
    const text = await response.text();
    console.log(`📡 Status: ${response.status}`);
    console.log(`📥 Response: ${text}`);
    
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ SUCESSO! ${data.length} registros retornados`);
        console.log("🔑 Campos:", Object.keys(data[0]).join(", "));
        return true;
      } else if (data.status === "erro") {
        console.log(`❌ Erro: ${data.motivo}`);
      }
    } catch (e) {
      console.log("❌ Resposta não é JSON válido");
    }
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error}`);
  }
  return false;
}

async function runTests() {
  console.log("🚀 Testando diferentes formatos de requisição\n");

  // Formato 1: Como estava no Pedidos_v4.txt
  await testFormat("Formato 1: Original do Pedidos_v4", {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos",
    filtro: "fnc_nat_origem=eq.1"
  });

  // Formato 2: Sem filtro
  await testFormat("Formato 2: Sem filtro", {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos"
  });

  // Formato 3: Com layout
  await testFormat("Formato 3: Com campo layout", {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos",
    layout: "default"
  });

  // Formato 4: Com empresa
  await testFormat("Formato 4: Com campo empresa", {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos",
    empresa: 1
  });

  // Formato 5: Com formato
  await testFormat("Formato 5: Com campo formato", {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos",
    formato: "json"
  });

  // Formato 6: Com múltiplos campos extras
  await testFormat("Formato 6: Com layout + empresa", {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos",
    layout: "default",
    empresa: 1
  });

  // Formato 7: Testando produtos
  await testFormat("Formato 7: Produtos sem filtro", {
    api_key: API_KEY,
    tabela: "produtos"
  });

  // Formato 8: Com action
  await testFormat("Formato 8: Com campo action", {
    api_key: API_KEY,
    action: "get",
    tabela: "produtos"
  });

  // Formato 9: Com método
  await testFormat("Formato 9: Com campo metodo", {
    api_key: API_KEY,
    metodo: "listar",
    tabela: "produtos"
  });

  // Formato 10: API key em header
  console.log("\n🔍 Formato 10: API key no header");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        tabela: "produtos"
      }),
    });
    
    const text = await response.text();
    console.log(`📡 Status: ${response.status}`);
    console.log(`📥 Response: ${text}`);
  } catch (error) {
    console.log(`❌ Erro: ${error}`);
  }
}

runTests();