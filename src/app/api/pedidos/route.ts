import { NextRequest, NextResponse } from 'next/server';
import { PedidoService } from '@/services/database/pedidoService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const clienteId = searchParams.get('clienteId');
    const situacao = searchParams.get('situacao');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    
    let pedidos;
    
    if (search) {
      pedidos = await PedidoService.search(search);
    } else {
      pedidos = await PedidoService.getAll({
        clienteId,
        situacao,
        dataInicio,
        dataFim
      });
    }
    
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}