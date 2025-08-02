// DEPRECATED: This file is no longer used
// All data is now stored directly in PostgreSQL
// No external API calls are needed

export const API_CONFIG = {
  baseUrl: "deprecated",
  apiKey: ""
};

export async function fetchFromAPI(tabela: string, filtro?: string) {
  console.warn(`[DEPRECATED] fetchFromAPI called for table: ${tabela}`);
  console.warn('All data should be fetched directly from PostgreSQL tables:');
  console.warn('- fnc_produtos_e_servicos for products');
  console.warn('- vw_pedidos_venda_produtos for orders and customers');
  console.warn('- ssx_positions for tracking data');
  
  // Return empty array to prevent errors in code that still calls this
  return [];
}