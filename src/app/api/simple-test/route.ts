import { NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';
import { PessoaService } from '@/services/database/pessoaService';

export async function GET() {
  try {
    // Test both services
    const [products, customers] = await Promise.all([
      ProdutoService.getAll().catch(() => []),
      PessoaService.getCustomers().catch(() => [])
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
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      products: { count: 0, sample: [] },
      customers: { count: 0, sample: [] }
    });
  }
}