'use server';

import { PessoaService } from '@/services/database/pessoaService';
import { FncPessoa } from '@/types/database';

export interface ClientData {
  id: string;
  code: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  deliveryNotes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert FncPessoa to ClientData
function convertToClientData(pessoa: FncPessoa): ClientData {
  return {
    id: pessoa.fnc_pes_id.toString(),
    code: pessoa.fnc_pes_id.toString(),
    name: pessoa.fnc_pes_nome_fantasia || '',
    type: pessoa.fnc_pes_tipo_pessoa === 'F' ? 'PF' : 'PJ',
    document: pessoa.fnc_pes_cpf || pessoa.fnc_pes_cnpj || '',
    email: pessoa.fnc_pes_email || '',
    phone: pessoa.fnc_pes_telefone_1 || '',
    whatsapp: pessoa.fnc_pes_celular || '',
    address: pessoa.fnc_pes_endereco || '',
    number: pessoa.fnc_pes_numero || '',
    complement: pessoa.fnc_pes_complemento || '',
    neighborhood: pessoa.fnc_pes_bairro || '',
    city: pessoa.fnc_pes_cidade || '',
    state: pessoa.fnc_pes_uf || '',
    zipCode: pessoa.fnc_pes_cep || '',
    latitude: parseFloat(pessoa.fnc_pes_latitude || '-23.550520'),
    longitude: parseFloat(pessoa.fnc_pes_longitude || '-46.633308'),
    deliveryNotes: '',
    active: pessoa.fnc_pes_status === 'A',
    createdAt: pessoa.fnc_pes_data_cadastro?.toISOString() || new Date().toISOString(),
    updatedAt: pessoa.fnc_pes_dh_atualizacao?.toISOString() || new Date().toISOString()
  };
}

// Convert ClientData to FncPessoa for insert/update
function convertToFncPessoa(client: Partial<ClientData>): Partial<FncPessoa> {
  return {
    fnc_pes_nome_fantasia: client.name,
    fnc_pes_razao_social: client.name,
    fnc_pes_tipo_pessoa: client.type === 'PF' ? 'F' : 'J',
    fnc_pes_tipo_cadastro: 'C', // Cliente
    fnc_pes_cpf: client.type === 'PF' ? client.document : undefined,
    fnc_pes_cnpj: client.type === 'PJ' ? client.document : undefined,
    fnc_pes_email: client.email,
    fnc_pes_telefone_1: client.phone,
    fnc_pes_celular: client.whatsapp,
    fnc_pes_endereco: client.address,
    fnc_pes_numero: client.number,
    fnc_pes_complemento: client.complement,
    fnc_pes_bairro: client.neighborhood,
    fnc_pes_cidade: client.city,
    fnc_pes_uf: client.state,
    fnc_pes_cep: client.zipCode,
    fnc_pes_latitude: client.latitude?.toString(),
    fnc_pes_longitude: client.longitude?.toString(),
    fnc_pes_status: client.active ? 'A' : 'I',
    fnc_emp_id: 1 // Default empresa
  };
}

export async function getClients(search?: string) {
  try {
    const pessoas = await PessoaService.getCustomers(search);
    return {
      success: true,
      data: pessoas.map(convertToClientData)
    };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return {
      success: false,
      error: 'Failed to fetch clients'
    };
  }
}

export async function getClientById(id: string) {
  try {
    const pessoa = await PessoaService.getById(parseInt(id));
    if (!pessoa) {
      return {
        success: false,
        error: 'Client not found'
      };
    }
    return {
      success: true,
      data: convertToClientData(pessoa)
    };
  } catch (error) {
    console.error('Error fetching client:', error);
    return {
      success: false,
      error: 'Failed to fetch client'
    };
  }
}

export async function createClient(clientData: Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const pessoaData = convertToFncPessoa(clientData);
    const newPessoa = await PessoaService.create(pessoaData);
    return {
      success: true,
      data: convertToClientData(newPessoa)
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return {
      success: false,
      error: 'Failed to create client'
    };
  }
}

export async function updateClient(id: string, clientData: Partial<ClientData>) {
  try {
    const pessoaData = convertToFncPessoa(clientData);
    const updatedPessoa = await PessoaService.update(parseInt(id), pessoaData);
    if (!updatedPessoa) {
      return {
        success: false,
        error: 'Client not found'
      };
    }
    return {
      success: true,
      data: convertToClientData(updatedPessoa)
    };
  } catch (error) {
    console.error('Error updating client:', error);
    return {
      success: false,
      error: 'Failed to update client'
    };
  }
}

export async function deleteClient(id: string) {
  try {
    await PessoaService.delete(parseInt(id));
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: 'Failed to delete client'
    };
  }
}

export async function searchClientsByLocation(lat: number, lng: number, radiusKm: number = 10) {
  try {
    const pessoas = await PessoaService.getByLocation(lat, lng, radiusKm);
    return {
      success: true,
      data: pessoas.map(convertToClientData)
    };
  } catch (error) {
    console.error('Error searching clients by location:', error);
    return {
      success: false,
      error: 'Failed to search clients by location'
    };
  }
}