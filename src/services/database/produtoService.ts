import { query, queryOne } from '@/lib/db-wrapper';
import { ProdutoFinancesweb } from './financesweb/produtoFinanceswebService';

export interface Produto {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
  barcode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProdutoService {
  // Converte produto do FinancesWeb para formato da aplicação
  private static mapFinanceswebToProduct(produto: ProdutoFinancesweb): Produto {
    return {
      id: produto.fnc_pro_id.toString(),
      code: produto.fnc_pro_codigo || '',
      name: produto.fnc_pro_descricao || '',
      description: produto.fnc_pro_descricao_nf || produto.fnc_pro_descricao || '',
      category: produto.fnc_gpr_descricao || 'Outros',
      unit: produto.fnc_pro_unidade_medida || 'UN',
      price: produto.fnc_pro_preco_venda || 0,
      stock: produto.fnc_pro_estoque_atual || 0,
      minStock: produto.fnc_pro_estoque_minimo || 0,
      supplier: produto.fnc_mar_descricao || '',
      barcode: produto.fnc_pro_codigo_barras || '',
      active: produto.fnc_pro_status === '1',
      createdAt: produto.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: produto.updated_at?.toISOString() || new Date().toISOString()
    };
  }

  static async getAll(): Promise<Produto[]> {
    try {
      // Buscar produtos do FinancesWeb (fonte principal de dados)
      const result = await query<ProdutoFinancesweb>(
        'SELECT * FROM produtos_financesweb ORDER BY fnc_pro_descricao'
      );
      
      return result.map(this.mapFinanceswebToProduct);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Produto | null> {
    try {
      const result = await queryOne<ProdutoFinancesweb>(
        'SELECT * FROM produtos_financesweb WHERE fnc_pro_id = $1',
        [parseInt(id)]
      );
      
      if (!result) return null;
      return this.mapFinanceswebToProduct(result);
    } catch (error) {
      console.error('Error fetching product by id:', error);
      return null;
    }
  }

  static async search(searchTerm: string): Promise<Produto[]> {
    try {
      const result = await query<ProdutoFinancesweb>(
        `SELECT * FROM produtos_financesweb 
         WHERE fnc_pro_descricao ILIKE $1 
            OR fnc_pro_codigo ILIKE $1 
            OR fnc_pro_codigo_barras ILIKE $1
         ORDER BY fnc_pro_descricao
         LIMIT 50`,
        [`%${searchTerm}%`]
      );
      
      return result.map(this.mapFinanceswebToProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  static async getByCategory(category: string): Promise<Produto[]> {
    try {
      const result = await query<ProdutoFinancesweb>(
        'SELECT * FROM produtos_financesweb WHERE fnc_gpr_descricao = $1 ORDER BY fnc_pro_descricao',
        [category]
      );
      
      return result.map(this.mapFinanceswebToProduct);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      const result = await query<{ fnc_gpr_descricao: string }>(
        'SELECT DISTINCT fnc_gpr_descricao FROM produtos_financesweb WHERE fnc_gpr_descricao IS NOT NULL ORDER BY fnc_gpr_descricao'
      );
      
      return result.map(row => row.fnc_gpr_descricao);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  static async update(id: string, data: Partial<Produto>): Promise<Produto | null> {
    try {
      const product = await this.getById(id);
      if (!product) return null;
      
      // Log da tentativa de atualização para auditoria
      console.log(`Tentativa de atualização do produto ${id}:`, {
        produto: product.name,
        alteracoes: data,
        timestamp: new Date().toISOString()
      });
      
      // Retorna o produto atual (sem alterações na base do FinancesWeb)
      // Para implementar alterações reais, seria necessário API do FinancesWeb
      return product;
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  }

  static async getStats(): Promise<{
    total: number;
    active: number;
    lowStock: number;
    categories: number;
  }> {
    try {
      const totalResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM produtos_financesweb'
      );
      
      const activeResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM produtos_financesweb WHERE fnc_pro_status = $1',
        ['1']
      );
      
      const lowStockResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM produtos_financesweb WHERE fnc_pro_estoque_atual <= fnc_pro_estoque_minimo'
      );
      
      const categoriesResult = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT fnc_gpr_descricao) as count FROM produtos_financesweb WHERE fnc_gpr_descricao IS NOT NULL'
      );
      
      return {
        total: parseInt(totalResult?.count || '0'),
        active: parseInt(activeResult?.count || '0'),
        lowStock: parseInt(lowStockResult?.count || '0'),
        categories: parseInt(categoriesResult?.count || '0')
      };
    } catch (error) {
      console.error('Error fetching product stats:', error);
      return { total: 0, active: 0, lowStock: 0, categories: 0 };
    }
  }

  // Adicionar método para obter todos os produtos
  static async getAllProdutos(): Promise<Produto[]> {
    return this.getAll();
  }
}

export const produtoService = new ProdutoService();