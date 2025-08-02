import { NextRequest, NextResponse } from 'next/server';
import { PessoaService, type Pessoa } from '@/services/database/pessoaService';
import { pool } from '@/lib/db';

// Interface para Supplier que a página espera
interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'PJ' | 'PF';
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  contact: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  categories: string[];
  paymentTerms: string;
  deliveryDays: number[];
  minimumOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Função para converter Pessoa para Supplier
function convertPessoaToSupplier(pessoa: Pessoa): Supplier {
  // Extrair partes do endereço
  const addressParts = pessoa.address.split(', ');
  const address = addressParts[0] || '';
  const number = addressParts[1] || '';
  const complement = addressParts[2] || '';
  
  return {
    id: pessoa.id,
    code: pessoa.code || pessoa.cpf_cnpj,
    name: pessoa.name,
    type: pessoa.cpf_cnpj.length > 11 ? 'PJ' : 'PF',
    document: pessoa.cpf_cnpj,
    email: pessoa.email,
    phone: pessoa.phone,
    whatsapp: pessoa.phone, // Usar mesmo telefone
    contact: '', // Não disponível em Pessoa
    address: address,
    number: number,
    complement: complement,
    neighborhood: '', // Não disponível em Pessoa
    city: pessoa.city,
    state: pessoa.state,
    zipCode: pessoa.cep,
    categories: [], // Padrão vazio
    paymentTerms: '30 dias', // Padrão
    deliveryDays: [], // Padrão vazio
    minimumOrder: 0, // Padrão
    active: pessoa.active,
    createdAt: pessoa.createdAt,
    updatedAt: pessoa.updatedAt
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const pessoa = await PessoaService.getById(id);
    
    if (!pessoa) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    const supplier = convertPessoaToSupplier(pessoa);
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
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
    
    // Converter dados para formato Pessoa (apenas campos suportados)
    const updateData: Partial<Pessoa> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.active !== undefined) updateData.active = data.active;
    
    const updatedPessoa = await PessoaService.update(id, updateData);
    
    if (!updatedPessoa) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    const supplier = convertPessoaToSupplier(updatedPessoa);
    
    // Manter campos extras que foram enviados
    if (data.contact !== undefined) supplier.contact = data.contact;
    if (data.whatsapp !== undefined) supplier.whatsapp = data.whatsapp;
    if (data.categories !== undefined) supplier.categories = data.categories;
    if (data.paymentTerms !== undefined) supplier.paymentTerms = data.paymentTerms;
    if (data.deliveryDays !== undefined) supplier.deliveryDays = data.deliveryDays;
    if (data.minimumOrder !== undefined) supplier.minimumOrder = data.minimumOrder;
    
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
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
    // Soft delete - marca como inativo
    const updatedPessoa = await PessoaService.update(id, { active: false });
    
    if (!updatedPessoa) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}