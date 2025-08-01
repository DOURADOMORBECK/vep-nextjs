#!/usr/bin/env bun

// Teste rápido e simples da API FinancesWeb
// Execute com: bun run test-financesweb-quick.ts

const API_KEY = process.env.FINANCESWEB_API_KEY || "sua_api_key_aqui";
const API_URL = "https://flow.financesweb.com.br/webhook/financeserp";

async function quickTest() {
  console.log("🚀 Teste Rápido da API FinancesWeb\n");
  
  if (API_KEY === "sua_api_key_aqui") {
    console.error("❌ Configure FINANCESWEB_API_KEY no .env.local!");
    return;
  }

  // Teste 1: Produtos
  console.log("1️⃣ Testando produtos...");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        tabela: "produtos",
        limit: 2
      }),
    });
    
    const data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📦 Tipo de resposta:", Array.isArray(data) ? "Array" : typeof data);
    console.log("📊 Amostra:", JSON.stringify(data, null, 2).substring(0, 500) + "...\n");
  } catch (error) {
    console.error("❌ Erro:", error, "\n");
  }

  // Teste 2: Pedidos
  console.log("2️⃣ Testando pedidos...");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        tabela: "vw_pedidos_venda_produtos",
        limit: 2
      }),
    });
    
    const data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📦 Tipo de resposta:", Array.isArray(data) ? "Array" : typeof data);
    console.log("📊 Total de registros:", Array.isArray(data) ? data.length : "N/A");
    
    if (Array.isArray(data) && data.length > 0) {
      console.log("🔑 Campos disponíveis:", Object.keys(data[0]).join(", "));
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

quickTest();