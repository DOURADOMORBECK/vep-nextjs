import { NextRequest, NextResponse } from 'next/server';
import { PedidoService } from '@/services/database/pedidoService';

// Interface compatível com o que a página jornada-pedido espera
interface JornadaOrder {
  id: string;
  customer: string;
  products: JornadaProduct[];
  status: string;
}

interface JornadaProduct {
  id: string;
  name: string;
  code: string;
  expectedQuantity: number;
  category: string;
  location: string;
  batch: string;
  expiry: string;
  image: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Buscar pedidos reais do banco de dados
    const pedidos = await PedidoService.getAll({
      situacao: status || undefined
    });
    
    // Converter pedidos para o formato esperado pela página jornada-pedido
    const orders: JornadaOrder[] = pedidos
      .filter(pedido => ['CONFIRMADO', 'APROVADO', 'PENDENTE'].includes(pedido.situacao.toUpperCase()))
      .slice(0, 10) // Limitar a 10 pedidos para performance
      .map(pedido => ({
        id: pedido.id,
        customer: pedido.clienteNome,
        status: pedido.situacao,
        products: pedido.itens.map((item, index) => ({
          id: item.id,
          name: item.produtoNome,
          code: item.produtoCodigo || `P${item.produtoId}`,
          expectedQuantity: Math.floor(item.quantidade),
          category: getCategoryFromProduct(item.produtoNome),
          location: getLocationFromProduct(index),
          batch: generateBatch(item.produtoId),
          expiry: generateExpiry(),
          image: getProductImage()
        }))
      }));
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders for jornada:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Funções auxiliares para mapear dados reais para o formato esperado
function getCategoryFromProduct(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes('alimento') || name.includes('comida')) return 'Alimentos';
  if (name.includes('bebida') || name.includes('água') || name.includes('suco')) return 'Bebidas';
  if (name.includes('limpeza') || name.includes('detergente')) return 'Limpeza';
  if (name.includes('higiene') || name.includes('sabonete')) return 'Higiene';
  if (name.includes('eletr') || name.includes('tv') || name.includes('computador')) return 'Eletrônicos';
  return 'Diversos';
}

function getLocationFromProduct(index: number): string {
  const locations = [
    'A-01-001', 'A-01-002', 'A-02-001', 'A-02-002', 'B-01-001',
    'B-01-002', 'B-02-001', 'B-02-002', 'C-01-001', 'C-01-002'
  ];
  return locations[index % locations.length];
}

function generateBatch(productId: string): string {
  // Gerar lote baseado no ID do produto e data atual (mais realista)
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}${productId.slice(-3).padStart(3, '0')}`;
}

function generateExpiry(): string {
  // Data de validade baseada na data atual + período padrão de 6 meses
  const date = new Date();
  date.setMonth(date.getMonth() + 6); // 6 meses de validade padrão
  return date.toISOString().split('T')[0];
}

function getProductImage(): string {
  // Retorna uma imagem padrão para produtos sem imagem específica
  // Em produção, isso viria do cadastro de produtos no FinancesWeb
  return `/images/products/default-product.jpg`;
}