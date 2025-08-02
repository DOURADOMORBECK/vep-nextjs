import { NextRequest, NextResponse } from 'next/server';
import { PessoaService } from '@/services/database/pessoaService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let clientes;
    
    if (search) {
      // Search both customers and filter by type
      const pessoas = await PessoaService.search(search);
      clientes = pessoas.filter(p => p.type === 'customer' || p.type === 'both');
    } else {
      clientes = await PessoaService.getCustomers();
    }
    
    return NextResponse.json({ customers: clientes });
  } catch (error) {
    console.error('[API] Error fetching customers:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { 
          error: 'Database connection not configured',
          customers: []
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch customers',
        customers: []
      },
      { status: 500 }
    );
  }
}