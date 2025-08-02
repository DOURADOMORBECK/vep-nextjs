import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/services/database/syncService';
import { UserLogService } from '@/services/database/userLogService';

// POST - Executar sincronização
export async function POST(request: NextRequest) {
  try {
    // Verificar API key
    if (!process.env.FINANCESWEB_API_KEY) {
      return NextResponse.json(
        { 
          error: 'API key não configurada',
          message: 'Configure a variável de ambiente FINANCESWEB_API_KEY'
        },
        { status: 500 }
      );
    }

    // Obter parâmetros da requisição
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const mode = searchParams.get('mode') || 'full'; // 'full' ou 'incremental'

    // Inicializar tabelas de controle
    await SyncService.initializeSyncControl();
    await UserLogService.initializeTable();

    // Log de início da sincronização
    await UserLogService.create({
      userId: 'api',
      userName: 'API de Sincronização',
      action: 'SYNC_API_REQUEST',
      module: 'SYNC',
      details: {
        entity: entity || 'all',
        mode,
        timestamp: new Date().toISOString()
      }
    });

    let results;
    
    if (mode === 'incremental') {
      results = await SyncService.performIncrementalSync(entity || undefined);
    } else {
      results = await SyncService.performFullSync(entity || undefined);
    }

    // Calcular totais
    const totals = results.reduce((acc, result) => ({
      totalRecords: acc.totalRecords + result.totalRecords,
      inserted: acc.inserted + result.inserted,
      updated: acc.updated + result.updated,
      errors: acc.errors + result.errors,
      duration: acc.duration + result.duration
    }), {
      totalRecords: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      duration: 0
    });

    const response = {
      success: true,
      mode,
      timestamp: new Date().toISOString(),
      results,
      totals,
      message: `Sincronização ${mode === 'incremental' ? 'incremental' : 'completa'} concluída`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API de sincronização:', error);
    
    // Tentar registrar log apenas se possível
    try {
      await UserLogService.create({
        userId: 'api',
        userName: 'API de Sincronização',
        action: 'SYNC_API_ERROR',
        module: 'SYNC',
        details: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    // Retornar erro detalhado
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorDetails = {
      success: false,
      error: 'Erro na sincronização',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : errorMessage
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// GET - Verificar status da sincronização
export async function GET(request: NextRequest) {
  try {
    // Inicializar tabelas se necessário
    await SyncService.initializeSyncControl();

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');

    const status = await SyncService.getSyncStatus(entity || undefined);

    return NextResponse.json({
      success: true,
      status,
      endpoints: {
        full_sync_all: 'POST /api/sync',
        full_sync_entity: 'POST /api/sync?entity=[produtos|pessoas|operadores|pedidos]',
        incremental_sync_all: 'POST /api/sync?mode=incremental',
        incremental_sync_entity: 'POST /api/sync?entity=[entity]&mode=incremental',
        status_all: 'GET /api/sync',
        status_entity: 'GET /api/sync?entity=[entity]'
      }
    });

  } catch (error) {
    console.error('Erro ao obter status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao obter status',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}