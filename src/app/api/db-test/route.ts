import { NextResponse } from 'next/server';
import { query } from '@/lib/db-wrapper';

interface DbTestResults {
  databaseUrl: boolean;
  connection: boolean;
  tables: string[];
  productCount: number;
  customerCount?: number;
  customerCountTotal?: number;
  customerCountCliente?: number;
  customerCountClienteAmbos?: number;
  customerTypes?: Array<{ type: string; count: string }>;
  sampleCustomers?: unknown[];
  errors: Array<{ query: string; error: string }>;
}

export async function GET() {
  const results: DbTestResults = {
    databaseUrl: !!process.env.DATABASE_URL,
    connection: false,
    tables: [],
    productCount: 0,
    customerCount: 0,
    errors: []
  };

  try {
    // Test basic connection
    await query('SELECT 1 as test');
    results.connection = true;
    
    // Get product count
    try {
      const productCount = await query(
        `SELECT COUNT(*) as count FROM produtos_financesweb`
      );
      results.productCount = parseInt(productCount[0].count);
    } catch (error) {
      results.errors.push({ query: 'product_count', error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    // Get customer count with different queries
    try {
      // Try basic count
      const customerCount1 = await query(
        `SELECT COUNT(*) as count FROM pessoas_financesweb`
      );
      results.customerCountTotal = parseInt(customerCount1[0].count);
      
      // Try with type filter
      const customerCount2 = await query(
        `SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_tipo = 'CLIENTE'`
      );
      results.customerCountCliente = parseInt(customerCount2[0].count);
      
      // Try with OR condition
      const customerCount3 = await query(
        `SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_tipo = 'CLIENTE' OR fnc_pes_tipo = 'AMBOS'`
      );
      results.customerCountClienteAmbos = parseInt(customerCount3[0].count);
      
      // Check distinct types
      const types = await query<{ type: string; count: string }>(
        `SELECT DISTINCT fnc_pes_tipo as type, COUNT(*) as count 
         FROM pessoas_financesweb 
         GROUP BY fnc_pes_tipo`
      );
      results.customerTypes = types;
      
    } catch (error) {
      results.errors.push({ query: 'customer_queries', error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    // Get sample customer
    try {
      const sampleCustomer = await query(
        `SELECT * FROM pessoas_financesweb LIMIT 5`
      );
      results.sampleCustomers = sampleCustomer;
    } catch (error) {
      results.errors.push({ query: 'sample_customer', error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
  } catch (error) {
    results.connection = false;
    results.errors.push({ query: 'connection', error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return NextResponse.json(results);
}