import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    // Opcional: adicionar autenticação aqui para proteger este endpoint
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const tablesToDrop = [
      'operadores_financesweb',
      'pedidos_detalhe_financesweb', 
      'pessoas_financesweb',
      'produtos_financesweb'
    ];

    const results = {
      dropped: [] as string[],
      notFound: [] as string[],
      errors: [] as { table: string; error: string }[]
    };

    console.log('🗑️  Iniciando remoção de tabelas antigas...');

    for (const table of tablesToDrop) {
      try {
        // Verificar se a tabela existe
        const checkResult = await pool().query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        const tableExists = checkResult.rows[0].exists;

        if (tableExists) {
          console.log(`📋 Removendo tabela '${table}'...`);
          
          // Drop the table with CASCADE to remove dependencies
          await pool().query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
          
          results.dropped.push(table);
          console.log(`✅ Tabela '${table}' removida com sucesso!`);
        } else {
          results.notFound.push(table);
          console.log(`⏭️  Tabela '${table}' não existe.`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.errors.push({ table, error: errorMessage });
        console.error(`❌ Erro ao remover tabela '${table}':`, errorMessage);
      }
    }

    // Listar tabelas restantes
    const remainingTables = await pool().query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const remainingTableNames = remainingTables.rows.map(row => row.table_name);

    return NextResponse.json({
      success: true,
      results,
      remainingTables: remainingTableNames,
      summary: {
        droppedCount: results.dropped.length,
        notFoundCount: results.notFound.length,
        errorCount: results.errors.length
      }
    });

  } catch (error) {
    console.error('Erro ao executar limpeza:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao executar limpeza de tabelas antigas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET method to check which tables exist
export async function GET() {
  try {
    const tablesToCheck = [
      'operadores_financesweb',
      'pedidos_detalhe_financesweb', 
      'pessoas_financesweb',
      'produtos_financesweb'
    ];

    const results = {
      exists: [] as string[],
      notFound: [] as string[]
    };

    for (const table of tablesToCheck) {
      const checkResult = await pool().query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      if (checkResult.rows[0].exists) {
        results.exists.push(table);
      } else {
        results.notFound.push(table);
      }
    }

    // Listar todas as tabelas atuais
    const allTables = await pool().query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    return NextResponse.json({
      oldTables: results,
      currentTables: allTables.rows.map(row => row.table_name),
      summary: {
        oldTablesFound: results.exists.length,
        oldTablesAlreadyRemoved: results.notFound.length
      }
    });

  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar tabelas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}