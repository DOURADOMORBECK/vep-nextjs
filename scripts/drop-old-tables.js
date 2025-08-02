const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function dropOldTables() {
  const tablesToDrop = [
    'operadores_financesweb',
    'pedidos_detalhe_financesweb', 
    'pessoas_financesweb',
    'produtos_financesweb'
  ];

  console.log('🗑️  Iniciando remoção de tabelas antigas...\n');

  for (const table of tablesToDrop) {
    try {
      // Verificar se a tabela existe
      const checkResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      const tableExists = checkResult.rows[0].exists;

      if (tableExists) {
        console.log(`📋 Tabela '${table}' encontrada. Removendo...`);
        
        // Drop the table with CASCADE to remove dependencies
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        
        console.log(`✅ Tabela '${table}' removida com sucesso!\n`);
      } else {
        console.log(`⏭️  Tabela '${table}' não existe. Pulando...\n`);
      }
    } catch (error) {
      console.error(`❌ Erro ao remover tabela '${table}':`, error.message);
      console.log('');
    }
  }

  // Verificar tabelas restantes
  console.log('\n📊 Verificando tabelas restantes no banco de dados...\n');
  
  try {
    const remainingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('Tabelas atuais no banco de dados:');
    remainingTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
  } catch (error) {
    console.error('Erro ao listar tabelas restantes:', error.message);
  }

  await pool.end();
  console.log('\n✨ Processo concluído!');
}

// Executar o script
dropOldTables().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});