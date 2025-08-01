import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders } from '@/config/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = createCorsHeaders(origin);

  try {
    // Dynamic import to avoid build-time execution
    const { healthCheck, queryOne } = await import('@/lib/db-wrapper');

    // Check if database is healthy
    const isHealthy = await healthCheck();

    if (!isHealthy) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed'
        },
        { status: 503, headers: corsHeaders }
      );
    }

    // Get PostgreSQL version
    const versionResult = await queryOne<{ version: string }>('SELECT version()');
    const version = versionResult?.version?.split(' ').slice(0, 2).join(' ') || 'Unknown';

    // Count tables
    const tablesResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'`
    );
    const tablesCount = parseInt(tablesResult?.count || '0');

    // Get record counts for main tables
    const tableNames = [
      'users',
      'fnc_pessoa',
      'fnc_produto',
      'pedido_venda_produto',
      'fnc_operador',
      'ssx_position',
      'delivery_routes',
      'audit_logs'
    ];

    const records: Record<string, number> = {};

    for (const tableName of tableNames) {
      try {
        const countResult = await queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        records[tableName] = parseInt(countResult?.count || '0');
      } catch (error) {
        // Table might not exist, ignore
        console.log(`Table ${tableName} not found or error counting:`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          version,
          tables: tablesCount,
          records
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[API Route] Database health check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check database health: ' + (error as Error).message
      },
      { status: 500, headers: corsHeaders }
    );
  }
}