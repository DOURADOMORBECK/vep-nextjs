import { NextRequest, NextResponse } from 'next/server';
import { railwayApi } from '@/lib/api-interceptor';
import { z } from 'zod';

interface SearchResult {
  id: string;
  name: string;
  type: 'customer' | 'order' | 'product' | 'supplier';
  [key: string]: unknown;
}

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  types: z.string().optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).optional()
});

/**
 * Unified Search API - Aggregates search across multiple entities
 * Based on the Aggregation API proposal for improved performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      q: searchParams.get('q') || '',
      types: searchParams.get('types') || '',
      limit: searchParams.get('limit') || '10'
    };

    // Validate input
    const { q, types, limit } = searchSchema.parse(params);
    const searchTypes = types ? types.split(',') : ['customers', 'orders', 'products'];
    
    const results = {
      customers: [] as SearchResult[],
      orders: [] as SearchResult[],
      products: [] as SearchResult[],
      suppliers: [] as SearchResult[]
    };

    // Search customers if requested
    if (searchTypes.includes('customers')) {
      try {
        const response = await railwayApi.getClients();
        if (response.ok) {
          const customerData = await response.json();
          results.customers = Array.isArray(customerData) 
            ? customerData.filter((customer: Record<string, unknown>) => 
                String(customer.fnc_pes_nome_fantasia).toLowerCase().includes(q.toLowerCase()) ||
                String(customer.fnc_pes_cpf || customer.fnc_pes_cnpj || '').includes(q)
              ).map((customer: Record<string, unknown>) => ({
                id: String(customer.fnc_pes_id),
                name: String(customer.fnc_pes_nome_fantasia),
                document: customer.fnc_pes_cpf || customer.fnc_pes_cnpj,
                type: 'customer' as const,
                category: customer.fnc_pes_tipo_pessoa
              })).slice(0, limit)
            : [];
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    }

    // Search orders if requested  
    if (searchTypes.includes('orders')) {
      try {
        const response = await railwayApi.getOrders();
        if (response.ok) {
          const orderData = await response.json();
          results.orders = Array.isArray(orderData)
            ? orderData.filter((order: Record<string, unknown>) => 
                String(order.id_pedido).includes(q) ||
                String(order.cliente).toLowerCase().includes(q.toLowerCase())
              ).map((order: Record<string, unknown>) => ({
                id: String(order.id_pedido),
                name: `Pedido #${order.id_pedido}`,
                customer: order.cliente,
                value: order.valor_total,
                type: 'order' as const,
                status: order.status
              })).slice(0, limit)
            : [];
        }
      } catch (error) {
        console.error('Error searching orders:', error);
      }
    }

    // Search products if requested
    if (searchTypes.includes('products')) {
      try {
        const response = await railwayApi.getProducts();
        if (response.ok) {
          const productData = await response.json();
          results.products = Array.isArray(productData)
            ? productData.filter((product: Record<string, unknown>) =>
                String(product.nome).toLowerCase().includes(q.toLowerCase()) ||
                String(product.codigo).toLowerCase().includes(q.toLowerCase())
              ).map((product: Record<string, unknown>) => ({
                id: String(product.id),
                name: String(product.nome),
                code: product.codigo,
                price: product.preco,
                stock: product.estoque,
                type: 'product' as const
              })).slice(0, limit)
            : [];
        }
      } catch (error) {
        console.error('Error searching products:', error);
      }
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, items) => sum + items.length, 0);

    return NextResponse.json({
      query: q,
      types: searchTypes,
      totalResults,
      results,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unified search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    );
  }
}