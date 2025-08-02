import { NextResponse } from 'next/server';
import { fetchFromAPI } from '@/app/api/financesweb/sync/config';

/**
 * API de teste para verificar se a sincronização funciona
 * Foca em FUNCIONAR, não em perfeição
 */
export async function GET() {
  try {
    // 1. Verificar API Key
    if (!process.env.FINANCESWEB_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'FINANCESWEB_API_KEY não configurada',
        solution: 'Configure a variável no Railway'
      });
    }

    // 2. Testar conexão com FinancesWeb
    console.log('[Test Sync] Testando conexão com FinancesWeb...');
    
    try {
      // Buscar apenas 1 produto para teste
      const produtos = await fetchFromAPI('fnc_produtos_e_servicos', 'limit 1');
      
      return NextResponse.json({
        success: true,
        message: 'Conexão com FinancesWeb OK!',
        test: {
          apiKeyOk: true,
          connectionOk: true,
          sampleData: produtos.slice(0, 1),
          totalFound: produtos.length
        }
      });
      
    } catch (apiError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao conectar com FinancesWeb',
        details: apiError instanceof Error ? apiError.message : 'Erro desconhecido',
        possibleCauses: [
          'API Key inválida',
          'FinancesWeb fora do ar',
          'Limite de requisições excedido'
        ]
      });
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro inesperado',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}