#!/usr/bin/env bun

// Teste usando headers conforme documentação
// Execute com: bun run test-financesweb-headers.ts

const API_KEY = "18028EFB-5305-4B19-8CA0-8AA9D8636BE7";
const API_URL = "https://flow.financesweb.com.br/webhook/financeserp";

async function testWithHeaders() {
  console.log("🚀 Testando API FinancesWeb com headers (conforme documentação)\n");

  // Teste 1: Produtos
  console.log("1️⃣ Testando produtos com GET e headers...");
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "tabela": "fnc_produtos_e_servicos",
        "filtro": "fnc_pro_status=eq.1"
      },
    });

    console.log(`📡 Status: ${response.status}`);
    const data = await response.json();
    console.log(`📦 Resposta:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    if (Array.isArray(data)) {
      console.log(`✅ SUCESSO! ${data.length} produtos encontrados`);
      if (data.length > 0) {
        console.log("🔑 Campos disponíveis:", Object.keys(data[0]).join(", "));
      }
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  // Teste 2: Produtos sem filtro
  console.log("\n2️⃣ Testando produtos sem filtro...");
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "tabela": "fnc_produtos_e_servicos"
      },
    });

    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`✅ ${data.length} produtos encontrados`);
    } else {
      console.log("📦 Resposta:", data);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  // Teste 3: Operadores
  console.log("\n3️⃣ Testando operadores...");
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "tabela": "fnc_operadores"
      },
    });

    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`✅ ${data.length} operadores encontrados`);
      if (data.length > 0) {
        console.log("🔑 Campos:", Object.keys(data[0]).join(", "));
      }
    } else {
      console.log("📦 Resposta:", data);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  // Teste 4: Pessoas
  console.log("\n4️⃣ Testando pessoas (clientes/fornecedores)...");
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "tabela": "fnc_pessoas",
        "filtro": "fnc_pes_tipo=eq.J" // Pessoa Jurídica
      },
    });

    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`✅ ${data.length} pessoas jurídicas encontradas`);
    } else {
      console.log("📦 Resposta:", data);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  // Teste 5: Pedidos
  console.log("\n5️⃣ Testando pedidos de venda...");
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "tabela": "fnc_pedidos_venda"
      },
    });

    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`✅ ${data.length} pedidos encontrados`);
    } else {
      console.log("📦 Resposta:", data);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  // Teste 6: Pedidos com produtos (view)
  console.log("\n6️⃣ Testando view de pedidos com produtos...");
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "tabela": "fnc_vw_pedidos_venda_produtos"
      },
    });

    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`✅ ${data.length} registros encontrados`);
    } else {
      console.log("📦 Resposta:", data);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  // Teste 7: Descobrir nomes corretos das tabelas
  console.log("\n7️⃣ Testando variações de nomes de tabela...");
  const tableVariations = [
    "produtos",
    "pessoas",
    "operadores",
    "pedidos_venda",
    "vw_pedidos_venda_produtos",
    "fnc_produtos",
    "fnc_pessoas",
    "fnc_operadores",
    "fnc_pedidos_venda_produtos"
  ];

  for (const table of tableVariations) {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": API_KEY,
          "tabela": table
        },
      });

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ "${table}" funcionou! ${data.length} registros`);
      } else if (!Array.isArray(data) && data.status !== "erro") {
        console.log(`❓ "${table}": ${JSON.stringify(data)}`);
      }
    } catch (error) {
      // Silently skip
    }
  }
}

testWithHeaders();