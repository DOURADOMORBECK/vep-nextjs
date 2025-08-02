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