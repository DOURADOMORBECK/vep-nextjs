import { NextRequest, NextResponse } from 'next/server';
import { usuarioService } from '@/services/database/usuarioService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    
    let usuarios = await usuarioService.getAllUsuarios();
    
    // Filtros
    if (search) {
      const searchLower = search.toLowerCase();
      usuarios = usuarios.filter(user => 
        user.nome.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.telefone?.includes(search)
      );
    }
    
    if (role) {
      usuarios = usuarios.filter(user => user.role === role);
    }
    
    if (department) {
      usuarios = usuarios.filter(user => user.department === department);
    }
    
    // Converter para formato esperado pela página
    const usersFormatted = usuarios.map(user => ({
      id: user.id.toString(),
      name: user.nome,
      email: user.email || '',
      phone: user.telefone || '',
      cpf: user.cpf || '',
      role: user.role,
      department: user.department,
      active: user.ativo,
      createdAt: user.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: user.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: user.ultimo_login?.toISOString(),
      avatar: user.avatar
    }));
    
    return NextResponse.json(usersFormatted);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Converter dados para formato do serviço
    const usuarioData = {
      nome: data.name,
      email: data.email,
      telefone: data.phone,
      cpf: data.cpf,
      role: data.role || 'user',
      department: data.department || 'Administrativo',
      ativo: data.active !== false
    };
    
    const newUsuario = await usuarioService.createUsuario(usuarioData);
    
    // Converter de volta para formato da página
    const userFormatted = {
      id: newUsuario.id.toString(),
      name: newUsuario.nome,
      email: newUsuario.email || '',
      phone: newUsuario.telefone || '',
      cpf: newUsuario.cpf || '',
      role: newUsuario.role,
      department: newUsuario.department,
      active: newUsuario.ativo,
      createdAt: newUsuario.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: newUsuario.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: newUsuario.ultimo_login?.toISOString(),
      avatar: newUsuario.avatar
    };
    
    return NextResponse.json(userFormatted, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}