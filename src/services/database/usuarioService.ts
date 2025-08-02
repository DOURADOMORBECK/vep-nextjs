import { pool } from '@/lib/db';

interface Usuario {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  role: string;
  department: string;
  ativo: boolean;
  data_criacao?: Date;
  data_atualizacao?: Date;
  ultimo_login?: Date;
  avatar?: string;
}

class UsuarioService {
  async getAllUsuarios(): Promise<Usuario[]> {
    try {
      // Por enquanto, vamos simular dados baseados nos operadores
      // Em produção, você teria uma tabela específica para usuários
      const query = `
        SELECT 
          id,
          nome,
          email,
          telefone,
          'operator' as role,
          'Operações' as department,
          ativo,
          data_criacao,
          data_atualizacao
        FROM operadores_financesweb
        ORDER BY nome
      `;
      
      const result = await pool().query(query);
      return result.rows.map(row => ({
        ...row,
        cpf: '', // Não disponível
        ultimo_login: undefined,
        avatar: undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  async getUsuarioById(id: number): Promise<Usuario | null> {
    try {
      const query = `
        SELECT 
          id,
          nome,
          email,
          telefone,
          'operator' as role,
          'Operações' as department,
          ativo,
          data_criacao,
          data_atualizacao
        FROM operadores_financesweb
        WHERE id = $1
      `;
      
      const result = await pool().query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        ...result.rows[0],
        cpf: '',
        ultimo_login: undefined,
        avatar: undefined
      };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  async createUsuario(userData: Omit<Usuario, 'id' | 'data_criacao' | 'data_atualizacao'>): Promise<Usuario> {
    try {
      // Simular criação inserindo na tabela de operadores
      const query = `
        INSERT INTO operadores_financesweb (
          nome,
          email,
          telefone,
          ativo,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING 
          id,
          nome,
          email,
          telefone,
          ativo,
          created_at as data_criacao,
          updated_at as data_atualizacao
      `;
      
      const values = [
        userData.nome,
        userData.email,
        userData.telefone,
        userData.ativo
      ];
      
      const result = await pool().query(query, values);
      
      return {
        ...result.rows[0],
        role: userData.role,
        department: userData.department,
        cpf: userData.cpf || '',
        ultimo_login: undefined,
        avatar: undefined
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async updateUsuario(id: number, userData: Partial<Usuario>): Promise<Usuario | null> {
    try {
      const setParts: string[] = [];
      const values: (string | boolean)[] = [];
      let paramCount = 1;

      if (userData.nome !== undefined) {
        setParts.push(`nome = $${paramCount}`);
        values.push(userData.nome);
        paramCount++;
      }
      if (userData.email !== undefined) {
        setParts.push(`email = $${paramCount}`);
        values.push(userData.email);
        paramCount++;
      }
      if (userData.telefone !== undefined) {
        setParts.push(`telefone = $${paramCount}`);
        values.push(userData.telefone);
        paramCount++;
      }
      if (userData.ativo !== undefined) {
        setParts.push(`ativo = $${paramCount}`);
        values.push(userData.ativo);
        paramCount++;
      }
      
      if (setParts.length === 0) {
        return await this.getUsuarioById(id);
      }
      
      setParts.push(`updated_at = NOW()`);
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
          created_at as data_criacao,
          updated_at as data_atualizacao
      `;
      
      const result = await pool().query(updateQuery, values);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return {
        ...result.rows[0],
        role: userData.role || 'operator',
        department: userData.department || 'Operações',
        cpf: userData.cpf || '',
        ultimo_login: undefined,
        avatar: undefined
      };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return null;
    }
  }

  async deleteUsuario(id: number): Promise<boolean> {
    try {
      // Soft delete - marca como inativo
      const query = `
        UPDATE operadores_financesweb 
        SET ativo = false, updated_at = NOW()
        WHERE id = $1
      `;
      
      const result = await pool().query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return false;
    }
  }

  async getActiveUsuariosCount(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM operadores_financesweb
        WHERE ativo = true
      `;
      
      const result = await pool().query(query);
      return parseInt(result.rows[0]?.total || '0');
    } catch (error) {
      console.error('Erro ao contar usuários ativos:', error);
      return 0;
    }
  }
}

export const usuarioService = new UsuarioService();