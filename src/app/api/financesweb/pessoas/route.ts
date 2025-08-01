import { NextRequest, NextResponse } from 'next/server';
import { PessoaFinanceswebService } from '@/services/database/financesweb/pessoaFinanceswebService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo');

    const service = new PessoaFinanceswebService();

    if (id) {
      const pessoa = await service.getById(parseInt(id));
      if (!pessoa) {
        return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 });
      }
      return NextResponse.json(pessoa);
    }

    if (search) {
      const pessoas = await service.search(search);
      return NextResponse.json(pessoas);
    }

    if (tipo === 'pj') {
      const pessoas = await service.getPessoasJuridicas();
      return NextResponse.json(pessoas);
    }

    const pessoas = await service.getAll();
    return NextResponse.json(pessoas);
  } catch (error) {
    console.error('Erro ao buscar pessoas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pessoas' },
      { status: 500 }
    );
  }
}