export interface DashboardStats {
  orders: number;
  operators: number;
  products: number;
  vehicles: number;
  customers: number;
  recentDeliveries: number;
  recentAuditLogs: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface DashboardRecentActivity {
  orders: Array<{
    date: string;
    count: number;
  }>;
  deliveries: Array<{
    date: string;
    count: number;
  }>;
  auditLogs: Array<{
    date: string;
    count: number;
  }>;
}

export interface TopProduct {
  id_produto: number;
  nome_produto: string;
  total_quantidade: number;
  total_vendas: number;
}

export interface TopCustomer {
  id_pessoa: number;
  nome_pessoa: string;
  total_pedidos: number;
  total_valor: number;
}

export interface DashboardAlert {
  type: 'low_stock' | 'pending_orders' | 'delivery_delays' | 'system';
  severity: 'info' | 'warning' | 'error';
  message: string;
  count?: number;
  details?: Record<string, unknown>;
}