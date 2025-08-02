import { Pool } from 'pg';
import { getPool } from '@/lib/db-wrapper';

export interface PessoaFinancesweb {
  fnc_pes_id: number;
  fnc_pes_tipo_pessoa?: string;
  fnc_pes_cpf_cnpj?: string;
  fnc_pes_nome_fantasia?: string;
  fnc_pes_razao_social?: string;
  fnc_pes_rg_ie?: string;
  fnc_pes_cep?: string;
  fnc_pes_endereco?: string;
  fnc_pes_numero?: string;
  fnc_pes_complemento?: string;
  fnc_pes_bairro?: string;
  fnc_pes_cidade?: string;
  fnc_pes_uf?: string;
  fnc_pes_codigo_municipio?: string;
  fnc_pes_telefone?: string;
  fnc_pes_telefone_principal?: string; // Campo alternativo que pode existir
  fnc_pes_celular?: string;
  fnc_pes_email?: string;
  fnc_pes_observacoes?: string;
  fnc_pes_status?: string;
  fnc_pes_ativo?: boolean; // Campo alternativo para status
  fnc_pes_limite_credito?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class PessoaFinanceswebService {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS pessoas_financesweb (
        fnc_pes_id INTEGER PRIMARY KEY,
        fnc_pes_tipo_pessoa VARCHAR(2),
        fnc_pes_cpf_cnpj VARCHAR(20),
        fnc_pes_nome_fantasia VARCHAR(255),
        fnc_pes_razao_social VARCHAR(255),
        fnc_pes_rg_ie VARCHAR(50),
        fnc_pes_cep VARCHAR(10),
        fnc_pes_endereco VARCHAR(255),
        fnc_pes_numero VARCHAR(20),
        fnc_pes_complemento VARCHAR(100),
        fnc_pes_bairro VARCHAR(100),
        fnc_pes_cidade VARCHAR(100),
        fnc_pes_uf VARCHAR(2),
        fnc_pes_codigo_municipio VARCHAR(10),
        fnc_pes_telefone VARCHAR(20),
        fnc_pes_celular VARCHAR(20),
        fnc_pes_email VARCHAR(255),
        fnc_pes_observacoes TEXT,
        fnc_pes_status VARCHAR(20),
        fnc_pes_limite_credito NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pessoas_fnc_nome_fantasia 
      ON pessoas_financesweb(fnc_pes_nome_fantasia);
      
      CREATE INDEX IF NOT EXISTS idx_pessoas_fnc_razao_social 
      ON pessoas_financesweb(fnc_pes_razao_social);
      
      CREATE INDEX IF NOT EXISTS idx_pessoas_fnc_cpf_cnpj 
      ON pessoas_financesweb(fnc_pes_cpf_cnpj);
      
      CREATE INDEX IF NOT EXISTS idx_pessoas_fnc_tipo_pessoa 
      ON pessoas_financesweb(fnc_pes_tipo_pessoa);
    `;

    await this.pool.query(query);
  }

  async upsertMany(pessoas: PessoaFinancesweb[]): Promise<{
    inseridos: number;
    atualizados: number;
    erros: number;
  }> {
    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    for (const pessoa of pessoas) {
      try {
        // Verifica se já existe
        const existsResult = await this.pool.query(
          'SELECT 1 FROM pessoas_financesweb WHERE fnc_pes_id = $1',
          [pessoa.fnc_pes_id]
        );

        if (existsResult.rows.length === 0) {
          // Insere novo
          await this.pool.query(`
            INSERT INTO pessoas_financesweb (
              fnc_pes_id, fnc_pes_tipo_pessoa, fnc_pes_cpf_cnpj, fnc_pes_nome_fantasia,
              fnc_pes_razao_social, fnc_pes_rg_ie, fnc_pes_cep, fnc_pes_endereco,
              fnc_pes_numero, fnc_pes_complemento, fnc_pes_bairro, fnc_pes_cidade,
              fnc_pes_uf, fnc_pes_codigo_municipio, fnc_pes_telefone, fnc_pes_celular,
              fnc_pes_email, fnc_pes_observacoes, fnc_pes_status, fnc_pes_limite_credito
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
          `, [
            pessoa.fnc_pes_id,
            pessoa.fnc_pes_tipo_pessoa,
            pessoa.fnc_pes_cpf_cnpj,
            pessoa.fnc_pes_nome_fantasia,
            pessoa.fnc_pes_razao_social,
            pessoa.fnc_pes_rg_ie,
            pessoa.fnc_pes_cep,
            pessoa.fnc_pes_endereco,
            pessoa.fnc_pes_numero,
            pessoa.fnc_pes_complemento,
            pessoa.fnc_pes_bairro,
            pessoa.fnc_pes_cidade,
            pessoa.fnc_pes_uf,
            pessoa.fnc_pes_codigo_municipio,
            pessoa.fnc_pes_telefone,
            pessoa.fnc_pes_celular,
            pessoa.fnc_pes_email,
            pessoa.fnc_pes_observacoes,
            pessoa.fnc_pes_status,
            pessoa.fnc_pes_limite_credito
          ]);
          inseridos++;
        } else {
          // Atualiza existente
          await this.pool.query(`
            UPDATE pessoas_financesweb SET
              fnc_pes_nome_fantasia = $2,
              fnc_pes_razao_social = $3,
              fnc_pes_telefone = $4,
              fnc_pes_celular = $5,
              fnc_pes_email = $6,
              fnc_pes_status = $7,
              fnc_pes_limite_credito = $8,
              updated_at = CURRENT_TIMESTAMP
            WHERE fnc_pes_id = $1
          `, [
            pessoa.fnc_pes_id,
            pessoa.fnc_pes_nome_fantasia,
            pessoa.fnc_pes_razao_social,
            pessoa.fnc_pes_telefone,
            pessoa.fnc_pes_celular,
            pessoa.fnc_pes_email,
            pessoa.fnc_pes_status,
            pessoa.fnc_pes_limite_credito
          ]);
          atualizados++;
        }
      } catch (error) {
        console.error(`Erro ao processar pessoa ${pessoa.fnc_pes_id}:`, error);
        erros++;
      }
    }

    return { inseridos, atualizados, erros };
  }

  async getAll(): Promise<PessoaFinancesweb[]> {
    const result = await this.pool.query(
      'SELECT * FROM pessoas_financesweb ORDER BY fnc_pes_nome_fantasia'
    );
    return result.rows;
  }

  async getById(id: number): Promise<PessoaFinancesweb | null> {
    const result = await this.pool.query(
      'SELECT * FROM pessoas_financesweb WHERE fnc_pes_id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getPessoasJuridicas(): Promise<PessoaFinancesweb[]> {
    const result = await this.pool.query(
      'SELECT * FROM pessoas_financesweb WHERE fnc_pes_tipo_pessoa = $1 ORDER BY fnc_pes_nome_fantasia',
      ['2']
    );
    return result.rows;
  }

  async search(query: string): Promise<PessoaFinancesweb[]> {
    const result = await this.pool.query(
      `SELECT * FROM pessoas_financesweb 
       WHERE fnc_pes_nome_fantasia ILIKE $1 
          OR fnc_pes_razao_social ILIKE $1 
          OR fnc_pes_cpf_cnpj ILIKE $1
       ORDER BY fnc_pes_nome_fantasia
       LIMIT 50`,
      [`%${query}%`]
    );
    return result.rows;
  }
}