/**
 * Serviço de Log Seguro - SEMPRE funciona
 * Não deixa erros de log quebrar a aplicação
 */

import { query, queryOne } from '@/lib/db-wrapper';

export class SafeLogService {
  /**
   * Cria um log de forma segura
   * NUNCA falha - em caso de erro, apenas registra no console
   */
  static async log(data: {
    userId?: string;
    userName?: string;
    action: string;
    module: string;
    details?: unknown;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Tentar criar o log
      await this.createLogSafely(data);
    } catch (error) {
      // Se falhar, apenas registrar no console
      console.error('[SafeLog] Erro ao criar log (ignorado):', error);
      console.log('[SafeLog] Dados do log:', data);
    }
  }

  /**
   * Tenta criar o log no banco
   */
  private static async createLogSafely(data: {
    userId?: string;
    userName?: string;
    action: string;
    module: string;
    details?: unknown;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    // Primeiro, garantir que a tabela existe
    await this.ensureTableExists();
    
    // Inserir o log
    await query(`
      INSERT INTO user_logs (
        user_id, user_name, action, module, details, ip, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.userId || null,
      data.userName || null,
      data.action,
      data.module,
      JSON.stringify(data.details || {}),
      data.ip || null,
      data.userAgent || null
    ]);
  }

  /**
   * Garante que a tabela existe com a estrutura correta
   */
  private static async ensureTableExists(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS user_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        details JSONB DEFAULT '{}',
        module VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip VARCHAR(45),
        user_agent TEXT,
        session_id VARCHAR(255),
        screen_resolution VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  }

  /**
   * Busca logs de forma segura
   * Se falhar, retorna array vazio
   */
  static async getLogs(filters?: {
    userId?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    try {
      // Garantir que a tabela existe
      await this.ensureTableExists();
      
      let sql = `
        SELECT 
          id, user_id, user_name, action, module, details, 
          timestamp, ip, user_agent
        FROM user_logs
        WHERE 1=1
      `;
      
      const params: unknown[] = [];
      let paramCount = 0;
      
      if (filters?.userId) {
        sql += ` AND user_id = $${++paramCount}`;
        params.push(filters.userId);
      }
      
      if (filters?.module) {
        sql += ` AND module = $${++paramCount}`;
        params.push(filters.module);
      }
      
      if (filters?.startDate) {
        sql += ` AND timestamp >= $${++paramCount}`;
        params.push(filters.startDate);
      }
      
      if (filters?.endDate) {
        sql += ` AND timestamp <= $${++paramCount}`;
        params.push(filters.endDate);
      }
      
      sql += ' ORDER BY timestamp DESC';
      
      if (filters?.limit) {
        sql += ` LIMIT $${++paramCount}`;
        params.push(filters.limit);
      }
      
      if (filters?.offset) {
        sql += ` OFFSET $${++paramCount}`;
        params.push(filters.offset);
      }
      
      return await query(sql, params);
      
    } catch (error) {
      console.error('[SafeLog] Erro ao buscar logs:', error);
      return [];
    }
  }

  /**
   * Conta logs de forma segura
   */
  static async countLogs(filters?: {
    userId?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    try {
      await this.ensureTableExists();
      
      let sql = 'SELECT COUNT(*) as count FROM user_logs WHERE 1=1';
      const params: unknown[] = [];
      let paramCount = 0;
      
      if (filters?.userId) {
        sql += ` AND user_id = $${++paramCount}`;
        params.push(filters.userId);
      }
      
      if (filters?.module) {
        sql += ` AND module = $${++paramCount}`;
        params.push(filters.module);
      }
      
      if (filters?.startDate) {
        sql += ` AND timestamp >= $${++paramCount}`;
        params.push(filters.startDate);
      }
      
      if (filters?.endDate) {
        sql += ` AND timestamp <= $${++paramCount}`;
        params.push(filters.endDate);
      }
      
      const result = await queryOne<{ count: string }>(sql, params);
      return parseInt(result?.count || '0');
      
    } catch (error) {
      console.error('[SafeLog] Erro ao contar logs:', error);
      return 0;
    }
  }
}