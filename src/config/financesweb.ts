// Configuração da API FinancesWeb
export const FINANCESWEB_CONFIG = {
  baseUrl: "https://flow.financesweb.com.br/webhook/financeserp",
  apiKey: process.env.FINANCESWEB_API_KEY || "",
};

// Função helper para fazer requisições à API FinancesWeb
export async function fetchFromFinancesWebAPI(tabela: string, filtro?: string) {
  if (!FINANCESWEB_CONFIG.apiKey) {
    throw new Error("FINANCESWEB_API_KEY não está configurada");
  }

  const requestBody = {
    api_key: FINANCESWEB_CONFIG.apiKey,
    tabela,
    ...(filtro && { filtro }),
  };

  console.log(`📤 Requisição FinancesWeb para tabela: ${tabela}`);
  if (filtro) console.log(`   Filtro: ${filtro}`);

  const response = await fetch(FINANCESWEB_CONFIG.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FinancesWeb API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // A API pode retornar os dados em diferentes formatos
  if (Array.isArray(data)) {
    return data;
  } else if (data[tabela]) {
    return data[tabela];
  } else if (data.data) {
    return data.data;
  } else {
    console.log("⚠️ Formato de resposta não reconhecido:", Object.keys(data));
    return [];
  }
}

// Função helper para log de progresso
export function logSyncProgress(entity: string, inseridos: number, existentes: number, erros: number, total: number) {
  console.log(`\n✅ ${entity} - Sincronização concluída:`);
  console.log(`   📥 Novos inseridos: ${inseridos}`);
  console.log(`   ⏭️  Já existentes: ${existentes}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   📊 Total processado: ${total}`);
}