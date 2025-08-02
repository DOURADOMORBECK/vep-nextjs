import { query, queryOne } from '@/lib/db-wrapper';

export interface UserLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  details: Record<string, unknown>;
  module: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  screenResolution?: string;
}

export interface UserLogFilters {
  userId?: string;
  action?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class UserLogService {
  // Criar a tabela de logs se não existir
  static async initializeTable(): Promise<void> {
    try {
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
        );
      `);

      // Criar índices para melhor performance
      await query(`
        CREATE INDEX IF NOT EXISTS idx_user_logs_timestamp ON user_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_logs_module ON user_logs(module);
        CREATE INDEX IF NOT EXISTS idx_user_logs_action ON user_logs(action);
      `);
    } catch (error) {
      console.error('Error initializing user logs table:', error);
      throw error;
    }
  }

  // Criar um novo log
  static async create(logData: Omit<UserLog, 'id' | 'timestamp'>): Promise<UserLog> {
    try {
      const result = await queryOne<{
        id: number;
        user_id: string;
        user_name: string | null;
        action: string;
        details: Record<string, unknown>;
        module: string;
        timestamp: Date;
        ip: string | null;
        user_agent: string | null;
        session_id: string | null;
        screen_resolution: string | null;
      }>(
        `INSERT INTO user_logs (
          user_id, user_name, action, details, module, ip, user_agent, session_id, screen_resolution
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          logData.userId || 'anonymous',
          logData.userName || null,
          logData.action,
          JSON.stringify(logData.details),
          logData.module,
          logData.ip || null,
          logData.userAgent || null,
          logData.sessionId || null,
          logData.screenResolution || null
        ]
      );

      if (!result) {
        throw new Error('Failed to create user log');
      }

      return {
        id: result.id.toString(),
        userId: result.user_id,
        userName: result.user_name || undefined,
        action: result.action,
        details: result.details,
        module: result.module,
        timestamp: result.timestamp.toISOString(),
        ip: result.ip || undefined,
        userAgent: result.user_agent || undefined,
        sessionId: result.session_id || undefined,
        screenResolution: result.screen_resolution || undefined
      };
    } catch (error) {
      console.error('Error creating user log:', error);
      throw error;
    }
  }

  // Buscar logs com filtros
  static async getAll(filters: UserLogFilters = {}): Promise<{
    logs: UserLog[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        userId,
        action,
        module,
        startDate,
        endDate,
        search,
        limit = 50,
        offset = 0
      } = filters;

      const whereConditions: string[] = [];
      const values: (string | number)[] = [];
      let paramCount = 0;

      // Filtros
      if (userId) {
        paramCount++;
        whereConditions.push(`user_id = $${paramCount}`);
        values.push(userId);
      }

      if (action) {
        paramCount++;
        whereConditions.push(`action = $${paramCount}`);
        values.push(action);
      }

      if (module) {
        paramCount++;
        whereConditions.push(`module = $${paramCount}`);
        values.push(module);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`timestamp >= $${paramCount}`);
        values.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`timestamp <= $${paramCount}`);
        values.push(endDate);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`(
          user_name ILIKE $${paramCount} OR
          action ILIKE $${paramCount} OR
          module ILIKE $${paramCount} OR
          user_id ILIKE $${paramCount}
        )`);
        values.push(`%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Query principal
      paramCount++;
      const limitParam = paramCount;
      paramCount++;
      const offsetParam = paramCount;
      values.push(limit, offset);

      const logsQuery = `
        SELECT *
        FROM user_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;

      const logs = await query<{
        id: number;
        user_id: string;
        user_name: string | null;
        action: string;
        details: Record<string, unknown>;
        module: string;
        timestamp: Date;
        ip: string | null;
        user_agent: string | null;
        session_id: string | null;
        screen_resolution: string | null;
      }>(logsQuery, values);

      // Query para total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_logs
        ${whereClause}
      `;
      
      const countValues = values.slice(0, -2); // Remove limit e offset
      const countResult = await queryOne<{ total: string }>(countQuery, countValues);
      const total = parseInt(countResult?.total || '0');

      // Mapear resultados
      const mappedLogs: UserLog[] = logs.map(log => ({
        id: log.id.toString(),
        userId: log.user_id,
        userName: log.user_name || undefined,
        action: log.action,
        details: log.details,
        module: log.module,
        timestamp: log.timestamp.toISOString(),
        ip: log.ip || undefined,
        userAgent: log.user_agent || undefined,
        sessionId: log.session_id || undefined,
        screenResolution: log.screen_resolution || undefined
      }));

      return {
        logs: mappedLogs,
        total,
        hasMore: (offset + limit) < total
      };
    } catch (error) {
      console.error('Error fetching user logs:', error);
      return { logs: [], total: 0, hasMore: false };
    }
  }

  // Buscar logs por ID do usuário
  static async getByUserId(userId: string, limit: number = 20): Promise<UserLog[]> {
    const result = await this.getAll({ userId, limit });
    return result.logs;
  }

  // Buscar logs por módulo
  static async getByModule(module: string, limit: number = 20): Promise<UserLog[]> {
    const result = await this.getAll({ module, limit });
    return result.logs;
  }

  // Obter estatísticas de logs
  static async getStats(): Promise<{
    totalLogs: number;
    logsToday: number;
    uniqueUsers: number;
    topModules: Array<{ module: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      // Total de logs
      const totalResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM user_logs'
      );

      // Logs de hoje
      const todayResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM user_logs WHERE DATE(timestamp) = CURRENT_DATE'
      );

      // Usuários únicos
      const uniqueUsersResult = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT user_id) as count FROM user_logs'
      );

      // Top módulos
      const topModules = await query<{ module: string; count: string }>(
        `SELECT module, COUNT(*) as count 
         FROM user_logs 
         GROUP BY module 
         ORDER BY count DESC 
         LIMIT 5`
      );

      // Top ações
      const topActions = await query<{ action: string; count: string }>(
        `SELECT action, COUNT(*) as count 
         FROM user_logs 
         GROUP BY action 
         ORDER BY count DESC 
         LIMIT 5`
      );

      return {
        totalLogs: parseInt(totalResult?.count || '0'),
        logsToday: parseInt(todayResult?.count || '0'),
        uniqueUsers: parseInt(uniqueUsersResult?.count || '0'),
        topModules: topModules.map(m => ({ module: m.module, count: parseInt(m.count) })),
        topActions: topActions.map(a => ({ action: a.action, count: parseInt(a.count) }))
      };
    } catch (error) {
      console.error('Error fetching log stats:', error);
      return {
        totalLogs: 0,
        logsToday: 0,
        uniqueUsers: 0,
        topModules: [],
        topActions: []
      };
    }
  }

  // Limpar logs antigos (manter apenas últimos X dias)
  static async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const result = await queryOne<{ count: string }>(
        'DELETE FROM user_logs WHERE timestamp < NOW() - INTERVAL $1 DAY RETURNING COUNT(*)',
        [daysToKeep]
      );

      return parseInt(result?.count || '0');
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      return 0;
    }
  }
}

export { UserLogService };