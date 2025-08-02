#!/usr/bin/env node

/**
 * Test Database Schema and Data Flow
 * This script will help us understand the current database structure
 * and ensure data is properly flowing from PostgreSQL to frontend
 */

import { config } from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

const { Pool } = pg;

console.log('🔍 Testing Database Connection and Schema...\n');

async function testDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('Please make sure .env.local file exists and contains DATABASE_URL');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Get all tables in the database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\n📊 Available Tables:');
    console.log('==================');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Get schema for key tables
    const keyTables = [
      'produtos_financesweb',
      'pessoas_financesweb',
      'operadores_financesweb',
      'pedidos_venda_produtos',
      'sync_control',
      'users'
    ];
    
    console.log('\n📋 Table Schemas:');
    console.log('================');
    
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
          console.log(`\n🔸 ${tableName}:`);
          schemaResult.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            console.log(`   - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}`);
          });
          
          // Get sample data
          const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
          const countResult = await client.query(countQuery);
          console.log(`   📊 Total records: ${countResult.rows[0].count}`);
          
          // Get sample record if table has data
          if (parseInt(countResult.rows[0].count) > 0) {
            const sampleQuery = `SELECT * FROM ${tableName} LIMIT 1`;
            const sampleResult = await client.query(sampleQuery);
            console.log(`   📄 Sample record:`, JSON.stringify(sampleResult.rows[0], null, 2).substring(0, 200) + '...');
          }
        } else {
          console.log(`\n❌ Table ${tableName} not found`);
        }
      } catch (error) {
        console.log(`\n⚠️  Error checking table ${tableName}:`, error.message);
      }
    }
    
    // Test specific queries used by services
    console.log('\n🧪 Testing Service Queries:');
    console.log('=========================');
    
    // Test products query
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
      console.log(`\n✅ Products query works! Found ${productsResult.rows.length} products`);
      if (productsResult.rows.length > 0) {
        console.log('Sample product:', productsResult.rows[0]);
      }
    } catch (error) {
      console.log('\n❌ Products query failed:', error.message);
    }
    
    // Test customers query
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
      console.log(`\n✅ Customers query works! Found ${customersResult.rows.length} customers`);
      if (customersResult.rows.length > 0) {
        console.log('Sample customer:', customersResult.rows[0]);
      }
    } catch (error) {
      console.log('\n❌ Customers query failed:', error.message);
    }
    
    // Test dashboard stats
    try {
      const statsQueries = {
        products: "SELECT COUNT(*) AS total FROM produtos_financesweb WHERE fnc_pro_ativo = true",
        customers: "SELECT COUNT(*) AS total FROM pessoas_financesweb WHERE fnc_pes_ativo = true AND (fnc_pes_tipo = 'CLIENTE' OR fnc_pes_tipo = 'AMBOS')",
        operators: "SELECT COUNT(*) AS total FROM operadores_financesweb WHERE fnc_ope_ativo = true",
        orders: "SELECT COUNT(*) AS total FROM pedidos_venda_produtos"
      };
      
      console.log('\n📊 Dashboard Stats:');
      for (const [key, query] of Object.entries(statsQueries)) {
        try {
          const result = await client.query(query);
          console.log(`   - Total ${key}: ${result.rows[0].total}`);
        } catch (error) {
          console.log(`   ❌ ${key} count failed:`, error.message);
        }
      }
    } catch (error) {
      console.log('\n❌ Dashboard stats failed:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nMake sure DATABASE_URL is set correctly in .env.local');
    console.error('Current DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);