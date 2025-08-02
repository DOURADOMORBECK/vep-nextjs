import { NextRequest, NextResponse } from 'next/server';
import { operadorService } from '@/services/database/operadorService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const operador = await operadorService.getOperadorById(parseInt(id));
    
    if (!operador) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }
    
    // Converter para formato esperado
    const operatorFormatted = {
      id: operador.id.toString(),
      code: `OP${operador.id.toString().padStart(4, '0')}`,
      name: operador.nome,
      email: operador.email || '',
      phone: operador.telefone || '',
      cpf: '', // Não disponível
      role: 'operator', // Padrão
      permissions: [], // Padrão
      active: operador.ativo,
      createdAt: operador.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: operador.data_atualizacao?.toISOString() || new Date().toISOString()
    };
    
    return NextResponse.json(operatorFormatted);
  } catch (error) {
    console.error('Error fetching operator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operator' },
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
    
    // Por enquanto, simular atualização
    // Em produção, você precisaria atualizar na tabela operadores_financesweb
    const updatedOperator = {
      id: id,
      code: data.code || `OP${id.padStart(4, '0')}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      role: data.role,
      permissions: data.permissions || [],
      active: data.active !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(updatedOperator);
  } catch (error) {
    console.error('Error updating operator:', error);
    return NextResponse.json(
      { error: 'Failed to update operator' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Por enquanto, apenas retornar sucesso
    // Em produção, você precisaria fazer soft delete na tabela
    
    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json(
      { error: 'Failed to delete operator' },
      { status: 500 }
    );
  }
}