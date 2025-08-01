import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAPI } from './config';
import { ProdutoFinanceswebService } from '@/services/database/financesweb/produtoFinanceswebService';
import { OperadorFinanceswebService } from '@/services/database/financesweb/operadorFinanceswebService';
import { PessoaFinanceswebService } from '@/services/database/financesweb/pessoaFinanceswebService';
import { PedidoDetalheFinanceswebService } from '@/services/database/financesweb/pedidoDetalheFinanceswebService';

export async function POST(request: NextRequest) {
  // Verifica se a API key está configurada
  if (!process.env.FINANCESWEB_API_KEY) {
    return NextResponse.json(
      { 
        error: 'API key não configurada',
        message: 'Configure a variável de ambiente FINANCESWEB_API_KEY'
      },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');

    const results: any = {
      timestamp: new Date().toISOString(),
      results: {},
      errors: [],
      success: true
    };

    // Função auxiliar para processar cada entidade
    const syncEntity = async (
      name: string,
      fetchFunc: () => Promise<any>,
      service: any,
      processFunc: (data: any[]) => Promise<any>
    ) => {
      try {
        console.log(`🔄 Sincronizando ${name}...`);
        const data = await fetchFunc();
        console.log(`📦 ${data.length} registros encontrados`);
        
        // Garante que a tabela existe
        await service.createTable();
        
        // Processa os dados
        const result = await processFunc(data);
        results.results[name] = {
          ...result,
          total: data.length,
          status: 'success'
        };
        console.log(`✅ ${name} sincronizado:`, result);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${name}:`, error);
        results.results[name] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
        results.errors.push({
          entity: name,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        results.success = false;
      }
    };

    // Se uma entidade específica foi solicitada
    if (entity) {
      switch (entity) {
        case 'produtos':
          await syncEntity(
            'produtos',
            () => fetchFromAPI("fnc_produtos_e_servicos"),
            new ProdutoFinanceswebService(),
            (data) => new ProdutoFinanceswebService().upsertMany(data)
          );
          break;
        
        case 'operadores':
          await syncEntity(
            'operadores',
            () => fetchFromAPI("fnc_operadores"),
            new OperadorFinanceswebService(),
            (data) => new OperadorFinanceswebService().upsertMany(data)
          );
          break;
        
        case 'pessoas':
          await syncEntity(
            'pessoas',
            () => fetchFromAPI("fnc_pessoas", "fnc_pes_tipo_pessoa=eq.2"),
            new PessoaFinanceswebService(),
            (data) => new PessoaFinanceswebService().upsertMany(data)
          );
          break;
        
        case 'pedidos':
          await syncEntity(
            'pedidos',
            () => fetchFromAPI("vw_pedidos_venda_produtos", "fnc_nat_origem=eq.1"),
            new PedidoDetalheFinanceswebService(),
            (data) => new PedidoDetalheFinanceswebService().upsertMany(data)
          );
          break;
        
        default:
          return NextResponse.json(
            { error: 'Entidade inválida. Use: produtos, operadores, pessoas ou pedidos' },
            { status: 400 }
          );
      }
    } else {
      // Sincroniza todas as entidades
      await syncEntity(
        'produtos',
        () => fetchFromAPI("fnc_produtos_e_servicos"),
        new ProdutoFinanceswebService(),
        (data) => new ProdutoFinanceswebService().upsertMany(data)
      );

      await syncEntity(
        'operadores',
        () => fetchFromAPI("fnc_operadores"),
        new OperadorFinanceswebService(),
        (data) => new OperadorFinanceswebService().upsertMany(data)
      );

      await syncEntity(
        'pessoas',
        () => fetchFromAPI("fnc_pessoas", "fnc_pes_tipo_pessoa=eq.2"),
        new PessoaFinanceswebService(),
        (data) => new PessoaFinanceswebService().upsertMany(data)
      );

      await syncEntity(
        'pedidos',
        () => fetchFromAPI("vw_pedidos_venda_produtos", "fnc_nat_origem=eq.1"),
        new PedidoDetalheFinanceswebService(),
        (data) => new PedidoDetalheFinanceswebService().upsertMany(data)
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { 
        error: 'Erro na sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET apenas para verificar status
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'API de sincronização FinancesWeb',
    endpoints: {
      sync_all: 'POST /api/financesweb/sync',
      sync_entity: 'POST /api/financesweb/sync?entity=[produtos|operadores|pessoas|pedidos]'
    }
  });
}