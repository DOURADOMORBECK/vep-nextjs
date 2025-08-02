import { NextRequest, NextResponse } from 'next/server';

/**
 * API para retornar status de sincronização
 * Por enquanto retorna dados mockados, mas pode ser expandido
 */
export async function GET(request: NextRequest) {
  try {
    // Por enquanto, retornar dados mockados
    // No futuro, buscar do banco de dados
    const status = {
      produtos: {
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        recordCount: 967,
        status: 'success'
      },
      pessoas: {
        lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        recordCount: 43,
        status: 'success'
      },
      operadores: {
        lastSync: null,
        recordCount: 0,
        status: 'idle'
      },
      pedidos: {
        lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        recordCount: 1000,
        status: 'success'
      }
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    );
  }
}