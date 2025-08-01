import { NextRequest, NextResponse } from 'next/server';
import { PedidoDetalheFinanceswebService } from '@/services/database/financesweb/pedidoDetalheFinanceswebService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pedidoId = searchParams.get('pedidoId');
    const clienteId = searchParams.get('clienteId');
    const produtoId = searchParams.get('produtoId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const totals = searchParams.get('totals');

    const service = new PedidoDetalheFinanceswebService();

    if (totals === 'cliente') {
      const data = await service.getTotalsByCliente();
      return NextResponse.json(data);
    }

    if (totals === 'produto') {
      const data = await service.getTotalsByProduto();
      return NextResponse.json(data);
    }

    if (pedidoId) {
      const pedidos = await service.getByPedidoId(parseInt(pedidoId));
      return NextResponse.json(pedidos);
    }

    if (clienteId) {
      const pedidos = await service.getByClienteId(parseInt(clienteId));
      return NextResponse.json(pedidos);
    }

    if (produtoId) {
      const pedidos = await service.getByProdutoId(parseInt(produtoId));
      return NextResponse.json(pedidos);
    }

    if (startDate && endDate) {
      const pedidos = await service.getByDateRange(startDate, endDate);
      return NextResponse.json(pedidos);
    }

    return NextResponse.json({ 
      error: 'Parâmetros de busca necessários' 
    }, { status: 400 });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}