import { NextResponse } from 'next/server';
import { SyncService } from '@/services/database/syncService';

interface SyncStatusData {
  lastSync: string | null;
  recordCount: number;
  status: 'success' | 'error' | 'running' | 'idle';
}

/**
 * API para retornar status de sincronização
 * Busca dados reais do banco de dados
 */
export async function GET() {
  try {
    // Buscar status real do banco de dados
    const syncStatuses = await SyncService.getSyncStatus();
    
    // Formatar resposta no formato esperado
    const status: Record<string, SyncStatusData> = {};
    
    for (const syncStatus of syncStatuses) {
      status[syncStatus.entity] = {
        lastSync: syncStatus.lastSync ? syncStatus.lastSync.toISOString() : null,
        recordCount: syncStatus.recordCount,
        status: syncStatus.status === 'completed' ? 'success' : 
                syncStatus.status === 'error' ? 'error' : 
                syncStatus.status === 'running' ? 'running' : 'idle'
      };
    }

    // Se alguma entidade não tiver status, adicionar status padrão
    const entities = ['produtos', 'pessoas', 'operadores', 'pedidos'];
    for (const entity of entities) {
      if (!status[entity]) {
        status[entity] = {
          lastSync: null,
          recordCount: 0,
          status: 'idle'
        };
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Erro ao buscar status de sincronização:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    );
  }
}