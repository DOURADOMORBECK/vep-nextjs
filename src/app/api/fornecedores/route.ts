import { NextRequest, NextResponse } from 'next/server';
import { PessoaService } from '@/services/database/pessoaService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let fornecedores;
    
    if (search) {
      // Search both suppliers and filter by type
      const pessoas = await PessoaService.search(search);
      fornecedores = pessoas.filter(p => p.type === 'supplier' || p.type === 'both');
    } else {
      fornecedores = await PessoaService.getSuppliers();
    }
    
    return NextResponse.json(fornecedores);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}