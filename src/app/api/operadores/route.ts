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
    
    // Criar operador real no banco de dados
    const operadorData = {
      nome: data.name,
      email: data.email,
      telefone: data.phone,
      ativo: data.active !== false
    };
    
    const newOperador = await operadorService.createOperador(operadorData);
    
    // Converter para formato esperado pela página
    const operatorFormatted = {
      id: newOperador.id.toString(),
      code: `OP${newOperador.id.toString().padStart(4, '0')}`,
      name: newOperador.nome,
      email: newOperador.email || '',
      phone: newOperador.telefone || '',
      cpf: data.cpf || '', // Campo extra que não existe no banco
      role: data.role || 'operator',
      permissions: data.permissions || [],
      active: newOperador.ativo,
      createdAt: newOperador.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: newOperador.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: undefined
    };
    
    return NextResponse.json(operatorFormatted, { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json(
      { error: 'Failed to create operator' },
      { status: 500 }
    );
  }
}