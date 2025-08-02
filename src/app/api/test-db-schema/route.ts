import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const results: any = {
    connection: false,
    tables: [],
    schemas: {},
    queries: {},
    stats: {},
    errors: []
  };

  try {
    const client = await pool().connect();
    results.connection = true;
    
    // Get all tables
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      
      const tablesResult = await client.query(tablesQuery);
      results.tables = tablesResult.rows.map(r => r.table_name);
    } catch (error: any) {
      results.errors.push({ step: 'tables', error: error.message });
    }
    
    // Get schema for key tables
    const keyTables = [
      'produtos_financesweb',
      'pessoas_financesweb',
      'operadores_financesweb',
      'pedidos_venda_produtos',
      'sync_control',
      'users'
    ];
    
    for (const tableName of keyTables) {
      try {
        const schemaQuery = `
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `;
        
        const schemaResult = await client.query(schemaQuery, [tableName]);
        
        if (schemaResult.rows.length > 0) {
          results.schemas[tableName] = {
            columns: schemaResult.rows,
            recordCount: 0,
            sample: null
          };
          
          // Get count
          try {
            const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
            const countResult = await client.query(countQuery);
            results.schemas[tableName].recordCount = parseInt(countResult.rows[0].count);
            
            // Get sample if has data
            if (results.schemas[tableName].recordCount > 0) {
              const sampleQuery = `SELECT * FROM ${tableName} LIMIT 1`;
              const sampleResult = await client.query(sampleQuery);
              results.schemas[tableName].sample = sampleResult.rows[0];
            }
          } catch (error: any) {
            results.errors.push({ step: `count_${tableName}`, error: error.message });
          }
        }
      } catch (error: any) {
        results.errors.push({ step: `schema_${tableName}`, error: error.message });
      }
    }
    
    // Test service queries
    
    // Products query
    try {
      const productsQuery = `
        SELECT 
          fnc_pro_id as id,
          fnc_pro_codigo_automacao as code,
          fnc_pro_descricao as name,
          fnc_gpr_descricao as category,
          fnc_uni_codigo as unit,
          fnc_pro_preco_venda as price,
          fnc_pro_estoque_atual as stock,
          fnc_pro_estoque_minimo as "minStock",
          fnc_pro_ativo as active
        FROM produtos_financesweb 
        WHERE fnc_pro_ativo = true 
        LIMIT 5
      `;
      const productsResult = await client.query(productsQuery);
      results.queries.products = {
        success: true,
        count: productsResult.rows.length,
        sample: productsResult.rows[0] || null
      };
    } catch (error: any) {
      results.queries.products = {
        success: false,
        error: error.message
      };
    }
    
    // Customers query
    try {
      const customersQuery = `
        SELECT 
          fnc_pes_id as id,
          fnc_pes_nome_fantasia as name,
          fnc_pes_email as email,
          fnc_pes_telefone_principal as phone,
          fnc_pes_cpf as cpf,
          fnc_pes_cnpj as cnpj,
          fnc_pes_cidade as city,
          fnc_pes_uf as state,
          fnc_pes_tipo as type,
          fnc_pes_ativo as active
        FROM pessoas_financesweb 
        WHERE fnc_pes_ativo = true 
        AND (fnc_pes_tipo = 'CLIENTE' OR fnc_pes_tipo = 'AMBOS')
        LIMIT 5
      `;
      const customersResult = await client.query(customersQuery);
      results.queries.customers = {
        success: true,
        count: customersResult.rows.length,
        sample: customersResult.rows[0] || null
      };
    } catch (error: any) {
      results.queries.customers = {
        success: false,
        error: error.message
      };
    }
    
    // Dashboard stats
    const statsQueries = {
      products: "SELECT COUNT(*) AS total FROM produtos_financesweb WHERE fnc_pro_ativo = true",
      customers: "SELECT COUNT(*) AS total FROM pessoas_financesweb WHERE fnc_pes_ativo = true AND (fnc_pes_tipo = 'CLIENTE' OR fnc_pes_tipo = 'AMBOS')",
      operators: "SELECT COUNT(*) AS total FROM operadores_financesweb WHERE fnc_ope_ativo = true",
      orders: "SELECT COUNT(*) AS total FROM pedidos_venda_produtos"
    };
    
    for (const [key, query] of Object.entries(statsQueries)) {
      try {
        const result = await client.query(query);
        results.stats[key] = parseInt(result.rows[0].total);
      } catch (error: any) {
        results.stats[key] = { error: error.message };
      }
    }
    
    client.release();
    
  } catch (error: any) {
    results.connection = false;
    results.errors.push({ step: 'connection', error: error.message });
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}