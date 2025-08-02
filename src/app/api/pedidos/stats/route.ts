import { NextResponse } from 'next/server';
import { PedidoService } from '@/services/database/pedidoService';

export async function GET() {
  try {
    const stats = await PedidoService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order stats' },
      { status: 500 }
    );
  }
}