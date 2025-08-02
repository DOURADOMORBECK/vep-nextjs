export const API_CONFIG = {
  baseUrl: "https://flow.financesweb.com.br/webhook/financeserp",
  // Garante que sempre lê a variável de ambiente corretamente
  get apiKey() {
    return process.env.FINANCESWEB_API_KEY || "";
  }
};

export async function fetchFromAPI(tabela: string, filtro?: string) {
  if (!API_CONFIG.apiKey) {
    console.error('FINANCESWEB_API_KEY não está configurada');
    throw new Error("FINANCESWEB_API_KEY não configurada. Configure a variável de ambiente.");
  }

  console.log(`[FinancesWeb API] Buscando dados de ${tabela}${filtro ? ` com filtro: ${filtro}` : ''}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": API_CONFIG.apiKey,
    "tabela": tabela,
  };

  if (filtro) {
    headers["filtro"] = filtro;
  }

  try {
    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(API_CONFIG.baseUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sem detalhes do erro');
      console.error(`[FinancesWeb API] Erro ${response.status}: ${errorText}`);
      throw new Error(`API FinancesWeb retornou erro ${response.status}: ${errorText}`);
    }

    // Tentar parsear JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[FinancesWeb API] Erro ao parsear JSON:', jsonError);
      throw new Error('Resposta da API não é um JSON válido');
    }

    console.log(`[FinancesWeb API] Resposta recebida para ${tabela}`);
    
    // A API retorna os dados dentro de um objeto com o nome da tabela
    if (data[tabela]) {
      console.log(`[FinancesWeb API] ${data[tabela].length} registros encontrados em ${tabela}`);
      return data[tabela];
    } else {
      // Fallback para caso a estrutura seja diferente
      const firstArray = Object.values(data).find(v => Array.isArray(v));
      if (firstArray && Array.isArray(firstArray)) {
        console.log(`[FinancesWeb API] ${firstArray.length} registros encontrados (estrutura alternativa)`);
        return firstArray;
      }
      console.log('[FinancesWeb API] Nenhum dado encontrado na resposta');
      return [];
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[FinancesWeb API] Timeout ao buscar dados');
      throw new Error('Timeout ao buscar dados do FinancesWeb (30s)');
    }
    throw error;
  }
}