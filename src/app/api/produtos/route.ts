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
    
    return NextResponse.json({ products: produtos });
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { 
          error: 'Database connection not configured',
          products: []
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        products: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.code) {
      return NextResponse.json(
        { error: 'Product name and code are required' },
        { status: 400 }
      );
    }
    
    // Inserir produto no banco de dados real
    const query = `
      INSERT INTO fnc_produtos_e_servicos (
        fnc_pro_codigo_automacao,
        fnc_pro_descricao,
        fnc_gpr_descricao,
        fnc_uni_codigo,
        fnc_pro_preco_a_vista,
        fnc_pro_estoque_atual,
        fnc_pro_estoque_minimo,
        fnc_pro_status,
        fnc_pro_dh_atualizacao,
        sync_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING 
        fnc_pro_id as id,
        fnc_pro_codigo_automacao as code,
        fnc_pro_descricao as name,
        fnc_gpr_descricao as category,
        fnc_uni_codigo as unit,
        fnc_pro_preco_a_vista as price,
        fnc_pro_estoque_atual as stock,
        fnc_pro_estoque_minimo as minStock,
        fnc_pro_status as status,
        fnc_pro_dh_atualizacao as "createdAt",
        sync_date as "updatedAt"
    `;
    
    const values = [
      data.code,
      data.name,
      data.category,
      data.unit || 'UN',
      data.price || 0,
      data.stock || 0,
      data.minStock || 0,
      data.active !== false ? 'Ativo' : 'Inativo'
    ];
    
    const result = await pool().query(query, values);
    const newProduct = result.rows[0];
    
    // Adicionar campos que faltam e converter status para boolean
    newProduct.active = newProduct.status === 'Ativo';
    delete newProduct.status;
    newProduct.description = data.description || '';
    newProduct.supplier = data.supplier || '';
    newProduct.barcode = data.barcode || '';
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating product:', error);
    
    // Check for duplicate product code
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 409 }
      );
    }
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}