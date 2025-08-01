import { Pool } from 'pg';
import { getPool } from '@/lib/db-wrapper';

export interface ProdutoFinancesweb {
  fnc_pro_id: number;
  fnc_pro_codigo?: string;
  fnc_pro_descricao?: string;
  fnc_pro_descricao_nf?: string;
  fnc_pro_status?: string;
  fnc_pro_referencia?: string;
  fnc_pro_codigo_barras?: string;
  fnc_pro_codigo_barras_1?: string;
  fnc_pro_codigo_barras_2?: string;
  fnc_pro_codigo_automacao?: string;
  fnc_pro_unidade_medida?: string;
  fnc_mar_id?: number;
  fnc_mar_descricao?: string;
  fnc_gpr_id?: number;
  fnc_gpr_descricao?: string;
  fnc_dep_id?: number;
  fnc_dep_descricao?: string;
  fnc_pro_preco_venda?: number;
  fnc_pro_preco_promocao?: number;
  fnc_pro_custo_medio?: number;
  fnc_pro_peso_liquido?: number;
  fnc_pro_peso_bruto?: number;
  fnc_pro_estoque_atual?: number;
  fnc_pro_estoque_minimo?: number;
  fnc_pro_estoque_maximo?: number;
  fnc_pro_ncm?: string;
  fnc_pro_origem?: string;
  fnc_pro_observacoes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ProdutoFinanceswebService {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS produtos_financesweb (
        fnc_pro_id INTEGER PRIMARY KEY,
        fnc_pro_codigo VARCHAR(50),
        fnc_pro_descricao TEXT,
        fnc_pro_descricao_nf TEXT,
        fnc_pro_status VARCHAR(20),
        fnc_pro_referencia VARCHAR(100),
        fnc_pro_codigo_barras VARCHAR(50),
        fnc_pro_codigo_barras_1 VARCHAR(50),
        fnc_pro_codigo_barras_2 VARCHAR(50),
        fnc_pro_codigo_automacao VARCHAR(50),
        fnc_pro_unidade_medida VARCHAR(10),
        fnc_mar_id INTEGER,
        fnc_mar_descricao TEXT,
        fnc_gpr_id INTEGER,
        fnc_gpr_descricao TEXT,
        fnc_dep_id INTEGER,
        fnc_dep_descricao TEXT,
        fnc_pro_preco_venda NUMERIC(10,2),
        fnc_pro_preco_promocao NUMERIC(10,2),
        fnc_pro_custo_medio NUMERIC(10,2),
        fnc_pro_peso_liquido NUMERIC(10,3),
        fnc_pro_peso_bruto NUMERIC(10,3),
        fnc_pro_estoque_atual NUMERIC(12,3),
        fnc_pro_estoque_minimo NUMERIC(12,3),
        fnc_pro_estoque_maximo NUMERIC(12,3),
        fnc_pro_ncm VARCHAR(20),
        fnc_pro_origem VARCHAR(2),
        fnc_pro_observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_produtos_fnc_codigo 
      ON produtos_financesweb(fnc_pro_codigo);
      
      CREATE INDEX IF NOT EXISTS idx_produtos_fnc_descricao 
      ON produtos_financesweb(fnc_pro_descricao);
      
      CREATE INDEX IF NOT EXISTS idx_produtos_fnc_codigo_barras 
      ON produtos_financesweb(fnc_pro_codigo_barras);
    `;

    await this.pool.query(query);
  }

  async upsertMany(produtos: ProdutoFinancesweb[]): Promise<{
    inseridos: number;
    atualizados: number;
    erros: number;
  }> {
    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    for (const produto of produtos) {
      try {
        // Verifica se já existe
        const existsResult = await this.pool.query(
          'SELECT 1 FROM produtos_financesweb WHERE fnc_pro_id = $1',
          [produto.fnc_pro_id]
        );

        if (existsResult.rows.length === 0) {
          // Insere novo
          await this.pool.query(`
            INSERT INTO produtos_financesweb (
              fnc_pro_id, fnc_pro_codigo, fnc_pro_descricao, fnc_pro_descricao_nf,
              fnc_pro_status, fnc_pro_referencia, fnc_pro_codigo_barras,
              fnc_pro_codigo_barras_1, fnc_pro_codigo_barras_2, fnc_pro_codigo_automacao,
              fnc_pro_unidade_medida, fnc_mar_id, fnc_mar_descricao,
              fnc_gpr_id, fnc_gpr_descricao, fnc_dep_id, fnc_dep_descricao,
              fnc_pro_preco_venda, fnc_pro_preco_promocao, fnc_pro_custo_medio,
              fnc_pro_peso_liquido, fnc_pro_peso_bruto, fnc_pro_estoque_atual,
              fnc_pro_estoque_minimo, fnc_pro_estoque_maximo, fnc_pro_ncm,
              fnc_pro_origem, fnc_pro_observacoes
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28
            )
          `, [
            produto.fnc_pro_id,
            produto.fnc_pro_codigo,
            produto.fnc_pro_descricao,
            produto.fnc_pro_descricao_nf,
            produto.fnc_pro_status,
            produto.fnc_pro_referencia,
            produto.fnc_pro_codigo_barras,
            produto.fnc_pro_codigo_barras_1,
            produto.fnc_pro_codigo_barras_2,
            produto.fnc_pro_codigo_automacao,
            produto.fnc_pro_unidade_medida,
            produto.fnc_mar_id,
            produto.fnc_mar_descricao,
            produto.fnc_gpr_id,
            produto.fnc_gpr_descricao,
            produto.fnc_dep_id,
            produto.fnc_dep_descricao,
            produto.fnc_pro_preco_venda,
            produto.fnc_pro_preco_promocao,
            produto.fnc_pro_custo_medio,
            produto.fnc_pro_peso_liquido,
            produto.fnc_pro_peso_bruto,
            produto.fnc_pro_estoque_atual,
            produto.fnc_pro_estoque_minimo,
            produto.fnc_pro_estoque_maximo,
            produto.fnc_pro_ncm,
            produto.fnc_pro_origem,
            produto.fnc_pro_observacoes
          ]);
          inseridos++;
        } else {
          // Atualiza existente
          await this.pool.query(`
            UPDATE produtos_financesweb SET
              fnc_pro_descricao = $2,
              fnc_pro_status = $3,
              fnc_pro_preco_venda = $4,
              fnc_pro_preco_promocao = $5,
              fnc_pro_custo_medio = $6,
              fnc_pro_estoque_atual = $7,
              fnc_pro_estoque_minimo = $8,
              fnc_pro_estoque_maximo = $9,
              updated_at = CURRENT_TIMESTAMP
            WHERE fnc_pro_id = $1
          `, [
            produto.fnc_pro_id,
            produto.fnc_pro_descricao,
            produto.fnc_pro_status,
            produto.fnc_pro_preco_venda,
            produto.fnc_pro_preco_promocao,
            produto.fnc_pro_custo_medio,
            produto.fnc_pro_estoque_atual,
            produto.fnc_pro_estoque_minimo,
            produto.fnc_pro_estoque_maximo
          ]);
          atualizados++;
        }
      } catch (error) {
        console.error(`Erro ao processar produto ${produto.fnc_pro_id}:`, error);
        erros++;
      }
    }

    return { inseridos, atualizados, erros };
  }

  async getAll(): Promise<ProdutoFinancesweb[]> {
    const result = await this.pool.query(
      'SELECT * FROM produtos_financesweb ORDER BY fnc_pro_descricao'
    );
    return result.rows;
  }

  async getById(id: number): Promise<ProdutoFinancesweb | null> {
    const result = await this.pool.query(
      'SELECT * FROM produtos_financesweb WHERE fnc_pro_id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async search(query: string): Promise<ProdutoFinancesweb[]> {
    const result = await this.pool.query(
      `SELECT * FROM produtos_financesweb 
       WHERE fnc_pro_descricao ILIKE $1 
          OR fnc_pro_codigo ILIKE $1 
          OR fnc_pro_codigo_barras ILIKE $1
       ORDER BY fnc_pro_descricao
       LIMIT 50`,
      [`%${query}%`]
    );
    return result.rows;
  }
}