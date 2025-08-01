import { query, queryOne } from '@/lib/db';

export interface DashboardStats {
  orders: number;
  operators: number;
  products: number;
  vehicles: number;
  customers: number;
  recentDeliveries: number;
  recentAuditLogs: number;
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    // Get counts from various tables
    const ordersResult = await queryOne<{ total: string }>(
      'SELECT COUNT(*) AS total FROM pedidos_venda_produtos'
    );
    
    const operatorsResult = await queryOne<{ total: string }>(
      'SELECT COUNT(*) AS total FROM users'
    );
    
    const productsResult = await queryOne<{ total: string }>(
      'SELECT COUNT(*) AS total FROM produtos'
    );
    
    const vehiclesResult = await queryOne<{ total: string }>(
      'SELECT COUNT(DISTINCT id_tracked_unit) AS total FROM ssx_positions'
    );
    
    const customersResult = await queryOne<{ total: string }>(
      'SELECT COUNT(*) AS total FROM pessoas'
    );

    // Try to get recent deliveries (table might not exist)
    let recentDeliveries = 0;
    try {
      const deliveryResult = await queryOne<{ total: string }>(
        'SELECT COUNT(*) AS total FROM delivery_routes WHERE created_at > NOW() - INTERVAL \'24 hours\''
      );
      recentDeliveries = parseInt(deliveryResult?.total || '0');
    } catch (e) {
      // Table doesn't exist, continue
    }

    // Try to get recent audit logs (table might not exist)
    let recentAuditLogs = 0;
    try {
      const auditResult = await queryOne<{ total: string }>(
        'SELECT COUNT(*) AS total FROM audit_logs WHERE timestamp > NOW() - INTERVAL \'24 hours\''
      );
      recentAuditLogs = parseInt(auditResult?.total || '0');
    } catch (e) {
      // Table doesn't exist, continue
    }

    return {
      orders: parseInt(ordersResult?.total || '0'),
      operators: parseInt(operatorsResult?.total || '0'),
      products: parseInt(productsResult?.total || '0'),
      vehicles: parseInt(vehiclesResult?.total || '0'),
      customers: parseInt(customersResult?.total || '0'),
      recentDeliveries,
      recentAuditLogs,
    };
  }

  static async getOrdersByStatus(): Promise<any[]> {
    return query(
      'SELECT status, COUNT(*) as count FROM pedidos_venda_produtos GROUP BY status'
    );
  }

  static async getRecentActivity(): Promise<any[]> {
    // This would typically join multiple tables to get recent activity
    // For now, returning a simple query
    try {
      return query(
        `SELECT 'order' as type, fnc_pve_id as id, fnc_pve_data_emissao as date, 
         fnc_pes_nome_fantasia as description
         FROM pedidos_venda_produtos 
         WHERE fnc_pve_data_emissao > NOW() - INTERVAL '7 days'
         ORDER BY fnc_pve_data_emissao DESC
         LIMIT 10`
      );
    } catch (e) {
      return [];
    }
  }

  static async getDeliveryMetrics(): Promise<any> {
    try {
      const metrics = await queryOne(
        `SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
         FROM delivery_routes
         WHERE created_at > NOW() - INTERVAL '30 days'`
      );
      return metrics || { completed: 0, in_progress: 0, pending: 0 };
    } catch (e) {
      return { completed: 0, in_progress: 0, pending: 0 };
    }
  }

  static async getTopProducts(): Promise<any[]> {
    try {
      return query(
        `SELECT 
          fnc_pro_descricao as product_name,
          SUM(fnc_pvp_quantidade) as total_quantity,
          COUNT(*) as order_count
         FROM pedidos_venda_produtos
         WHERE fnc_pve_data_emissao > NOW() - INTERVAL '30 days'
         GROUP BY fnc_pro_descricao
         ORDER BY total_quantity DESC
         LIMIT 5`
      );
    } catch (e) {
      return [];
    }
  }
}