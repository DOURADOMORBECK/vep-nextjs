import { NextRequest, NextResponse } from 'next/server';
import { RobustSyncService } from '@/services/sync/RobustSyncService';

/**
 * API de sincronização v2 - Robusta e confiável
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Extrair parâmetros
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || undefined;
    const mode = (searchParams.get('mode') || 'full') as 'full' | 'incremental';
    
    console.log(`[Sync API v2] Iniciando sincronização ${mode} ${entity || 'todas entidades'}`);
    
    // 2. Executar sincronização
    const result = await RobustSyncService.sync({
      entity,
      mode,
      chunkSize: 100 // Tamanho conservador para evitar timeouts
    });
    
    // 3. Calcular estatísticas
    const stats = {
      totalRecords: 0,
      totalInserted: 0,
      totalUpdated: 0,
      entitiesProcessed: result.results.length
    };
    
    result.results.forEach(r => {
      stats.totalRecords += r.total;
      stats.totalInserted += r.inserted;
      stats.totalUpdated += r.updated;
    });
    
    // 4. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: `Sincronização ${mode} concluída com sucesso`,
      duration: Date.now() - startTime,
      stats,
      details: result.results
    });
    
  } catch (error) {
    console.error('[Sync API v2] Erro:', error);
    
    // Retornar erro estruturado
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      duration: Date.now() - startTime,
      troubleshooting: {
        checkApiKey: 'Verifique se FINANCESWEB_API_KEY está configurada no Railway',
        checkDatabase: 'Verifique se o PostgreSQL está rodando',
        checkLogs: 'Verifique os logs do Railway para mais detalhes'
      }
    }, { status: 500 });
  }
}

/**
 * GET - Status da sincronização
 */
export async function GET() {
  try {
    // Buscar status de todas as entidades
    const status = await query<{
      entity: string;
      last_sync_date: Date | null;
      record_count: number;
      status: string;
      last_error: string | null;
    }>(`
      SELECT 
        entity,
        last_sync_date,
        record_count,
        status,
        last_error
      FROM sync_control
      ORDER BY entity
    `);
    
    return NextResponse.json({
      success: true,
      entities: status,
      summary: {
        total: status.length,
        completed: status.filter(s => s.status === 'completed').length,
        errors: status.filter(s => s.status === 'error').length
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar status',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Importar query
import { query } from '@/lib/db-wrapper';