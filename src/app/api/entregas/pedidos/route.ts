import { NextResponse } from 'next/server';
import { entregaService } from '@/services/database/entregaService';

export async function GET() {
  try {
    const pedidos = await entregaService.getPedidosParaEntrega();
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery orders' },
      { status: 500 }
    );
  }
}