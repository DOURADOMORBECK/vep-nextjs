import { query, queryOne } from '@/lib/db-wrapper';
import { pool } from '@/lib/db';

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

// Interface para mapear clientes do PostgreSQL real
interface PessoaPostgres {
  fnc_pes_id: bigint;
  fnc_pes_nome_fantasia?: string;
  fnc_pes_razao_social?: string;
  fnc_pes_cidade?: string;
  fnc_pes_uf?: string;
  total_pedidos?: number;
  ultimo_pedido?: Date;
}

export class PessoaService {
  // Converte pessoa do PostgreSQL real para formato da aplicação
  // Como não há tabela separada de pessoas, extraímos da view de pedidos
  private static mapPostgresToPessoa(pessoa: PessoaPostgres): Pessoa {
    return {
      id: pessoa.fnc_pes_id.toString(),
      code: pessoa.fnc_pes_id.toString(), // Usando ID como código
      name: pessoa.fnc_pes_nome_fantasia || pessoa.fnc_pes_razao_social || 'Cliente',
      cpf_cnpj: '', // Não disponível na view
      email: '', // Não disponível na view
      phone: '', // Não disponível na view
      address: '', // Não disponível na view
      city: pessoa.fnc_pes_cidade || '',
      state: pessoa.fnc_pes_uf || '',
      cep: '', // Não disponível na view
      type: 'customer', // Todos são clientes na view de pedidos
      active: true, // Assumindo ativo se tem pedidos
      createdAt: pessoa.ultimo_pedido?.toISOString() || new Date().toISOString(),
      updatedAt: pessoa.ultimo_pedido?.toISOString() || new Date().toISOString()
    };
  }


  static async getAll(type?: 'customer' | 'supplier' | 'both'): Promise<Pessoa[]> {
    try {
      // Extrair clientes únicos da view de pedidos
      const result = await query<PessoaPostgres>(
        `SELECT DISTINCT
          fnc_pes_id,
          fnc_pes_nome_fantasia,
          fnc_pes_razao_social,
          fnc_pes_cidade,
          fnc_pes_uf,
          COUNT(*) as total_pedidos,
          MAX(fnc_pve_data_emissao) as ultimo_pedido
        FROM vw_pedidos_venda_produtos
        WHERE fnc_pes_id IS NOT NULL
        GROUP BY fnc_pes_id, fnc_pes_nome_fantasia, fnc_pes_razao_social, fnc_pes_cidade, fnc_pes_uf
        ORDER BY fnc_pes_nome_fantasia, fnc_pes_razao_social`
      );
      
      // Todos são clientes na view de pedidos
      let pessoas = result.map(this.mapPostgresToPessoa);
      
      // Filtrar apenas clientes se solicitado
      if (type === 'supplier') {
        return []; // Não há fornecedores na view de pedidos
      }
      
      return pessoas;
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
      const result = await queryOne<PessoaPostgres>(
        `SELECT DISTINCT
          fnc_pes_id,
          fnc_pes_nome_fantasia,
          fnc_pes_razao_social,
          fnc_pes_cidade,
          fnc_pes_uf,
          COUNT(*) as total_pedidos,
          MAX(fnc_pve_data_emissao) as ultimo_pedido
        FROM vw_pedidos_venda_produtos
        WHERE fnc_pes_id = $1
        GROUP BY fnc_pes_id, fnc_pes_nome_fantasia, fnc_pes_razao_social, fnc_pes_cidade, fnc_pes_uf`,
        [parseInt(id)]
      );
      
      if (!result) return null;
      return this.mapPostgresToPessoa(result);
    } catch (error) {
      console.error('Error fetching pessoa by id:', error);
      return null;
    }
  }

  static async search(searchTerm: string): Promise<Pessoa[]> {
    try {
      const result = await query<PessoaPostgres>(
        `SELECT DISTINCT
          fnc_pes_id,
          fnc_pes_nome_fantasia,
          fnc_pes_razao_social,
          fnc_pes_cidade,
          fnc_pes_uf,
          COUNT(*) as total_pedidos,
          MAX(fnc_pve_data_emissao) as ultimo_pedido
        FROM vw_pedidos_venda_produtos
        WHERE (fnc_pes_nome_fantasia ILIKE $1 
            OR fnc_pes_razao_social ILIKE $1
            OR fnc_pes_cidade ILIKE $1)
          AND fnc_pes_id IS NOT NULL
        GROUP BY fnc_pes_id, fnc_pes_nome_fantasia, fnc_pes_razao_social, fnc_pes_cidade, fnc_pes_uf
        ORDER BY fnc_pes_nome_fantasia, fnc_pes_razao_social
        LIMIT 50`,
        [`%${searchTerm}%`]
      );
      
      return result.map(this.mapPostgresToPessoa);
    } catch (error) {
      console.error('Error searching pessoas:', error);
      return [];
    }
  }

  static async create(data: Omit<Pessoa, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pessoa> {
    // Como não há tabela separada de pessoas, não podemos criar diretamente
    // Retornamos um objeto temporário que seria criado quando um pedido for feito
    console.log('Criação de pessoa solicitada:', data);
    console.log('Nota: Pessoas só são criadas automaticamente quando um pedido é registrado');
    
    return {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static async update(id: string, data: Partial<Pessoa>): Promise<Pessoa | null> {
    // Como não há tabela separada de pessoas, não podemos atualizar diretamente
    console.log(`Atualização de pessoa ${id} solicitada:`, data);
    console.log('Nota: Dados de pessoas são somente leitura da view de pedidos');
    
    // Retornar os dados atuais sem alterações
    return this.getById(id);
  }

  static async getStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalSuppliers: number;
    activeSuppliers: number;
  }> {
    try {
      // Contar clientes únicos da view de pedidos
      const totalResult = await queryOne<{ count: string }>(
        "SELECT COUNT(DISTINCT fnc_pes_id) as count FROM vw_pedidos_venda_produtos WHERE fnc_pes_id IS NOT NULL"
      );
      
      // Todos são clientes ativos (têm pedidos)
      const totalCustomers = parseInt(totalResult?.count || '0');
      
      return {
        totalCustomers: totalCustomers,
        activeCustomers: totalCustomers, // Todos são ativos
        totalSuppliers: 0, // Não há fornecedores na view
        activeSuppliers: 0
      };
    } catch (error) {
      console.error('Error fetching pessoa stats:', error);
      return { totalCustomers: 0, activeCustomers: 0, totalSuppliers: 0, activeSuppliers: 0 };
    }
  }
}

export const pessoaService = new PessoaService();