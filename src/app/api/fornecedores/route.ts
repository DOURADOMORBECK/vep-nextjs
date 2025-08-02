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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Converter dados do Supplier para formato Pessoa
    const pessoaData = {
      code: data.code || Date.now().toString(),
      name: data.name,
      cpf_cnpj: data.document,
      email: data.email,
      phone: data.phone,
      address: `${data.address}, ${data.number}${data.complement ? ', ' + data.complement : ''}`,
      city: data.city,
      state: data.state,
      cep: data.zipCode,
      type: 'supplier' as const,
      active: data.active !== false
    };
    
    const newPessoa = await PessoaService.create(pessoaData);
    
    // Convert the new pessoa to supplier format
    const supplier = {
      id: newPessoa.id,
      code: newPessoa.code,
      name: newPessoa.name,
      document: newPessoa.cpf_cnpj,
      email: newPessoa.email,
      phone: newPessoa.phone,
      whatsapp: newPessoa.phone,
      contact: '',
      address: newPessoa.address?.split(', ')[0] || '',
      number: newPessoa.address?.split(', ')[1] || '', 
      complement: newPessoa.address?.split(', ')[2] || '',
      city: newPessoa.city,
      state: newPessoa.state,
      zipCode: newPessoa.cep,
      categories: [],
      paymentTerms: '30 dias',
      deliveryDays: [],
      minimumOrder: 0,
      active: newPessoa.active,
      createdAt: newPessoa.createdAt,
      updatedAt: newPessoa.updatedAt
    };
    
    // Adicionar campos extras do formulário
    supplier.contact = data.contact || '';
    supplier.whatsapp = data.whatsapp || data.phone;
    supplier.categories = data.categories || [];
    supplier.paymentTerms = data.paymentTerms || '30 dias';
    supplier.deliveryDays = data.deliveryDays || [];
    supplier.minimumOrder = data.minimumOrder || 0;
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}