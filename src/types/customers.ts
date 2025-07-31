export interface Customer {
  fnc_pes_id: number;
  fnc_emp_id: number;
  fnc_pes_data_cadastro: string;
  fnc_pes_tipo_cadastro: string;
  fnc_pes_tipo_pessoa: 'PF' | 'PJ';
  fnc_pes_nome_fantasia: string;
  fnc_pes_razao_social: string;
  fnc_pes_cpf?: string;
  fnc_pes_cnpj?: string;
  fnc_pes_ie?: string;
  fnc_pes_insc_municipal?: string;
  fnc_pes_insc_suframa?: string;
  fnc_pes_insc_produtor?: string;
  fnc_pes_cep: string;
  fnc_pes_endereco: string;
  fnc_pes_numero: string;
  fnc_pes_complemento?: string;
  fnc_pes_bairro: string;
  fnc_pes_cidade: string;
  fnc_pes_uf: string;
  fnc_pes_latitude?: string;
  fnc_pes_longitude?: string;
  fnc_pes_telefone_1?: string;
  fnc_pes_telefone_2?: string;
  fnc_pes_celular?: string;
  fnc_pes_email: string;
  fnc_pes_email_financeiro?: string;
  fnc_pes_contato?: string;
  fnc_pes_status: string;
  fnc_pes_limite_de_credito: number;
  fnc_pes_dh_atualizacao: string;
}

export interface Supplier extends Customer {
  // Suppliers use the same structure as customers
}

export interface CreateCustomerData {
  tipo_pessoa: 'PF' | 'PJ';
  nome_fantasia: string;
  razao_social?: string;
  cpf?: string;
  cnpj?: string;
  ie?: string;
  insc_municipal?: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude?: string;
  longitude?: string;
  telefone_1?: string;
  telefone_2?: string;
  celular?: string;
  email: string;
  email_financeiro?: string;
  contato?: string;
  status?: string;
  limite_credito?: number;
  emp_id?: number;
}

export interface CreateSupplierData extends CreateCustomerData {
  // Suppliers use the same data structure as customers
}

export interface CustomerFilters {
  status?: string;
  tipo_pessoa?: string;
  limit?: number;
  offset?: number;
}