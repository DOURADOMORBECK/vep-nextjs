#!/usr/bin/env bun

// Teste exato como no Pedidos_v4.txt
// Execute com: bun run test-financesweb-exact.ts

const API_KEY = "18028EFB-5305-4B19-8CA0-8AA9D8636BE7";
const API_URL = "https://flow.financesweb.com.br/webhook/financeserp";

async function testExactFormat() {
  console.log("🚀 Testando formato exato do Pedidos_v4.txt\n");

  // Teste 1: Exatamente como estava no arquivo
  const requestBody = {
    api_key: API_KEY,
    tabela: "vw_pedidos_venda_produtos",
    filtro: "fnc_nat_origem=eq.1",
  };

  console.log("📤 Request Body:", JSON.stringify(requestBody, null, 2));
  console.log("📍 URL:", API_URL);
  console.log("🔧 Method: POST");
  console.log("📋 Headers: Content-Type: application/json\n");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log("📥 Response Headers:");
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const responseText = await response.text();
    console.log("\n📥 Response Body:", responseText);

    // Se a resposta for de erro de layout, vamos tentar descobrir qual layout usar
    const data = JSON.parse(responseText);
    if (data.status === "erro" && data.motivo === "Layout inválido") {
      console.log("\n❌ Layout inválido detectado!");
      console.log("\n💡 Possíveis soluções:");
      console.log("1. O layout precisa ser cadastrado no sistema FinancesWeb");
      console.log("2. A API key pode não ter permissão para acessar essa tabela");
      console.log("3. O nome da tabela pode estar incorreto");
      console.log("4. Pode haver um parâmetro obrigatório faltando");
      
      // Vamos tentar descobrir se há alguma mensagem de erro mais específica
      console.log("\n🔍 Testando sem tabela para ver se o erro muda:");
      const test2 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: API_KEY }),
      });
      console.log("Response:", await test2.text());

      console.log("\n🔍 Testando com API key inválida:");
      const test3 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          api_key: "INVALID-KEY",
          tabela: "produtos"
        }),
      });
      console.log("Response:", await test3.text());

      console.log("\n🔍 Testando método GET:");
      const test4 = await fetch(API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log("Response:", await test4.text());
    }
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
}

testExactFormat();