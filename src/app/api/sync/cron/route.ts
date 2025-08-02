import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/services/database/syncService';
import { SafeLogService } from '@/services/database/safeLogService';
import { verifyToken, getAuthToken } from '@/lib/auth';

// Este endpoint pode ser chamado por um cron job externo (ex: Vercel Cron, GitHub Actions, etc)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação JWT
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem executar sincronização.' },
        { status: 403 }
      );
    }

    // Verificar API key do FinancesWeb
    if (!process.env.FINANCESWEB_API_KEY) {
      return NextResponse.json(
        { 
          error: 'API key não configurada',
          message: 'Configure a variável de ambiente FINANCESWEB_API_KEY'
        },
        { status: 500 }
      );
    }

    // Inicializar tabelas
    await SyncService.initializeSyncControl();

    // Log de início do cron
    await SafeLogService.log({
      userId: user.id,
      userName: user.name,
      action: 'SYNC_CRON_START',
      module: 'SYNC',
      details: {
        type: 'incremental',
        timestamp: new Date().toISOString(),
        triggeredBy: 'cron'
      }
    });

    // Executar sincronização incremental
    const results = await SyncService.performIncrementalSync();

    // Calcular totais
    const totals = results.reduce((acc, result) => ({
      totalRecords: acc.totalRecords + result.totalRecords,
      inserted: acc.inserted + result.inserted,
      updated: acc.updated + result.updated,
      errors: acc.errors + result.errors
    }), {
      totalRecords: 0,
      inserted: 0,
      updated: 0,
      errors: 0
    });

    // Log de conclusão
    await SafeLogService.log({
      userId: user.id,
      userName: user.name,
      action: 'SYNC_CRON_COMPLETE',
      module: 'SYNC',
      details: {
        results,
        totals,
        timestamp: new Date().toISOString(),
        triggeredBy: 'cron'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sincronização incremental via cron concluída',
      timestamp: new Date().toISOString(),
      totals,
      results
    });

  } catch (error) {
    console.error('Erro no cron de sincronização:', error);
    
    // Só registra log se tiver usuário autenticado
    const token = getAuthToken(request);
    const user = token ? await verifyToken(token) : null;
    
    if (user) {
      await SafeLogService.log({
        userId: user.id,
        userName: user.name,
        action: 'SYNC_CRON_ERROR',
        module: 'SYNC',
        details: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          triggeredBy: 'cron'
        }
      });
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erro no cron de sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}