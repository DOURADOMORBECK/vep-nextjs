import { NextRequest, NextResponse } from 'next/server';
import { operadorService } from '@/services/database/operadorService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let operadores = await operadorService.getAllOperadores();
    
    // Filtrar por busca se fornecido
    if (search) {
      const searchLower = search.toLowerCase();
      operadores = operadores.filter(op => 
        op.nome.toLowerCase().includes(searchLower) ||
        op.email?.toLowerCase().includes(searchLower) ||
        op.telefone?.includes(search)
      );
    }
    
    // Converter para formato esperado pela página
    const operatorsFormatted = operadores.map(op => ({
      id: op.id.toString(),
      code: `OP${op.id.toString().padStart(4, '0')}`,
      name: op.nome,
      email: op.email || '',
      phone: op.telefone || '',
      cpf: '', // Não disponível no banco
      role: 'operator', // Padrão
      permissions: [], // Padrão vazio
      active: op.ativo,
      createdAt: op.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: op.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: undefined
    }));
    
    return NextResponse.json(operatorsFormatted);
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Por enquanto, simular criação
    // Em produção, você precisaria adicionar na tabela operadores_financesweb
    const newOperator = {
      id: Date.now().toString(),
      code: data.code || `OP${Date.now().toString().slice(-4)}`,
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
    
    return NextResponse.json(newOperator, { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json(
      { error: 'Failed to create operator' },
      { status: 500 }
    );
  }
}