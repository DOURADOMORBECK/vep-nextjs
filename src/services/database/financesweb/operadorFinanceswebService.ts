import { Pool } from 'pg';
import { getPool } from '@/lib/db-wrapper';

export interface OperadorFinancesweb {
  fnc_ope_id: number;
  fnc_emp_id?: number;
  fnc_ope_tipo_usuario?: string;
  fnc_ope_nome?: string;
  fnc_ope_status?: string;
  fnc_ope_comissao_vendas?: number;
  fnc_ope_limite_desconto?: number;
  fnc_ope_dh_atualizacao?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class OperadorFinanceswebService {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS operadores_financesweb (
        fnc_ope_id INTEGER PRIMARY KEY,
        fnc_emp_id INTEGER,
        fnc_ope_tipo_usuario VARCHAR(50),
        fnc_ope_nome VARCHAR(255),
        fnc_ope_status VARCHAR(20),
        fnc_ope_comissao_vendas NUMERIC(5,2),
        fnc_ope_limite_desconto NUMERIC(5,2),
        fnc_ope_dh_atualizacao TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_operadores_fnc_nome 
      ON operadores_financesweb(fnc_ope_nome);
      
      CREATE INDEX IF NOT EXISTS idx_operadores_fnc_tipo 
      ON operadores_financesweb(fnc_ope_tipo_usuario);
      
      CREATE INDEX IF NOT EXISTS idx_operadores_fnc_status 
      ON operadores_financesweb(fnc_ope_status);
    `;

    await this.pool.query(query);
  }

  async upsertMany(operadores: OperadorFinancesweb[]): Promise<{
    inseridos: number;
    atualizados: number;
    erros: number;
  }> {
    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    for (const operador of operadores) {
      try {
        // Verifica se já existe
        const existsResult = await this.pool.query(
          'SELECT 1 FROM operadores_financesweb WHERE fnc_ope_id = $1',
          [operador.fnc_ope_id]
        );

        if (existsResult.rows.length === 0) {
          // Insere novo
          await this.pool.query(`
            INSERT INTO operadores_financesweb (
              fnc_ope_id, fnc_emp_id, fnc_ope_tipo_usuario, fnc_ope_nome,
              fnc_ope_status, fnc_ope_comissao_vendas, fnc_ope_limite_desconto,
              fnc_ope_dh_atualizacao
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8
            )
          `, [
            operador.fnc_ope_id,
            operador.fnc_emp_id,
            operador.fnc_ope_tipo_usuario,
            operador.fnc_ope_nome,
            operador.fnc_ope_status,
            operador.fnc_ope_comissao_vendas,
            operador.fnc_ope_limite_desconto,
            operador.fnc_ope_dh_atualizacao
          ]);
          inseridos++;
        } else {
          // Atualiza existente
          await this.pool.query(`
            UPDATE operadores_financesweb SET
              fnc_ope_nome = $2,
              fnc_ope_status = $3,
              fnc_ope_tipo_usuario = $4,
              fnc_ope_comissao_vendas = $5,
              fnc_ope_limite_desconto = $6,
              fnc_ope_dh_atualizacao = $7,
              updated_at = CURRENT_TIMESTAMP
            WHERE fnc_ope_id = $1
          `, [
            operador.fnc_ope_id,
            operador.fnc_ope_nome,
            operador.fnc_ope_status,
            operador.fnc_ope_tipo_usuario,
            operador.fnc_ope_comissao_vendas,
            operador.fnc_ope_limite_desconto,
            operador.fnc_ope_dh_atualizacao
          ]);
          atualizados++;
        }
      } catch (error) {
        console.error(`Erro ao processar operador ${operador.fnc_ope_id}:`, error);
        erros++;
      }
    }

    return { inseridos, atualizados, erros };
  }

  async getAll(): Promise<OperadorFinancesweb[]> {
    const result = await this.pool.query(
      'SELECT * FROM operadores_financesweb ORDER BY fnc_ope_nome'
    );
    return result.rows;
  }

  async getById(id: number): Promise<OperadorFinancesweb | null> {
    const result = await this.pool.query(
      'SELECT * FROM operadores_financesweb WHERE fnc_ope_id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getAtivos(): Promise<OperadorFinancesweb[]> {
    const result = await this.pool.query(
      'SELECT * FROM operadores_financesweb WHERE fnc_ope_status = $1 ORDER BY fnc_ope_nome',
      ['1']
    );
    return result.rows;
  }

  async search(query: string): Promise<OperadorFinancesweb[]> {
    const result = await this.pool.query(
      `SELECT * FROM operadores_financesweb 
       WHERE fnc_ope_nome ILIKE $1 
       ORDER BY fnc_ope_nome
       LIMIT 50`,
      [`%${query}%`]
    );
    return result.rows;
  }
}