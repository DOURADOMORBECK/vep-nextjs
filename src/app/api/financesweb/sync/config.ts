export const API_CONFIG = {
  baseUrl: "https://flow.financesweb.com.br/webhook/financeserp",
  apiKey: process.env.FINANCESWEB_API_KEY || ""
};

export async function fetchFromAPI(tabela: string, filtro?: string) {
  if (!API_CONFIG.apiKey) {
    throw new Error("FINANCESWEB_API_KEY não configurada");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": API_CONFIG.apiKey,
    "tabela": tabela,
  };

  if (filtro) {
    headers["filtro"] = filtro;
  }

  const response = await fetch(API_CONFIG.baseUrl, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // A API retorna os dados dentro de um objeto com o nome da tabela
  if (data[tabela]) {
    return data[tabela];
  } else {
    // Fallback para caso a estrutura seja diferente
    const firstArray = Object.values(data).find(v => Array.isArray(v));
    return firstArray || [];
  }
}