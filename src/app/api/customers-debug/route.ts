import { NextResponse } from 'next/server';
import { query } from '@/lib/db-wrapper';

interface DebugResults {
  queries: Record<string, unknown>;
  samples: Record<string, unknown>;
  errors: Array<{ query: string; error: string }>;
}

export async function GET() {
  const results: DebugResults = {
    queries: {},
    samples: {},
    errors: []
  };

  try {
    // Query 1: Get total count of pessoas
    try {
      const totalCount = await query(
        `SELECT COUNT(*) as count FROM pessoas_financesweb`
      );
      results.queries.totalPessoas = parseInt(totalCount[0].count);
    } catch (error) {
      results.errors.push({ query: 'total_count', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Query 2: Get count by status
    try {
      const statusCount = await query(
        `SELECT fnc_pes_status, COUNT(*) as count 
         FROM pessoas_financesweb 
         GROUP BY fnc_pes_status`
      );
      results.queries.byStatus = statusCount;
    } catch (error) {
      results.errors.push({ query: 'status_count', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Query 3: Get count by tipo_pessoa
    try {
      const tipoCount = await query(
        `SELECT fnc_pes_tipo_pessoa, COUNT(*) as count 
         FROM pessoas_financesweb 
         GROUP BY fnc_pes_tipo_pessoa`
      );
      results.queries.byTipoPessoa = tipoCount;
    } catch (error) {
      results.errors.push({ query: 'tipo_pessoa_count', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Query 4: Get sample records
    try {
      const samples = await query(
        `SELECT fnc_pes_id, fnc_pes_nome_fantasia, fnc_pes_razao_social, 
                fnc_pes_tipo_pessoa, fnc_pes_status, fnc_pes_cpf_cnpj,
                fnc_pes_email, fnc_pes_telefone, fnc_pes_cidade, fnc_pes_uf
         FROM pessoas_financesweb 
         LIMIT 10`
      );
      results.samples.pessoas = samples;
    } catch (error) {
      results.errors.push({ query: 'samples', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Query 5: Try the actual customer query
    try {
      const customerQuery = await query(
        `SELECT 
          fnc_pes_id as id,
          fnc_pes_nome_fantasia as name,
          fnc_pes_email as email,
          fnc_pes_telefone as phone,
          fnc_pes_cpf_cnpj as cpf_cnpj,
          fnc_pes_cidade as city,
          fnc_pes_uf as state,
          fnc_pes_tipo_pessoa as tipo_pessoa,
          fnc_pes_status as status
        FROM pessoas_financesweb 
        WHERE (fnc_pes_status = 'A' OR fnc_pes_status = 'ATIVO')
        LIMIT 10`
      );
      results.queries.customersWithFilter = {
        count: customerQuery.length,
        data: customerQuery
      };
    } catch (error) {
      results.errors.push({ query: 'customer_query', error: error instanceof Error ? error.message : 'Unknown error' });
    }

  } catch (error) {
    results.errors.push({ query: 'connection', error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return NextResponse.json(results);
}