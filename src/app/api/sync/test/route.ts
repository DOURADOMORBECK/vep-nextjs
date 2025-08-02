import { NextResponse } from 'next/server';
import { fetchFromAPI } from '@/app/api/financesweb/sync/config';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      apiKeyConfigured: false,
      apiKeyLength: 0,
      testConnection: false,
      errorMessage: ''
    }
  };

  // Verificar se a API key está configurada
  const apiKey = process.env.FINANCESWEB_API_KEY;
  results.checks.apiKeyConfigured = !!apiKey;
  results.checks.apiKeyLength = apiKey?.length || 0;

  if (!apiKey) {
    results.checks.errorMessage = 'FINANCESWEB_API_KEY não está configurada';
    return NextResponse.json(results, { status: 500 });
  }

  // Testar conexão com a API
  try {
    console.log('[Sync Test] Testando conexão com FinancesWeb...');
    
    // Tentar buscar apenas 1 produto como teste
    const testData = await fetchFromAPI('fnc_produtos_e_servicos', 'fnc_pro_id=eq.1');
    
    results.checks.testConnection = true;
    results.checks.errorMessage = 'Conexão com FinancesWeb funcionando!';
    
    return NextResponse.json({
      ...results,
      success: true,
      message: 'Teste de conexão bem-sucedido',
      testData: {
        recordsFound: Array.isArray(testData) ? testData.length : 0
      }
    });
    
  } catch (error) {
    console.error('[Sync Test] Erro no teste:', error);
    
    results.checks.testConnection = false;
    results.checks.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({
      ...results,
      success: false,
      error: 'Falha no teste de conexão',
      details: error instanceof Error ? {
        message: error.message,
        name: error.name
      } : 'Erro desconhecido'
    }, { status: 500 });
  }
}