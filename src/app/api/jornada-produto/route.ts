import { NextRequest, NextResponse } from 'next/server';
import { ProdutoService } from '@/services/database/produtoService';
import { PedidoService } from '@/services/database/pedidoService';

// Interface compatível com o que a página jornada-produto espera
interface JornadaProduct {
  id: string;
  name: string;
  code: string;
  assemblyInstructions?: string;
  components?: string[];
  targetQuantity?: number;
  category?: string;
  unit?: string;
  stock?: number;
  description?: string;
}

interface JornadaProductionOrder {
  id: string;
  orderId: string;
  customerName: string;
  expectedDate: string;
  operatorName: string;
  items: JornadaProduct[];
  totalItems: number;
  status: 'Em Montagem' | 'Em Embalagem' | 'Verificação Final' | 'Aprovado' | 'Reprovado';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Buscar produtos reais do banco de dados
    const produtos = await ProdutoService.getAll();
    
    // Buscar pedidos para contexto de produção
    const pedidos = await PedidoService.getRecentPedidos(5);
    
    // Converter produtos para o formato esperado pela página jornada-produto
    const jornadaProducts: JornadaProduct[] = produtos
      .filter(produto => produto.active && produto.stock > 0)
      .slice(0, limit)
      .map(produto => ({
        id: produto.id,
        name: produto.name,
        code: produto.code,
        assemblyInstructions: generateAssemblyInstructions(produto.name, produto.category),
        components: generateComponents(produto.name, produto.category),
        targetQuantity: generateTargetQuantity(produto.stock),
        category: produto.category,
        unit: produto.unit,
        stock: produto.stock,
        description: produto.description
      }));
    
    // Criar ordem de produção baseada em pedido real se disponível
    const productionOrder: JornadaProductionOrder = {
      id: `PROD-${Date.now()}`,
      orderId: pedidos.length > 0 ? `PED-${pedidos[0].id}` : 'PED-DEMO',
      customerName: pedidos.length > 0 ? (pedidos[0].cliente_nome || 'Cliente não identificado') : 'Cliente Demo',
      expectedDate: pedidos.length > 0 ? (pedidos[0].data_emissao || new Date().toISOString()) : new Date().toISOString(),
      operatorName: 'Operador Sistema', // Em implementação real, viria do contexto de autenticação
      items: jornadaProducts,
      totalItems: jornadaProducts.length,
      status: 'Em Montagem'
    };
    
    return NextResponse.json({
      products: jornadaProducts,
      productionOrder
    });
  } catch (error) {
    console.error('Error fetching production data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production data' },
      { status: 500 }
    );
  }
}

// Funções auxiliares para mapear dados reais para o formato esperado
function generateAssemblyInstructions(productName: string, category: string): string {
  const name = productName.toLowerCase();
  const cat = category.toLowerCase();
  
  if (cat.includes('alimento') || name.includes('tomate') || name.includes('alface')) {
    return `1. Selecionar ${productName} frescos e de qualidade\n2. Realizar lavagem e sanitização\n3. Embalar conforme especificações\n4. Aplicar etiquetas de identificação\n5. Verificar peso e aparência final`;
  }
  
  if (cat.includes('eletr') || name.includes('tv') || name.includes('computador')) {
    return `1. Verificar todos os componentes na embalagem\n2. Montar seguindo manual técnico\n3. Realizar teste de funcionamento\n4. Embalar com proteção adequada\n5. Aplicar lacres de garantia`;
  }
  
  if (cat.includes('limpeza') || name.includes('detergente')) {
    return `1. Verificar concentração do produto\n2. Embalar em recipiente adequado\n3. Aplicar rótulo com instruções\n4. Verificar vedação da embalagem\n5. Controle de qualidade final`;
  }
  
  return `1. Preparar ${productName} conforme especificação\n2. Verificar componentes necessários\n3. Realizar montagem/preparação\n4. Embalar adequadamente\n5. Controle de qualidade final`;
}

function generateComponents(productName: string, category: string): string[] {
  const name = productName.toLowerCase();
  const cat = category.toLowerCase();
  
  if (cat.includes('alimento') || name.includes('tomate') || name.includes('alface')) {
    return ['Produto principal', 'Embalagem plástica', 'Etiqueta identificação', 'Lacre sanitário'];
  }
  
  if (cat.includes('eletr') || name.includes('tv') || name.includes('computador')) {
    return ['Componente principal', 'Cabos', 'Manual', 'Embalagem protetiva', 'Lacre garantia'];
  }
  
  if (cat.includes('limpeza') || name.includes('detergente')) {
    return ['Produto concentrado', 'Recipiente', 'Rótulo instruções', 'Tampa vedação'];
  }
  
  return ['Componente principal', 'Embalagem', 'Etiqueta', 'Documentação'];
}

function generateTargetQuantity(stock: number): number {
  // Gerar quantidade alvo baseada no estoque disponível
  if (stock <= 10) return Math.floor(stock * 0.8);
  if (stock <= 50) return Math.floor(stock * 0.6);
  if (stock <= 100) return Math.floor(stock * 0.4);
  return Math.floor(stock * 0.2);
}