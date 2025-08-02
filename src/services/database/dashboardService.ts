import { query, queryOne } from '@/lib/db-wrapper';

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
    try {
      // Get counts from various tables with error handling
      const [ordersResult, operatorsResult, productsResult, vehiclesResult, customersResult] = await Promise.all([
        queryOne<{ total: string }>(
          'SELECT COUNT(*) AS total FROM pedidos_venda_produtos'
        ).catch(() => ({ total: '0' })),
        
        queryOne<{ total: string }>(
          'SELECT COUNT(*) AS total FROM operadores_financesweb'
        ).catch(() => ({ total: '0' })),
        
        queryOne<{ total: string }>(
          'SELECT COUNT(*) AS total FROM produtos_financesweb'
        ).catch(() => ({ total: '0' })),
        
        queryOne<{ total: string }>(
          'SELECT COUNT(DISTINCT id_tracked_unit) AS total FROM ssx_positions'
        ).catch(() => ({ total: '0' })),
        
        queryOne<{ total: string }>(
          'SELECT COUNT(*) AS total FROM pessoas_financesweb'
        ).catch(() => ({ total: '0' }))
      ]);

    // Try to get recent deliveries (table might not exist)
    let recentDeliveries = 0;
    try {
      const deliveryResult = await queryOne<{ total: string }>(
        'SELECT COUNT(*) AS total FROM delivery_routes WHERE created_at > NOW() - INTERVAL \'24 hours\''
      );
      recentDeliveries = parseInt(deliveryResult?.total || '0');
    } catch {
      // Table doesn't exist, continue
    }

    // Try to get recent audit logs (table might not exist)
    let recentAuditLogs = 0;
    try {
      const auditResult = await queryOne<{ total: string }>(
        'SELECT COUNT(*) AS total FROM audit_logs WHERE timestamp > NOW() - INTERVAL \'24 hours\''
      );
      recentAuditLogs = parseInt(auditResult?.total || '0');
    } catch {
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
    } catch (error) {
      console.error('[DashboardService] Error fetching stats:', error);
      // Return safe defaults if database connection fails
      return {
        orders: 0,
        operators: 0,
        products: 0,
        vehicles: 0,
        customers: 0,
        recentDeliveries: 0,
        recentAuditLogs: 0,
      };
    }
  }

  static async getOrdersByStatus(): Promise<Array<{ status: string; count: string }>> {
    try {
      return await query(
        'SELECT fnc_pve_situacao as status, COUNT(*) as count FROM pedidos_venda_produtos GROUP BY fnc_pve_situacao'
      );
    } catch (error) {
      console.error('[DashboardService] Error fetching orders by status:', error);
      return [];
    }
  }

  static async getRecentActivity(): Promise<Array<{ type: string; id: string; date: Date; description: string }>> {
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
    } catch {
      return [];
    }
  }

  static async getDeliveryMetrics(): Promise<{ completed: number; in_progress: number; pending: number }> {
    try {
      const metrics = await queryOne<{ completed: string; in_progress: string; pending: string }>(
        `SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
         FROM delivery_routes
         WHERE created_at > NOW() - INTERVAL '30 days'`
      );
      return { 
        completed: parseInt(metrics?.completed || '0'),
        in_progress: parseInt(metrics?.in_progress || '0'),
        pending: parseInt(metrics?.pending || '0')
      };
    } catch (error) {
      console.error('[DashboardService] Error fetching delivery metrics:', error);
      return { completed: 0, in_progress: 0, pending: 0 };
    }
  }

  static async getTopProducts(): Promise<Array<{ product_name: string; total_quantity: string; order_count: string }>> {
    try {
      return await query(
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
    } catch (error) {
      console.error('[DashboardService] Error fetching top products:', error);
      return [];
    }
  }
}