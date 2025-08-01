import { NextRequest, NextResponse } from 'next/server';
import { ProdutoFinanceswebService } from '@/services/database/financesweb/produtoFinanceswebService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    const service = new ProdutoFinanceswebService();

    if (id) {
      const produto = await service.getById(parseInt(id));
      if (!produto) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }
      return NextResponse.json(produto);
    }

    if (search) {
      const produtos = await service.search(search);
      return NextResponse.json(produtos);
    }

    const produtos = await service.getAll();
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}