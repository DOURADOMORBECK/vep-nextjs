import { NextRequest, NextResponse } from 'next/server';
import { usuarioService } from '@/services/database/usuarioService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const usuario = await usuarioService.getUsuarioById(parseInt(id));
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Converter para formato esperado
    const userFormatted = {
      id: usuario.id.toString(),
      name: usuario.nome,
      email: usuario.email || '',
      phone: usuario.telefone || '',
      cpf: usuario.cpf || '',
      role: usuario.role,
      department: usuario.department,
      active: usuario.ativo,
      createdAt: usuario.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: usuario.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: usuario.ultimo_login?.toISOString(),
      avatar: usuario.avatar
    };
    
    return NextResponse.json(userFormatted);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    
    // Converter dados para formato do serviço
    const updateData = {
      nome: data.name,
      email: data.email,
      telefone: data.phone,
      cpf: data.cpf,
      role: data.role,
      department: data.department,
      ativo: data.active
    };
    
    const updatedUsuario = await usuarioService.updateUsuario(parseInt(id), updateData);
    
    if (!updatedUsuario) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Converter para formato da página
    const userFormatted = {
      id: updatedUsuario.id.toString(),
      name: updatedUsuario.nome,
      email: updatedUsuario.email || '',
      phone: updatedUsuario.telefone || '',
      cpf: updatedUsuario.cpf || '',
      role: updatedUsuario.role,
      department: updatedUsuario.department,
      active: updatedUsuario.ativo,
      createdAt: updatedUsuario.data_criacao?.toISOString() || new Date().toISOString(),
      updatedAt: updatedUsuario.data_atualizacao?.toISOString() || new Date().toISOString(),
      lastLogin: updatedUsuario.ultimo_login?.toISOString(),
      avatar: updatedUsuario.avatar
    };
    
    return NextResponse.json(userFormatted);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
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
    const success = await usuarioService.deleteUsuario(parseInt(id));
    
    if (!success) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}