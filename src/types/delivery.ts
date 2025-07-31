export interface DeliveryRoute {
  id: number;
  route_code: string;
  driver_id?: number;
  driver_name?: string;
  vehicle_id?: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  total_points: number;
  completed_points: number;
  start_time?: string;
  end_time?: string;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPoint {
  id: number;
  route_id: number;
  sequence: number;
  customer_id?: number;
  customer_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  status: 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'FALHA';
  arrival_time?: string;
  departure_time?: string;
  signature_url?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
}

export interface DeliveryStats {
  totalRoutes: number;
  totalPoints: number;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  pointsByStatus: Array<{
    status: string;
    count: number;
  }>;
  recent: number;
  activeRoutes: number;
  todayDeliveries: number;
}

export interface DriverStats {
  totalRoutes: number;
  completedRoutes: number;
  totalDeliveries: number;
  todayDeliveries: number;
  avgDeliveryTimeMinutes: number;
}

export interface CreateDeliveryRouteData {
  route_code: string;
  driver_id?: number;
  driver_name?: string;
  vehicle_id?: string;
  status?: string;
  total_points?: number;
  distance_km?: number;
}

export interface UpdateDeliveryRouteData {
  driver_id?: number;
  driver_name?: string;
  vehicle_id?: string;
  status?: string;
  total_points?: number;
  completed_points?: number;
  start_time?: string;
  end_time?: string;
  distance_km?: number;
}

export interface CreateDeliveryPointData {
  sequence?: number;
  customer_id?: number;
  customer_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  status?: string;
  notes?: string;
}

export interface UpdateDeliveryPointData {
  sequence?: number;
  customer_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  status?: string;
  arrival_time?: string;
  departure_time?: string;
  signature_url?: string;
  photo_url?: string;
  notes?: string;
}

export interface MarkDeliveredData {
  signature_url?: string;
  photo_url?: string;
  notes?: string;
}