// Product Types
export interface Product {
  id: number;
  nome: string;
  descricao?: string;
  preco?: number;
  estoque?: number;
  created_at: string;
}

export interface CreateProductData {
  nome: string;
  descricao?: string;
  preco?: number;
  estoque?: number;
}

export interface UpdateProductData {
  nome?: string;
  descricao?: string;
  preco?: number;
  estoque?: number;
}

// Jornada Produto Types
export interface JornadaProdutoOrder {
  id_pedido: number;
  status: string;
  data_pedido: string;
  data_atualizacao?: string;
  // Add other fields based on your actual table structure
}

export interface JornadaProdutoItem {
  id_item: number;
  id_pedido: number;
  sequencia: number;
  status: string;
  data_criacao: string;
  data_atualizacao?: string;
  // Add other fields based on your actual table structure
}

export interface JornadaProdutoStats {
  totalOrders: number;
  totalItems: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  itemsByStatus: Array<{
    status: string;
    count: number;
  }>;
}