export interface VehiclePosition {
  id_tracked_unit: string;
  lat: string;
  long: string;
  speed: string;
  heading: string;
  altitude: string;
  valid_gps: string;
  ignition: string;
  event_date: string;
  update_date: string;
}

export interface VehicleStats {
  total: number;
  last: string | null;
  active: number;
  withValidGPS: number;
}

export interface VehicleFilters {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  minLat?: string;
  maxLat?: string;
  minLong?: string;
  maxLong?: string;
}

export interface CreateVehicleData {
  id_tracked_unit: string;
  lat?: string;
  long?: string;
  speed?: string;
  heading?: string;
  altitude?: string;
  valid_gps?: string;
  ignition?: string;
  event_date?: string;
  update_date?: string;
}

export interface UpdatePositionData {
  lat: string;
  long: string;
  speed?: string;
  heading?: string;
  altitude?: string;
  valid_gps?: string;
  ignition?: string;
  event_date?: string;
}

export interface VehicleHistoryFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}