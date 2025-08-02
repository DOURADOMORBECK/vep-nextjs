import { NextResponse } from 'next/server';
import { query } from '@/lib/db-wrapper';

export async function GET() {
  const results: any = {
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
      results.queries.totalPessoas = parseInt(totalCount.rows[0].count);
    } catch (error: any) {
      results.errors.push({ query: 'total_count', error: error.message });
    }

    // Query 2: Get count by status
    try {
      const statusCount = await query(
        `SELECT fnc_pes_status, COUNT(*) as count 
         FROM pessoas_financesweb 
         GROUP BY fnc_pes_status`
      );
      results.queries.byStatus = statusCount.rows;
    } catch (error: any) {
      results.errors.push({ query: 'status_count', error: error.message });
    }

    // Query 3: Get count by tipo_pessoa
    try {
      const tipoCount = await query(
        `SELECT fnc_pes_tipo_pessoa, COUNT(*) as count 
         FROM pessoas_financesweb 
         GROUP BY fnc_pes_tipo_pessoa`
      );
      results.queries.byTipoPessoa = tipoCount.rows;
    } catch (error: any) {
      results.errors.push({ query: 'tipo_pessoa_count', error: error.message });
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
      results.samples.pessoas = samples.rows;
    } catch (error: any) {
      results.errors.push({ query: 'samples', error: error.message });
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
        count: customerQuery.rows.length,
        data: customerQuery.rows
      };
    } catch (error: any) {
      results.errors.push({ query: 'customer_query', error: error.message });
    }

  } catch (error: any) {
    results.errors.push({ query: 'connection', error: error.message });
  }

  return NextResponse.json(results);
}