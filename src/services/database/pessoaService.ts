import { query, queryOne } from '@/lib/db-wrapper';
import { PessoaFinancesweb } from './financesweb/pessoaFinanceswebService';
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

export class PessoaService {
  // Converte pessoa do FinancesWeb para formato da aplicação
  // Usando apenas campos que sabemos existir baseado nos erros do Railway
  private static mapFinanceswebToPessoa(pessoa: PessoaFinancesweb): Pessoa {
    return {
      id: pessoa.fnc_pes_id.toString(),
      code: pessoa.fnc_pes_cpf_cnpj || '',
      name: pessoa.fnc_pes_nome_fantasia || '', // razao_social não existe
      cpf_cnpj: pessoa.fnc_pes_cpf_cnpj || '',
      email: pessoa.fnc_pes_email || '',
      phone: pessoa.fnc_pes_telefone_principal || pessoa.fnc_pes_celular || '', // fnc_pes_telefone não existe
      address: [
        pessoa.fnc_pes_endereco || '',
        pessoa.fnc_pes_numero || '',
        pessoa.fnc_pes_complemento || ''
      ].filter(Boolean).join(', '),
      city: pessoa.fnc_pes_cidade || '',
      state: pessoa.fnc_pes_uf || '',
      cep: pessoa.fnc_pes_cep || '',
      type: this.determineType(pessoa),
      active: pessoa.fnc_pes_status === 'A' || pessoa.fnc_pes_status === 'ATIVO' || pessoa.fnc_pes_ativo === true,
      createdAt: pessoa.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: pessoa.updated_at?.toISOString() || new Date().toISOString()
    };
  }

  private static determineType(pessoa: PessoaFinancesweb): 'customer' | 'supplier' | 'both' {
    // Como fnc_pes_tipo_pessoa não existe, vamos usar uma lógica alternativa
    // Se tem CNPJ (14 dígitos), provavelmente é fornecedor
    // Se tem CPF (11 dígitos), provavelmente é cliente
    // Mas por padrão, vamos assumir que todos são clientes
    const doc = pessoa.fnc_pes_cpf_cnpj?.replace(/\D/g, '');
    if (doc && doc.length === 14) {
      return 'supplier';
    }
    // Por padrão, assumir cliente
    return 'customer';
  }

  static async getAll(type?: 'customer' | 'supplier' | 'both'): Promise<Pessoa[]> {
    try {
      let whereClause = 'WHERE 1=1';
      const params: string[] = [];
      
      // For now, return all active pessoas and let the type determination happen in mapping
      // This ensures we don't miss any records due to incorrect type filtering
      // Usando fnc_pes_ativo se fnc_pes_status não existir
      whereClause += " AND (fnc_pes_ativo = true OR fnc_pes_status = 'A' OR fnc_pes_status = 'ATIVO')";
      
      // Selecionando apenas campos que sabemos existir
      const result = await query<PessoaFinancesweb>(
        `SELECT 
          fnc_pes_id,
          fnc_pes_nome_fantasia,
          fnc_pes_cpf_cnpj,
          fnc_pes_email,
          fnc_pes_telefone_principal,
          fnc_pes_celular,
          fnc_pes_endereco,
          fnc_pes_numero,
          fnc_pes_complemento,
          fnc_pes_bairro,
          fnc_pes_cidade,
          fnc_pes_uf,
          fnc_pes_cep,
          fnc_pes_status,
          fnc_pes_ativo,
          created_at,
          updated_at
        FROM pessoas_financesweb ${whereClause} ORDER BY fnc_pes_nome_fantasia`,
        params
      );
      
      // Filter by type after mapping if specified
      let pessoas = result.map(this.mapFinanceswebToPessoa);
      if (type && type !== 'both') {
        pessoas = pessoas.filter(p => p.type === type || p.type === 'both');
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
        `SELECT 
          fnc_pes_id,
          fnc_pes_nome_fantasia,
          fnc_pes_cpf_cnpj,
          fnc_pes_email,
          fnc_pes_telefone_principal,
          fnc_pes_celular,
          fnc_pes_endereco,
          fnc_pes_numero,
          fnc_pes_complemento,
          fnc_pes_bairro,
          fnc_pes_cidade,
          fnc_pes_uf,
          fnc_pes_cep,
          fnc_pes_status,
          fnc_pes_ativo,
          created_at,
          updated_at
        FROM pessoas_financesweb 
         WHERE fnc_pes_nome_fantasia ILIKE $1 
            OR fnc_pes_cpf_cnpj ILIKE $1 
            OR fnc_pes_email ILIKE $1
            OR fnc_pes_telefone_principal ILIKE $1
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

  static async create(data: Omit<Pessoa, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pessoa> {
    try {
      const query = `
        INSERT INTO pessoas_financesweb (
          fnc_pes_nome_fantasia,
          fnc_pes_cpf_cnpj,
          fnc_pes_email,
          fnc_pes_telefone_principal,
          fnc_pes_endereco,
          fnc_pes_cidade,
          fnc_pes_uf,
          fnc_pes_cep,
          fnc_pes_ativo,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      
      // Extrair endereço, número e complemento
      const addressParts = data.address.split(', ');
      const endereco = addressParts[0] || '';
      
      const values = [
        data.name, // nome_fantasia
        data.cpf_cnpj,
        data.email,
        data.phone,
        endereco,
        data.city,
        data.state,
        data.cep,
        data.active // ativo
      ];
      
      const result = await pool().query<PessoaFinancesweb>(query, values);
      return this.mapFinanceswebToPessoa(result.rows[0]);
    } catch (error) {
      console.error('Error creating pessoa:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<Pessoa>): Promise<Pessoa | null> {
    try {
      const setParts: string[] = [];
      const values: (string | boolean)[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        setParts.push(`fnc_pes_razao_social = $${paramCount}, fnc_pes_nome_fantasia = $${paramCount}`);
        values.push(data.name);
        paramCount++;
      }
      if (data.email !== undefined) {
        setParts.push(`fnc_pes_email = $${paramCount}`);
        values.push(data.email);
        paramCount++;
      }
      if (data.phone !== undefined) {
        setParts.push(`fnc_pes_telefone_principal = $${paramCount}`);
        values.push(data.phone);
        paramCount++;
      }
      if (data.active !== undefined) {
        setParts.push(`fnc_pes_ativo = $${paramCount}`);
        values.push(data.active);
        paramCount++;
      }
      
      if (setParts.length === 0) {
        return await this.getById(id);
      }
      
      setParts.push(`updated_at = NOW()`);
      values.push(id);
      
      const updateQuery = `
        UPDATE pessoas_financesweb 
        SET ${setParts.join(', ')}
        WHERE fnc_pes_id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool().query<PessoaFinancesweb>(updateQuery, values);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return this.mapFinanceswebToPessoa(result.rows[0]);
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
      // Como não temos fnc_pes_tipo_pessoa, vamos usar a lógica de CPF/CNPJ
      // CPF tem 11 dígitos (clientes), CNPJ tem 14 dígitos (fornecedores)
      
      const totalResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb"
      );
      
      const activeResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE fnc_pes_ativo = true"
      );
      
      // Estimativa baseada em CPF vs CNPJ
      const customerResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE LENGTH(REGEXP_REPLACE(fnc_pes_cpf_cnpj, '[^0-9]', '', 'g')) = 11"
      );
      
      const supplierResult = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM pessoas_financesweb WHERE LENGTH(REGEXP_REPLACE(fnc_pes_cpf_cnpj, '[^0-9]', '', 'g')) = 14"
      );
      
      // Para simplificar, vamos assumir que todos ativos são proporcionalmente distribuídos
      const total = parseInt(totalResult?.count || '0');
      const active = parseInt(activeResult?.count || '0');
      const customers = parseInt(customerResult?.count || '0');
      const suppliers = parseInt(supplierResult?.count || '0');
      
      const activeRatio = total > 0 ? active / total : 0;
      
      return {
        totalCustomers: customers,
        activeCustomers: Math.round(customers * activeRatio),
        totalSuppliers: suppliers,
        activeSuppliers: Math.round(suppliers * activeRatio)
      };
    } catch (error) {
      console.error('Error fetching pessoa stats:', error);
      return { totalCustomers: 0, activeCustomers: 0, totalSuppliers: 0, activeSuppliers: 0 };
    }
  }
}