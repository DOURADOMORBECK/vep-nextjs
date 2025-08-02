import { query, queryOne } from '@/lib/db-wrapper';

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

// Interface para mapear os dados reais do PostgreSQL
interface ProdutoPostgres {
  fnc_pro_id: bigint;
  fnc_pro_descricao?: string;
  fnc_pro_codigo_automacao?: string;
  fnc_pro_codigo_referencia?: string;
  fnc_uni_codigo?: string;
  fnc_gpr_descricao?: string;
  fnc_dep_descricao?: string;
  fnc_mar_descricao?: string;
  fnc_pro_tipo_cadastro?: string;
  fnc_pro_status?: string;
  fnc_pro_preco_a_vista?: number;
  fnc_pro_preco_a_prazo?: number;
  fnc_pro_estoque_atual?: number;
  fnc_pro_estoque_minimo?: number;
  fnc_pro_estoque_maximo?: number;
  fnc_pro_codigo_gtin?: string;
  fnc_pro_dh_atualizacao?: Date;
  sync_date?: Date;
}

export class ProdutoService {
  // Converte produto do PostgreSQL real para formato da aplicação
  private static mapPostgresToProduct(produto: ProdutoPostgres): Produto {
    return {
      id: produto.fnc_pro_id.toString(),
      code: produto.fnc_pro_codigo_automacao || produto.fnc_pro_codigo_referencia || '',
      name: produto.fnc_pro_descricao || '',
      description: produto.fnc_pro_descricao || '',
      category: produto.fnc_gpr_descricao || 'Outros',
      unit: produto.fnc_uni_codigo || 'UN',
      price: produto.fnc_pro_preco_a_vista || 0,
      stock: produto.fnc_pro_estoque_atual || 0,
      minStock: produto.fnc_pro_estoque_minimo || 0,
      supplier: produto.fnc_mar_descricao || '',
      barcode: produto.fnc_pro_codigo_gtin || '',
      active: produto.fnc_pro_status === 'Ativo' || produto.fnc_pro_status === '1',
      createdAt: produto.fnc_pro_dh_atualizacao?.toISOString() || new Date().toISOString(),
      updatedAt: produto.sync_date?.toISOString() || new Date().toISOString()
    };
  }

  static async getAll(): Promise<Produto[]> {
    try {
      // Buscar produtos direto da tabela real do PostgreSQL
      const result = await query<ProdutoPostgres>(
        'SELECT * FROM fnc_produtos_e_servicos ORDER BY fnc_pro_descricao'
      );
      
      return result.map(this.mapPostgresToProduct);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Produto | null> {
    try {
      const result = await queryOne<ProdutoPostgres>(
        'SELECT * FROM fnc_produtos_e_servicos WHERE fnc_pro_id = $1',
        [parseInt(id)]
      );
      
      if (!result) return null;
      return this.mapPostgresToProduct(result);
    } catch (error) {
      console.error('Error fetching product by id:', error);
      return null;
    }
  }

  static async search(searchTerm: string): Promise<Produto[]> {
    try {
      const result = await query<ProdutoPostgres>(
        `SELECT * FROM fnc_produtos_e_servicos 
         WHERE fnc_pro_descricao ILIKE $1 
            OR fnc_pro_codigo_automacao ILIKE $1 
            OR fnc_pro_codigo_referencia ILIKE $1
            OR fnc_pro_codigo_gtin ILIKE $1
         ORDER BY fnc_pro_descricao
         LIMIT 50`,
        [`%${searchTerm}%`]
      );
      
      return result.map(this.mapPostgresToProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  static async getByCategory(category: string): Promise<Produto[]> {
    try {
      const result = await query<ProdutoPostgres>(
        'SELECT * FROM fnc_produtos_e_servicos WHERE fnc_gpr_descricao = $1 ORDER BY fnc_pro_descricao',
        [category]
      );
      
      return result.map(this.mapPostgresToProduct);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      const result = await query<{ fnc_gpr_descricao: string }>(
        'SELECT DISTINCT fnc_gpr_descricao FROM fnc_produtos_e_servicos WHERE fnc_gpr_descricao IS NOT NULL ORDER BY fnc_gpr_descricao'
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
      
      // Por enquanto, apenas retorna o produto sem alterações
      // Implementar UPDATE quando necessário
      console.log(`Atualização do produto ${id} solicitada:`, {
        produto: product.name,
        alteracoes: data,
        timestamp: new Date().toISOString()
      });
      
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
        'SELECT COUNT(*) as count FROM fnc_produtos_e_servicos'
      );
      
      const activeResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM fnc_produtos_e_servicos WHERE fnc_pro_status = $1',
        ['Ativo']
      );
      
      const lowStockResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM fnc_produtos_e_servicos WHERE fnc_pro_estoque_atual <= fnc_pro_estoque_minimo'
      );
      
      const categoriesResult = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT fnc_gpr_descricao) as count FROM fnc_produtos_e_servicos WHERE fnc_gpr_descricao IS NOT NULL'
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