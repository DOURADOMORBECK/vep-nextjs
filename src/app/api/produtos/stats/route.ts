import { NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';

export async function GET() {
  try {
    const stats = await ProdutoService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product stats' },
      { status: 500 }
    );
  }
}