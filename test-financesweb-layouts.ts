#!/usr/bin/env bun

// Teste de diferentes layouts
// Execute com: bun run test-financesweb-layouts.ts

const API_KEY = "18028EFB-5305-4B19-8CA0-8AA9D8636BE7";
const API_URL = "https://flow.financesweb.com.br/webhook/financeserp";

async function testLayout(layout: string) {
  console.log(`\n📋 Testando layout: "${layout}"`);
  
  const body = {
    api_key: API_KEY,
    tabela: "produtos",
    layout: layout
  };
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status} | Response: ${text.substring(0, 100)}`);
    
    try {
      const data = JSON.parse(text);
      if (data.status !== "erro") {
        console.log("✅ SUCESSO!");
        return true;
      }
    } catch (e) {}
  } catch (error) {
    console.log(`❌ Erro: ${error}`);
  }
  return false;
}

async function runTests() {
  console.log("🚀 Testando diferentes valores de layout\n");

  const layouts = [
    "produtos",
    "produto",
    "json",
    "default",
    "padrao",
    "completo",
    "simples",
    "basico",
    "detalhado",
    "lista",
    "tabela",
    "api",
    "web",
    "webhook",
    "financeserp",
    "financesweb",
    "vw_produtos",
    "view_produtos",
    "1",
    "0",
    "",
    null,
    undefined
  ];

  let found = false;
  for (const layout of layouts) {
    if (await testLayout(layout)) {
      found = true;
      console.log(`\n🎉 Layout funcionando: "${layout}"`);
      break;
    }
  }

  if (!found) {
    console.log("\n❌ Nenhum layout funcionou. Testando sem o campo layout...");
    
    // Teste sem layout mas com outros campos
    console.log("\n📋 Testando combinações alternativas:");
    
    // Teste 1: Só api_key e tabela
    const test1 = {
      api_key: API_KEY,
      tabela: "produtos"
    };
    console.log("\nTeste 1:", JSON.stringify(test1));
    let resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test1),
    });
    console.log("Response:", await resp.text());

    // Teste 2: Com view
    const test2 = {
      api_key: API_KEY,
      view: "produtos"
    };
    console.log("\nTeste 2:", JSON.stringify(test2));
    resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test2),
    });
    console.log("Response:", await resp.text());

    // Teste 3: Com query
    const test3 = {
      api_key: API_KEY,
      query: "SELECT * FROM produtos"
    };
    console.log("\nTeste 3:", JSON.stringify(test3));
    resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test3),
    });
    console.log("Response:", await resp.text());
  }
}

runTests();