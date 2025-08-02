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
    
    // Atualizar operador real no banco de dados
    const updateData = {
      nome: data.name,
      email: data.email,
      telefone: data.phone,
      ativo: data.active
    };
    
    const updatedOperador = await operadorService.updateOperador(parseInt(id), updateData);
    
    if (!updatedOperador) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }
    
    // Converter para formato esperado pela página
    const operatorFormatted = {
      id: updatedOperador.id.toString(),
      code: `OP${updatedOperador.id.toString().padStart(4, '0')}`,
      name: updatedOperador.nome,
      email: updatedOperador.email || '',
      phone: updatedOperador.telefone || '',
      cpf: data.cpf || '', // Campo extra
      role: data.role || 'operator',
      permissions: data.permissions || [],
      active: updatedOperador.ativo,
      createdAt: updatedOperador.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: updatedOperador.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: undefined
    };
    
    return NextResponse.json(operatorFormatted);
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
    // Deletar operador real do banco de dados (soft delete)
    const success = await operadorService.deleteOperador(parseInt(id));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json(
      { error: 'Failed to delete operator' },
      { status: 500 }
    );
  }
}