import { NextRequest, NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    
    let produtos;
    
    if (search) {
      produtos = await ProdutoService.search(search);
    } else if (category) {
      produtos = await ProdutoService.getByCategory(category);
    } else {
      produtos = await ProdutoService.getAll();
    }
    
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}