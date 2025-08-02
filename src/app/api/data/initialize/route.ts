import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { DataInitializationService } from '@/services/dataInitializationService';

async function initializeDataHandler(): Promise<NextResponse> {
  try {
    console.log('[Data Initialize] Starting data initialization...');
    
    // Executa a inicialização
    const result = await DataInitializationService.initializeAllData();
    
    return NextResponse.json({
      success: result.success,
      loadedEntities: result.loadedEntities,
      errors: result.errors,
      message: result.success 
        ? 'Dados inicializados com sucesso' 
        : 'Inicialização parcial - alguns dados não puderam ser carregados'
    });
    
  } catch (error) {
    console.error('[Data Initialize] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao inicializar dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Export com middleware de autenticação
export const POST = withApiMiddleware(initializeDataHandler, {
  requireAuth: true
});