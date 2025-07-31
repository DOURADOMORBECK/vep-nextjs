export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}