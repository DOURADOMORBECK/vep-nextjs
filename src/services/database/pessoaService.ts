import { query, queryOne } from '@/lib/db-wrapper';
import { PessoaFinancesweb } from './financesweb/pessoaFinanceswebService';

export interface Pessoa {
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

export class PessoaService {
  // Converte pessoa do FinancesWeb para formato da aplicação
  private static mapFinanceswebToPessoa(pessoa: PessoaFinancesweb): Pessoa {
    return {
      id: pessoa.fnc_pes_id.toString(),
      code: pessoa.fnc_pes_cpf_cnpj || '',
      name: pessoa.fnc_pes_nome_fantasia || pessoa.fnc_pes_razao_social || '',
      cpf_cnpj: pessoa.fnc_pes_cpf_cnpj || '',
      email: pessoa.fnc_pes_email || '',
      phone: pessoa.fnc_pes_telefone || pessoa.fnc_pes_celular || '',
      address: [
        pessoa.fnc_pes_endereco || '',
        pessoa.fnc_pes_numero || '',
        pessoa.fnc_pes_complemento || ''
      ].filter(Boolean).join(', '),
      city: pessoa.fnc_pes_cidade || '',
      state: pessoa.fnc_pes_uf || '',
      cep: pessoa.fnc_pes_cep || '',
      type: this.determineType(pessoa),
      active: pessoa.fnc_pes_status === 'A' || pessoa.fnc_pes_status === 'ATIVO',
      createdAt: pessoa.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: pessoa.updated_at?.toISOString() || new Date().toISOString()
    };
  }

  private static determineType(pessoa: PessoaFinancesweb): 'customer' | 'supplier' | 'both' {
    // Tipo pessoa: 1 = Física (geralmente cliente), 2 = Jurídica (geralmente fornecedor)
    // Mas alguns podem ser ambos
    return pessoa.fnc_pes_tipo_pessoa === '2' ? 'supplier' : 'customer';
  }

  static async getAll(type?: 'customer' | 'supplier' | 'both'): Promise<Pessoa[]> {
    try {
      let whereClause = '';
      const params: any[] = [];
      
      if (type === 'customer') {
        whereClause = "WHERE fnc_pes_tipo_pessoa = '1'";
      } else if (type === 'supplier') {
        whereClause = "WHERE fnc_pes_tipo_pessoa = '2'";
      }
      
      const result = await query<PessoaFinancesweb>(
        `SELECT * FROM pessoas_financesweb ${whereClause} ORDER BY fnc_pes_nome_fantasia`,
        params
      );
      
      return result.map(this.mapFinanceswebToPessoa);
    } catch (error) {
      console.error('Error fetching pessoas:', error);
      return [];
    }
  }

  static async getCustomers(): Promise<Pessoa[]> {
    return this.getAll('customer');
  }

  static async getSuppliers(): Promise<Pessoa[]> {
    return this.getAll('supplier');
  }

  static async getById(id: string): Promise<Pessoa | null> {
    try {
      const result = await queryOne<PessoaFinancesweb>(
        'SELECT * FROM pessoas_financesweb WHERE fnc_pes_id = $1',
        [parseInt(id)]
      );
      
      if (!result) return null;
      return this.mapFinanceswebToPessoa(result);
    } catch (error) {
      console.error('Error fetching pessoa by id:', error);
      return null;
    }
  }

  static async search(searchTerm: string): Promise<Pessoa[]> {
    try {
      const result = await query<PessoaFinancesweb>(
        `SELECT * FROM pessoas_financesweb 
         WHERE fnc_pes_nome_fantasia ILIKE $1 
            OR fnc_pes_razao_social ILIKE $1
            OR fnc_pes_cpf_cnpj ILIKE $1 
            OR fnc_pes_email ILIKE $1
            OR fnc_pes_telefone ILIKE $1
         ORDER BY fnc_pes_nome_fantasia
         LIMIT 50`,
        [`%${searchTerm}%`]
      );
      
      return result.map(this.mapFinanceswebToPessoa);
    } catch (error) {
      console.error('Error searching pessoas:', error);
      return [];
    }
  }

  static async update(id: string, data: Partial<Pessoa>): Promise<Pessoa | null> {
    try {
      // Por enquanto, vamos apenas simular a atualização
      // Em produção, você pode decidir se quer atualizar diretamente no FinancesWeb
      // ou manter uma tabela local de overrides
      const pessoa = await this.getById(id);
      if (!pessoa) return null;
      
      // Retorna a pessoa com as atualizações aplicadas (simulado)
      return { ...pessoa, ...data, updatedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error updating pessoa:', error);
      return null;
    }
  }

  static async getStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalSuppliers: number;
    activeSuppliers: number;
  }> {
    try {
      const customerResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_tipo_pessoa = '1'"
      );
      
      const activeCustomerResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_tipo_pessoa = '1' AND (fnc_pes_status = 'A' OR fnc_pes_status = 'ATIVO')"
      );
      
      const supplierResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_tipo_pessoa = '2'"
      );
      
      const activeSupplierResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_tipo_pessoa = '2' AND (fnc_pes_status = 'A' OR fnc_pes_status = 'ATIVO')"
      );
      
      return {
        totalCustomers: parseInt(customerResult?.count || '0'),
        activeCustomers: parseInt(activeCustomerResult?.count || '0'),
        totalSuppliers: parseInt(supplierResult?.count || '0'),
        activeSuppliers: parseInt(activeSupplierResult?.count || '0')
      };
    } catch (error) {
      console.error('Error fetching pessoa stats:', error);
      return { totalCustomers: 0, activeCustomers: 0, totalSuppliers: 0, activeSuppliers: 0 };
    }
  }
}