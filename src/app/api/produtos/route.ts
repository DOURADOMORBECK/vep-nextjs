import { NextRequest, NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';
import { pool } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Inserir produto no banco de dados
    const query = `
      INSERT INTO produtos_financesweb (
        fnc_pro_codigo_automacao,
        fnc_pro_descricao,
        fnc_gpr_descricao,
        fnc_uni_codigo,
        fnc_pro_preco_venda,
        fnc_pro_estoque_atual,
        fnc_pro_estoque_minimo,
        fnc_pro_ativo,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING 
        fnc_pro_id as id,
        fnc_pro_codigo_automacao as code,
        fnc_pro_descricao as name,
        fnc_gpr_descricao as category,
        fnc_uni_codigo as unit,
        fnc_pro_preco_venda as price,
        fnc_pro_estoque_atual as stock,
        fnc_pro_estoque_minimo as minStock,
        fnc_pro_ativo as active,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const values = [
      data.code,
      data.name,
      data.category,
      data.unit,
      data.price,
      data.stock || 0,
      data.minStock || 0,
      data.active !== false
    ];
    
    const result = await pool().query(query, values);
    const newProduct = result.rows[0];
    
    // Adicionar campos que faltam
    newProduct.description = data.description || '';
    newProduct.supplier = data.supplier || '';
    newProduct.barcode = data.barcode || '';
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}