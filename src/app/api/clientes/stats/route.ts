import { NextResponse } from 'next/server';
import { PessoaServiceV2 } from '@/services/database/pessoaServiceV2';

export async function GET() {
  try {
    const stats = await PessoaServiceV2.getStats();
    
    // Return only customer stats
    return NextResponse.json({
      total: stats.totalCustomers,
      active: stats.activeCustomers
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer stats' },
      { status: 500 }
    );
  }
}