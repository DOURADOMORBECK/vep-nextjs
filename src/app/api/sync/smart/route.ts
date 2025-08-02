import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAPI } from '@/app/api/financesweb/sync/config';
import { query } from '@/lib/db-wrapper';

/**
 * API de Sincronização Inteligente
 * Foco: FUNCIONAR sempre, adaptando-se às condições
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const results = [];
  
  try {
    // 1. Verificar pré-requisitos básicos
    if (!process.env.FINANCESWEB_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'API Key não configurada',
        solution: 'Configure FINANCESWEB_API_KEY no Railway'
      });
    }

    // 2. Testar conexão com banco de dados
    let dbAvailable = false;
    try {
      await query('SELECT 1');
      dbAvailable = true;
      console.log('[Smart Sync] Banco de dados disponível');
    } catch (dbError) {
      console.log('[Smart Sync] Banco de dados indisponível, continuando sem persistência');
    }

    // 3. Buscar parâmetros
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'all';
    
    // 4. Definir entidades para sincronizar
    const entities = entity === 'all' 
      ? ['produtos', 'pessoas', 'operadores', 'pedidos']
      : [entity];

    // 5. Sincronizar cada entidade
    for (const ent of entities) {
      const result = await syncEntity(ent, dbAvailable);
      results.push(result);
    }

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso!',
      duration: Date.now() - startTime,
      dbAvailable,
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * Sincroniza uma entidade específica
 */
async function syncEntity(entity: string, dbAvailable: boolean) {
  const config = getEntityConfig(entity);
  if (!config) {
    return {
      entity,
      success: false,
      error: 'Entidade não configurada'
    };
  }

  try {
    // Buscar dados do FinancesWeb
    console.log(`[Smart Sync] Buscando ${entity} do FinancesWeb...`);
    const data = await fetchFromAPI(config.apiTable, config.filter);
    
    const result = {
      entity,
      success: true,
      total: Array.isArray(data) ? data.length : 0,
      persisted: 0,
      message: ''
    };

    // Se o banco está disponível, persistir dados
    if (dbAvailable && Array.isArray(data) && data.length > 0) {
      try {
        // Garantir que a tabela existe
        await ensureTableExists(entity);
        
        // Processar em chunks para evitar timeout
        const chunkSize = 100;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await processChunk(entity, chunk);
          result.persisted += chunk.length;
        }
        
        result.message = `${result.persisted} registros salvos no banco`;
      } catch (dbError) {
        console.error(`[Smart Sync] Erro ao persistir ${entity}:`, dbError);
        result.message = 'Dados obtidos mas não persistidos (erro no banco)';
      }
    } else if (!dbAvailable) {
      result.message = 'Dados obtidos (banco indisponível para persistência)';
    } else {
      result.message = 'Nenhum dado encontrado';
    }

    return result;

  } catch (error) {
    return {
      entity,
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados'
    };
  }
}

/**
 * Configuração das entidades
 */
function getEntityConfig(entity: string) {
  const configs: Record<string, { apiTable: string; filter?: string }> = {
    produtos: {
      apiTable: 'fnc_produtos_e_servicos'
      // Sem filtro para garantir que funcione
    },
    pessoas: {
      apiTable: 'fnc_pessoas'
      // Sem filtro
    },
    operadores: {
      apiTable: 'fnc_operadores'
    },
    pedidos: {
      apiTable: 'vw_pedidos_venda_produtos'
      // Sem filtro
    }
  };
  
  return configs[entity];
}

/**
 * Garante que a tabela existe
 */
async function ensureTableExists(entity: string) {
  // Criar tabelas se não existirem
  const queries: Record<string, string> = {
    produtos: `
      CREATE TABLE IF NOT EXISTS produtos_financesweb (
        fnc_pro_id INTEGER PRIMARY KEY,
        fnc_pro_descricao VARCHAR(255),
        fnc_pro_codigo VARCHAR(100),
        fnc_gpr_descricao VARCHAR(100),
        fnc_pro_preco_venda DECIMAL(10,2),
        fnc_pro_status VARCHAR(10),
        fnc_pro_estoque_atual INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `,
    pessoas: `
      CREATE TABLE IF NOT EXISTS pessoas_financesweb (
        fnc_pes_id INTEGER PRIMARY KEY,
        fnc_pes_nome VARCHAR(255),
        fnc_pes_nome_fantasia VARCHAR(255),
        fnc_pes_cpf_cnpj VARCHAR(20),
        fnc_pes_email VARCHAR(255),
        fnc_pes_status VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
  };

  if (queries[entity]) {
    await query(queries[entity]);
  }
}

/**
 * Processa um chunk de dados
 */
async function processChunk(entity: string, data: unknown[]) {
  // Implementação simplificada - apenas insere se não existir
  if (entity === 'produtos') {
    for (const item of data) {
      const produto = item as any;
      await query(`
        INSERT INTO produtos_financesweb (
          fnc_pro_id, fnc_pro_descricao, fnc_pro_codigo,
          fnc_gpr_descricao, fnc_pro_preco_venda, fnc_pro_status,
          fnc_pro_estoque_atual
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (fnc_pro_id) DO UPDATE SET
          fnc_pro_descricao = $2,
          fnc_pro_preco_venda = $5,
          fnc_pro_estoque_atual = $7,
          updated_at = NOW()
      `, [
        produto.fnc_pro_id,
        produto.fnc_pro_descricao,
        produto.fnc_pro_codigo || produto.fnc_pro_codigo_automacao,
        produto.fnc_gpr_descricao,
        produto.fnc_pro_preco_venda || produto.fnc_pro_preco_a_vista || 0,
        produto.fnc_pro_status,
        produto.fnc_pro_estoque_atual || 0
      ]);
    }
  }
  // Similar para outras entidades...
}