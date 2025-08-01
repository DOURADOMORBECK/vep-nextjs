import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid build-time execution
    const { getPool } = await import('@/lib/db-wrapper');
    
    const pool = getPool();
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    
    // List all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    return NextResponse.json({
      connected: true,
      time: result.rows[0].now,
      tables: tables.rows.map(r => r.table_name)
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}