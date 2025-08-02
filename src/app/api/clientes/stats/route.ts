import { NextResponse } from 'next/server';
import { PessoaService } from '@/services/database/pessoaService';

export async function GET() {
  try {
    const stats = await PessoaService.getStats();
    
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