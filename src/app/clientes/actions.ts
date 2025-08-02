'use server';

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

// Convert Pessoa to ClientData
interface PessoaType {
  id: string;
  code: string;
  name: string;
  cpf_cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  type: 'customer' | 'supplier' | 'both';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function convertToClientData(pessoa: PessoaType): ClientData {
  // Parse address to extract number and complement
  const addressParts = pessoa.address.split(', ');
  const address = addressParts[0] || '';
  const number = addressParts[1] || '';
  const complement = addressParts[2] || '';
  
  return {
    id: pessoa.id,
    code: pessoa.code,
    name: pessoa.name,
    type: pessoa.type === 'customer' ? 'PF' : 'PJ',
    document: pessoa.cpf_cnpj,
    email: pessoa.email,
    phone: pessoa.phone,
    whatsapp: pessoa.phone, // Use same phone for now
    address: address,
    number: number,
    complement: complement,
    neighborhood: '', // Not available in Pessoa
    city: pessoa.city,
    state: pessoa.state,
    zipCode: pessoa.cep,
    latitude: -23.550520, // Default for now
    longitude: -46.633308, // Default for now
    deliveryNotes: '',
    active: pessoa.active,
    createdAt: pessoa.createdAt,
    updatedAt: pessoa.updatedAt
  };
}


export async function getClients(search?: string) {
  try {
    const { PessoaService } = await import('@/services/database/pessoaService');
    const pessoas = search 
      ? await PessoaService.search(search)
      : await PessoaService.getCustomers();
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
    const { PessoaService } = await import('@/services/database/pessoaService');
    const pessoa = await PessoaService.getById(id);
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
    // Por enquanto, apenas retorna sucesso simulado
    // Em produção, você precisaria implementar a criação no banco
    const newClient: ClientData = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return {
      success: true,
      data: newClient
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
    const { PessoaService } = await import('@/services/database/pessoaService');
    
    // Converter ClientData para Pessoa parcial
    const updateData: Record<string, unknown> = {};
    if (clientData.name !== undefined) updateData.name = clientData.name;
    if (clientData.email !== undefined) updateData.email = clientData.email;
    if (clientData.phone !== undefined) updateData.phone = clientData.phone;
    if (clientData.active !== undefined) updateData.active = clientData.active;
    
    const updatedPessoa = await PessoaService.update(id, updateData);
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

export async function deleteClient(_id: string) {
  try {
    // Por enquanto, apenas retorna sucesso simulado
    // Em produção, você precisaria implementar a exclusão no banco
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

export async function searchClientsByLocation(_lat: number, _lng: number, _radiusKm: number = 10) {
  try {
    // Por enquanto, retorna todos os clientes
    // Em produção, você precisaria implementar busca por localização
    const { PessoaService } = await import('@/services/database/pessoaService');
    const pessoas = await PessoaService.getCustomers();
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