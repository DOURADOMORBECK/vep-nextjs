export interface UserLog {
  id: number;
  user_id: string;
  action: string;
  module: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface UserLogStats {
  total: number;
  recent24h: number;
  byAction: Array<{
    action: string;
    count: number;
  }>;
  byModule: Array<{
    module: string;
    count: number;
  }>;
  topUsers: Array<{
    user_id: string;
    count: number;
  }>;
}

export interface CreateUserLogData {
  action: string;
  module?: string;
  details?: any;
  userId?: string;
  timestamp?: string;
}

export interface UserLogFilters {
  userId?: string;
  action?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}