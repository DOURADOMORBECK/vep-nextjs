import { NextRequest, NextResponse } from 'next/server';
import { PessoaServiceV2 } from '@/services/database/pessoaServiceV2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cliente = await PessoaServiceV2.getById(id);
    
    if (!cliente) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Verify it's a customer
    if (cliente.type !== 'customer' && cliente.type !== 'both') {
      return NextResponse.json(
        { error: 'Not a customer' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await request.json();
    const cliente = await PessoaServiceV2.update(id, data);
    
    if (!cliente) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}