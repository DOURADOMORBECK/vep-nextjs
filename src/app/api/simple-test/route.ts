import { NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';
import { PessoaServiceV2 } from '@/services/database/pessoaServiceV2';

export async function GET() {
  try {
    // Test both services
    const [products, customers] = await Promise.all([
      ProdutoService.getAll().catch(() => []),
      PessoaServiceV2.getCustomers().catch(() => [])
    ]);

    return NextResponse.json({
      products: {
        count: products.length,
        sample: products.slice(0, 3)
      },
      customers: {
        count: customers.length,
        sample: customers.slice(0, 3)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      products: { count: 0, sample: [] },
      customers: { count: 0, sample: [] }
    });
  }
}