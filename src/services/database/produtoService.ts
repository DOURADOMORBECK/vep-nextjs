import { query, queryOne } from '@/lib/db';
import { FncProduto } from '@/types/database';

export class ProdutoService {
  // Get all produtos
  static async getAll(filters?: {
    status?: number;
    grupo?: string;
    departamento?: string;
    marca?: string;
    search?: string;
  }): Promise<FncProduto[]> {
    let sql = 'SELECT * FROM produtos WHERE 1=1';
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters?.status !== undefined) {
      sql += ` AND fnc_pro_status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.grupo) {
      sql += ` AND fnc_gpr_descricao = $${paramCount}`;
      params.push(filters.grupo);
      paramCount++;
    }

    if (filters?.departamento) {
      sql += ` AND fnc_dep_descricao = $${paramCount}`;
      params.push(filters.departamento);
      paramCount++;
    }

    if (filters?.marca) {
      sql += ` AND fnc_mar_descricao = $${paramCount}`;
      params.push(filters.marca);
      paramCount++;
    }

    if (filters?.search) {
      sql += ` AND (
        fnc_pro_descricao ILIKE $${paramCount} OR 
        fnc_pro_codigo_automacao = $${paramCount + 1} OR
        fnc_pro_codigo_referencia = $${paramCount + 1}
      )`;
      params.push(`%${filters.search}%`, filters.search, filters.search);
      paramCount += 3;
    }

    sql += ' ORDER BY fnc_pro_descricao';

    return query<FncProduto>(sql, params);
  }

  // Get produto by ID
  static async getById(id: string): Promise<FncProduto | null> {
    return queryOne<FncProduto>(
      'SELECT * FROM produtos WHERE fnc_pro_id = $1',
      [id]
    );
  }

  // Get produto by codigo_automacao
  static async getByCodigoAutomacao(codigo: string): Promise<FncProduto | null> {
    return queryOne<FncProduto>(
      'SELECT * FROM produtos WHERE fnc_pro_codigo_automacao = $1',
      [codigo]
    );
  }

  // Create new produto
  static async create(data: Partial<FncProduto>): Promise<FncProduto> {
    const fields: string[] = [];
    const placeholders: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(key);
        placeholders.push(`$${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    // Add timestamp
    fields.push('fnc_pro_dh_atualizacao');
    placeholders.push('NOW()');

    const result = await queryOne<FncProduto>(
      `INSERT INTO produtos (${fields.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );

    if (!result) {
      throw new Error('Failed to create produto');
    }

    return result;
  }

  // Update produto
  static async update(id: string, data: Partial<FncProduto>): Promise<FncProduto | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'fnc_pro_id') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return this.getById(id);
    }

    // Add timestamp update
    updates.push('fnc_pro_dh_atualizacao = NOW()');
    values.push(id);

    return queryOne<FncProduto>(
      `UPDATE produtos SET ${updates.join(', ')} WHERE fnc_pro_id = $${paramCount} RETURNING *`,
      values
    );
  }

  // Update stock
  static async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<void> {
    let sql: string;
    
    switch (operation) {
      case 'add':
        sql = 'UPDATE produtos SET fnc_pro_estoque_atual = COALESCE(fnc_pro_estoque_atual, 0) + $1 WHERE fnc_pro_id = $2';
        break;
      case 'subtract':
        sql = 'UPDATE produtos SET fnc_pro_estoque_atual = GREATEST(COALESCE(fnc_pro_estoque_atual, 0) - $1, 0) WHERE fnc_pro_id = $2';
        break;
      case 'set':
        sql = 'UPDATE produtos SET fnc_pro_estoque_atual = $1 WHERE fnc_pro_id = $2';
        break;
    }

    await query(sql, [quantity, id]);
  }

  // Get low stock products
  static async getLowStock(): Promise<FncProduto[]> {
    return query<FncProduto>(
      `SELECT * FROM produtos 
       WHERE fnc_pro_estoque_atual < fnc_pro_estoque_minimo 
       AND fnc_pro_status = 1
       ORDER BY (fnc_pro_estoque_atual::numeric / NULLIF(fnc_pro_estoque_minimo::numeric, 0)) ASC`
    );
  }

  // Get products by group
  static async getByGroup(grupo: string): Promise<FncProduto[]> {
    return query<FncProduto>(
      'SELECT * FROM produtos WHERE fnc_gpr_descricao = $1 ORDER BY fnc_pro_descricao',
      [grupo]
    );
  }

  // Get active products
  static async getActive(): Promise<FncProduto[]> {
    return this.getAll({ status: 1 });
  }

  // Delete produto
  static async delete(id: string): Promise<boolean> {
    // Soft delete by setting status to 0
    await query(
      'UPDATE produtos SET fnc_pro_status = 0, fnc_pro_dh_atualizacao = NOW() WHERE fnc_pro_id = $1',
      [id]
    );
    return true;
  }

  // Get product price list
  static async getPriceList(): Promise<Array<{
    fnc_pro_id: string;
    fnc_pro_descricao: string;
    fnc_pro_codigo_automacao: string;
    custo: number;
    preco_vista: number;
    preco_prazo: number;
    grupo: string;
    marca: string;
  }>> {
    return query(
      `SELECT 
        fnc_pro_id,
        fnc_pro_descricao,
        fnc_pro_codigo_automacao,
        fnc_pro_preco_de_custo_final as custo,
        fnc_pro_preco_a_vista as preco_vista,
        fnc_pro_preco_a_prazo as preco_prazo,
        fnc_gpr_descricao as grupo,
        fnc_mar_descricao as marca
       FROM produtos 
       WHERE fnc_pro_status = 1
       ORDER BY fnc_pro_descricao`
    );
  }
}