import { NextRequest, NextResponse } from 'next/server';
import { ProdutoFinanceswebService, type ProdutoFinancesweb } from '@/services/database/financesweb/produtoFinanceswebService';
import { OperadorFinanceswebService, type OperadorFinancesweb } from '@/services/database/financesweb/operadorFinanceswebService';
import { PessoaFinanceswebService, type PessoaFinancesweb } from '@/services/database/financesweb/pessoaFinanceswebService';
import { PedidoDetalheFinanceswebService, type PedidoDetalheFinancesweb } from '@/services/database/financesweb/pedidoDetalheFinanceswebService';

interface SaveRequest {
  entity: string;
  data: unknown[];
}

export async function POST(request: NextRequest) {
  try {
    const { entity, data } = await request.json() as SaveRequest;
    
    if (!entity || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Entidade e dados são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`💾 Salvando ${data.length} registros de ${entity}...`);

    let result: { inseridos?: number; atualizados?: number; erros?: number };
    
    switch (entity) {
      case 'produtos': {
        const service = new ProdutoFinanceswebService();
        await service.createTable();
        result = await service.upsertMany(data as ProdutoFinancesweb[]);
        break;
      }
      case 'operadores': {
        const service = new OperadorFinanceswebService();
        await service.createTable();
        result = await service.upsertMany(data as OperadorFinancesweb[]);
        break;
      }
      case 'pessoas': {
        const service = new PessoaFinanceswebService();
        await service.createTable();
        result = await service.upsertMany(data as PessoaFinancesweb[]);
        break;
      }
      case 'pedidos': {
        const service = new PedidoDetalheFinanceswebService();
        await service.createTable();
        result = await service.upsertMany(data as PedidoDetalheFinancesweb[]);
        break;
      }
      default:
        return NextResponse.json(
          { error: `Entidade '${entity}' não reconhecida` },
          { status: 400 }
        );
    }
    
    console.log(`✅ ${entity} salvos:`, result);
    
    return NextResponse.json({
      success: true,
      entity,
      total: data.length,
      saved: (result.inseridos || 0) + (result.atualizados || 0),
      inserted: result.inseridos || 0,
      updated: result.atualizados || 0,
      errors: result.erros || 0,
    });

  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao salvar dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}