import { pool } from '@/lib/db';

interface Operador {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  data_criacao?: Date;
  data_atualizacao?: Date;
}

interface OperadorCreateData {
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

class OperadorService {
  async getAllOperadores(): Promise<Operador[]> {
    try {
      const query = `
        SELECT 
          id,
          nome,
          email,
          telefone,
          ativo,
          data_criacao,
          data_atualizacao
        FROM operadores_financesweb
        ORDER BY nome
      `;
      
      const result = await pool().query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
      return [];
    }
  }

  async getOperadorById(id: number): Promise<Operador | null> {
    try {
      const query = `
        SELECT 
          id,
          nome,
          email,
          telefone,
          ativo,
          data_criacao,
          data_atualizacao
        FROM operadores_financesweb
        WHERE id = $1
      `;
      
      const result = await pool().query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar operador:', error);
      return null;
    }
  }

  async createOperador(data: OperadorCreateData): Promise<Operador> {
    try {
      const query = `
        INSERT INTO operadores_financesweb (
          nome,
          email,
          telefone,
          ativo,
          data_criacao,
          data_atualizacao
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING 
          id,
          nome,
          email,
          telefone,
          ativo,
          data_criacao,
          data_atualizacao
      `;
      
      const values = [
        data.nome,
        data.email || null,
        data.telefone || null,
        data.ativo
      ];
      
      const result = await pool().query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar operador:', error);
      throw error;
    }
  }

  async updateOperador(id: number, data: Partial<OperadorCreateData>): Promise<Operador | null> {
    try {
      const setParts: string[] = [];
      const values: (string | boolean | null)[] = [];
      let paramCount = 1;

      if (data.nome !== undefined) {
        setParts.push(`nome = $${paramCount}`);
        values.push(data.nome);
        paramCount++;
      }
      if (data.email !== undefined) {
        setParts.push(`email = $${paramCount}`);
        values.push(data.email || null);
        paramCount++;
      }
      if (data.telefone !== undefined) {
        setParts.push(`telefone = $${paramCount}`);
        values.push(data.telefone || null);
        paramCount++;
      }
      if (data.ativo !== undefined) {
        setParts.push(`ativo = $${paramCount}`);
        values.push(data.ativo);
        paramCount++;
      }
      
      if (setParts.length === 0) {
        return await this.getOperadorById(id);
      }
      
      setParts.push(`data_atualizacao = NOW()`);
      values.push(id);
      
      const updateQuery = `
        UPDATE operadores_financesweb 
        SET ${setParts.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          nome,
          email,
          telefone,
          ativo,
          data_criacao,
          data_atualizacao
      `;
      
      const result = await pool().query(updateQuery, values);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar operador:', error);
      return null;
    }
  }

  async deleteOperador(id: number): Promise<boolean> {
    try {
      // Soft delete - marca como inativo
      const query = `
        UPDATE operadores_financesweb 
        SET ativo = false, data_atualizacao = NOW()
        WHERE id = $1
      `;
      
      const result = await pool().query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao excluir operador:', error);
      return false;
    }
  }

  async getActiveOperadoresCount(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM operadores_financesweb
        WHERE ativo = true
      `;
      
      const result = await pool().query(query);
      return parseInt(result.rows[0]?.total || '0');
    } catch (error) {
      console.error('Erro ao contar operadores ativos:', error);
      return 0;
    }
  }
}

export const operadorService = new OperadorService();