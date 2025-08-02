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
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}