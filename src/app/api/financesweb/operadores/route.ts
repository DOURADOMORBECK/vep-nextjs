import { NextRequest, NextResponse } from 'next/server';
import { OperadorFinanceswebService } from '@/services/database/financesweb/operadorFinanceswebService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const id = searchParams.get('id');
    const ativos = searchParams.get('ativos');

    const service = new OperadorFinanceswebService();

    if (id) {
      const operador = await service.getById(parseInt(id));
      if (!operador) {
        return NextResponse.json({ error: 'Operador não encontrado' }, { status: 404 });
      }
      return NextResponse.json(operador);
    }

    if (search) {
      const operadores = await service.search(search);
      return NextResponse.json(operadores);
    }

    if (ativos === 'true') {
      const operadores = await service.getAtivos();
      return NextResponse.json(operadores);
    }

    const operadores = await service.getAll();
    return NextResponse.json(operadores);
  } catch (error) {
    console.error('Erro ao buscar operadores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar operadores' },
      { status: 500 }
    );
  }
}