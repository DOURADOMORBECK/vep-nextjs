import { Pool } from 'pg';
import { getPool } from '@/lib/db-wrapper';

export interface PedidoDetalheFinancesweb {
  fnc_pvp_id: number;
  fnc_pve_id?: number;
  fnc_tpe_codigo?: number;
  fnc_tpe_descricao?: string;
  fnc_pve_sequencial_pedido?: number;
  fnc_emp_id?: number;
  fnc_pve_data_emissao?: string;
  fnc_pve_situacao?: string;
  fnc_pve_data_situacao?: string;
  fnc_nat_descricao?: string;
  fnc_nat_origem?: string;
  fnc_mod_modelo?: string;
  fnc_mod_descricao?: string;
  fnc_pve_numero_documento?: number;
  fnc_pve_serie_documento?: string;
  fnc_pes_id?: number;
  fnc_pes_nome_fantasia?: string;
  fnc_pes_razao_social?: string;
  fnc_pes_cidade?: string;
  fnc_pes_uf?: string;
  fnc_ope_id?: number;
  fnc_ope_nome?: string;
  fnc_pla_id?: number;
  fnc_pla_descricao?: string;
  fnc_fpg_id?: number;
  fnc_fpg_descricao?: string;
  fnc_pro_id?: number;
  fnc_pro_descricao?: string;
  fnc_pro_codigo_automacao?: string;
  fnc_gpr_descricao?: string;
  fnc_dep_descricao?: string;
  fnc_mar_descricao?: string;
  fnc_pvp_quantidade?: number;
  fnc_pvp_preco_unitario?: number;
  fnc_pvp_valor_desconto?: number;
  fnc_pvp_valor_acrescimo?: number;
  fnc_pvp_total_item?: number;
  fnc_pvp_valor_frete?: number;
  fnc_pvp_valor_seguro?: number;
  fnc_pvp_valor_outras_desp?: number;
  fnc_pvp_valor_icms_st?: number;
  fnc_pvp_valor_ipi?: number;
  fnc_pvp_valor_ipi_devolvido?: number;
  fnc_pvp_valor_fcp_st?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TotalPorCliente {
  fnc_pes_id: number;
  fnc_pes_nome_fantasia: string;
  fnc_pes_razao_social: string;
  total_pedidos: string;
  valor_total: string;
  quantidade_total: string;
}

export interface TotalPorProduto {
  fnc_pro_id: number;
  fnc_pro_descricao: string;
  total_pedidos: string;
  quantidade_vendida: string;
  valor_total: string;
}

export class PedidoDetalheFinanceswebService {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS pedidos_detalhe_financesweb (
        fnc_pvp_id INTEGER PRIMARY KEY,
        fnc_pve_id INTEGER,
        fnc_tpe_codigo INTEGER,
        fnc_tpe_descricao VARCHAR(100),
        fnc_pve_sequencial_pedido INTEGER,
        fnc_emp_id INTEGER,
        fnc_pve_data_emissao DATE,
        fnc_pve_situacao VARCHAR(20),
        fnc_pve_data_situacao DATE,
        fnc_nat_descricao VARCHAR(100),
        fnc_nat_origem VARCHAR(10),
        fnc_mod_modelo VARCHAR(10),
        fnc_mod_descricao VARCHAR(50),
        fnc_pve_numero_documento INTEGER,
        fnc_pve_serie_documento VARCHAR(10),
        fnc_pes_id INTEGER,
        fnc_pes_nome_fantasia VARCHAR(255),
        fnc_pes_razao_social VARCHAR(255),
        fnc_pes_cidade VARCHAR(100),
        fnc_pes_uf VARCHAR(2),
        fnc_ope_id INTEGER,
        fnc_ope_nome VARCHAR(255),
        fnc_pla_id INTEGER,
        fnc_pla_descricao VARCHAR(100),
        fnc_fpg_id INTEGER,
        fnc_fpg_descricao VARCHAR(100),
        fnc_pro_id INTEGER,
        fnc_pro_descricao VARCHAR(255),
        fnc_pro_codigo_automacao VARCHAR(50),
        fnc_gpr_descricao VARCHAR(100),
        fnc_dep_descricao VARCHAR(100),
        fnc_mar_descricao VARCHAR(100),
        fnc_pvp_quantidade NUMERIC(12,3),
        fnc_pvp_preco_unitario NUMERIC(12,2),
        fnc_pvp_valor_desconto NUMERIC(12,2),
        fnc_pvp_valor_acrescimo NUMERIC(12,2),
        fnc_pvp_total_item NUMERIC(12,2),
        fnc_pvp_valor_frete NUMERIC(12,2),
        fnc_pvp_valor_seguro NUMERIC(12,2),
        fnc_pvp_valor_outras_desp NUMERIC(12,2),
        fnc_pvp_valor_icms_st NUMERIC(12,2),
        fnc_pvp_valor_ipi NUMERIC(12,2),
        fnc_pvp_valor_ipi_devolvido NUMERIC(12,2),
        fnc_pvp_valor_fcp_st NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pedidos_detalhe_fnc_pve_id 
      ON pedidos_detalhe_financesweb(fnc_pve_id);
      
      CREATE INDEX IF NOT EXISTS idx_pedidos_detalhe_fnc_pes_id 
      ON pedidos_detalhe_financesweb(fnc_pes_id);
      
      CREATE INDEX IF NOT EXISTS idx_pedidos_detalhe_fnc_pro_id 
      ON pedidos_detalhe_financesweb(fnc_pro_id);
      
      CREATE INDEX IF NOT EXISTS idx_pedidos_detalhe_fnc_data_emissao 
      ON pedidos_detalhe_financesweb(fnc_pve_data_emissao);
    `;

    await this.pool.query(query);
  }

  async upsertMany(pedidos: PedidoDetalheFinancesweb[]): Promise<{
    inseridos: number;
    atualizados: number;
    erros: number;
  }> {
    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    for (const pedido of pedidos) {
      try {
        // Verifica se já existe
        const existsResult = await this.pool.query(
          'SELECT 1 FROM pedidos_detalhe_financesweb WHERE fnc_pvp_id = $1',
          [pedido.fnc_pvp_id]
        );

        if (existsResult.rows.length === 0) {
          // Insere novo
          await this.pool.query(`
            INSERT INTO pedidos_detalhe_financesweb (
              fnc_pvp_id, fnc_pve_id, fnc_tpe_codigo, fnc_tpe_descricao,
              fnc_pve_sequencial_pedido, fnc_emp_id, fnc_pve_data_emissao,
              fnc_pve_situacao, fnc_pve_data_situacao, fnc_nat_descricao,
              fnc_nat_origem, fnc_mod_modelo, fnc_mod_descricao,
              fnc_pve_numero_documento, fnc_pve_serie_documento,
              fnc_pes_id, fnc_pes_nome_fantasia, fnc_pes_razao_social,
              fnc_pes_cidade, fnc_pes_uf, fnc_ope_id, fnc_ope_nome,
              fnc_pla_id, fnc_pla_descricao, fnc_fpg_id, fnc_fpg_descricao,
              fnc_pro_id, fnc_pro_descricao, fnc_pro_codigo_automacao,
              fnc_gpr_descricao, fnc_dep_descricao, fnc_mar_descricao,
              fnc_pvp_quantidade, fnc_pvp_preco_unitario, fnc_pvp_valor_desconto,
              fnc_pvp_valor_acrescimo, fnc_pvp_total_item, fnc_pvp_valor_frete,
              fnc_pvp_valor_seguro, fnc_pvp_valor_outras_desp, fnc_pvp_valor_icms_st,
              fnc_pvp_valor_ipi, fnc_pvp_valor_ipi_devolvido, fnc_pvp_valor_fcp_st
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
              $41, $42, $43, $44
            )
          `, [
            pedido.fnc_pvp_id,
            pedido.fnc_pve_id,
            pedido.fnc_tpe_codigo,
            pedido.fnc_tpe_descricao,
            pedido.fnc_pve_sequencial_pedido,
            pedido.fnc_emp_id,
            pedido.fnc_pve_data_emissao,
            pedido.fnc_pve_situacao,
            pedido.fnc_pve_data_situacao,
            pedido.fnc_nat_descricao,
            pedido.fnc_nat_origem,
            pedido.fnc_mod_modelo,
            pedido.fnc_mod_descricao,
            pedido.fnc_pve_numero_documento,
            pedido.fnc_pve_serie_documento,
            pedido.fnc_pes_id,
            pedido.fnc_pes_nome_fantasia,
            pedido.fnc_pes_razao_social,
            pedido.fnc_pes_cidade,
            pedido.fnc_pes_uf,
            pedido.fnc_ope_id,
            pedido.fnc_ope_nome,
            pedido.fnc_pla_id,
            pedido.fnc_pla_descricao,
            pedido.fnc_fpg_id,
            pedido.fnc_fpg_descricao,
            pedido.fnc_pro_id,
            pedido.fnc_pro_descricao,
            pedido.fnc_pro_codigo_automacao,
            pedido.fnc_gpr_descricao,
            pedido.fnc_dep_descricao,
            pedido.fnc_mar_descricao,
            pedido.fnc_pvp_quantidade,
            pedido.fnc_pvp_preco_unitario,
            pedido.fnc_pvp_valor_desconto,
            pedido.fnc_pvp_valor_acrescimo,
            pedido.fnc_pvp_total_item,
            pedido.fnc_pvp_valor_frete,
            pedido.fnc_pvp_valor_seguro,
            pedido.fnc_pvp_valor_outras_desp,
            pedido.fnc_pvp_valor_icms_st,
            pedido.fnc_pvp_valor_ipi,
            pedido.fnc_pvp_valor_ipi_devolvido,
            pedido.fnc_pvp_valor_fcp_st
          ]);
          inseridos++;
        } else {
          // Atualiza existente (campos importantes)
          await this.pool.query(`
            UPDATE pedidos_detalhe_financesweb SET
              fnc_pve_situacao = $2,
              fnc_pve_data_situacao = $3,
              fnc_pvp_quantidade = $4,
              fnc_pvp_preco_unitario = $5,
              fnc_pvp_total_item = $6,
              updated_at = CURRENT_TIMESTAMP
            WHERE fnc_pvp_id = $1
          `, [
            pedido.fnc_pvp_id,
            pedido.fnc_pve_situacao,
            pedido.fnc_pve_data_situacao,
            pedido.fnc_pvp_quantidade,
            pedido.fnc_pvp_preco_unitario,
            pedido.fnc_pvp_total_item
          ]);
          atualizados++;
        }
      } catch (error) {
        console.error(`Erro ao processar pedido detalhe ${pedido.fnc_pvp_id}:`, error);
        erros++;
      }
    }

    return { inseridos, atualizados, erros };
  }

  async getByPedidoId(pedidoId: number): Promise<PedidoDetalheFinancesweb[]> {
    const result = await this.pool.query(
      'SELECT * FROM pedidos_detalhe_financesweb WHERE fnc_pve_id = $1 ORDER BY fnc_pvp_id',
      [pedidoId]
    );
    return result.rows;
  }

  async getByClienteId(clienteId: number): Promise<PedidoDetalheFinancesweb[]> {
    const result = await this.pool.query(
      `SELECT * FROM pedidos_detalhe_financesweb 
       WHERE fnc_pes_id = $1 
       ORDER BY fnc_pve_data_emissao DESC, fnc_pvp_id`,
      [clienteId]
    );
    return result.rows;
  }

  async getByProdutoId(produtoId: number): Promise<PedidoDetalheFinancesweb[]> {
    const result = await this.pool.query(
      `SELECT * FROM pedidos_detalhe_financesweb 
       WHERE fnc_pro_id = $1 
       ORDER BY fnc_pve_data_emissao DESC, fnc_pvp_id`,
      [produtoId]
    );
    return result.rows;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<PedidoDetalheFinancesweb[]> {
    const result = await this.pool.query(
      `SELECT * FROM pedidos_detalhe_financesweb 
       WHERE fnc_pve_data_emissao BETWEEN $1 AND $2 
       ORDER BY fnc_pve_data_emissao DESC, fnc_pvp_id`,
      [startDate, endDate]
    );
    return result.rows;
  }

  async getTotalsByCliente(): Promise<TotalPorCliente[]> {
    const result = await this.pool.query(`
      SELECT 
        fnc_pes_id,
        fnc_pes_nome_fantasia,
        fnc_pes_razao_social,
        COUNT(DISTINCT fnc_pve_id) as total_pedidos,
        SUM(fnc_pvp_total_item) as valor_total,
        SUM(fnc_pvp_quantidade) as quantidade_total
      FROM pedidos_detalhe_financesweb
      GROUP BY fnc_pes_id, fnc_pes_nome_fantasia, fnc_pes_razao_social
      ORDER BY valor_total DESC
    `);
    return result.rows;
  }

  async getTotalsByProduto(): Promise<TotalPorProduto[]> {
    const result = await this.pool.query(`
      SELECT 
        fnc_pro_id,
        fnc_pro_descricao,
        COUNT(DISTINCT fnc_pve_id) as total_pedidos,
        SUM(fnc_pvp_quantidade) as quantidade_vendida,
        SUM(fnc_pvp_total_item) as valor_total
      FROM pedidos_detalhe_financesweb
      GROUP BY fnc_pro_id, fnc_pro_descricao
      ORDER BY valor_total DESC
    `);
    return result.rows;
  }
}