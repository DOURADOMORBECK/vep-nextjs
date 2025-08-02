import { NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';

export async function GET() {
  try {
    const categories = await ProdutoService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}