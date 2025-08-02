import { query, queryOne } from '@/lib/db-wrapper';
import { PedidoDetalheFinancesweb } from './financesweb/pedidoDetalheFinanceswebService';

export interface Pedido {
  id: string;
  pedidoNumero: string;
  clienteId: string;
  clienteNome: string;
  dataEmissao: string;
  situacao: string;
  total: number;
  itens: PedidoItem[];
  vendedorId?: string;
  vendedorNome?: string;
  formaPagamento?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PedidoItem {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoCodigo?: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  total: number;
}

export class PedidoService {
  // Agrupa itens do pedido por número do pedido
  private static groupPedidosByNumero(detalhes: PedidoDetalheFinancesweb[]): Map<number, PedidoDetalheFinancesweb[]> {
    const pedidosMap = new Map<number, PedidoDetalheFinancesweb[]>();
    
    detalhes.forEach(detalhe => {
      const numeroDoc = detalhe.fnc_pve_numero_documento;
      if (numeroDoc) {
        if (!pedidosMap.has(numeroDoc)) {
          pedidosMap.set(numeroDoc, []);
        }
        pedidosMap.get(numeroDoc)!.push(detalhe);
      }
    });
    
    return pedidosMap;
  }

  // Converte grupo de detalhes do FinancesWeb para formato da aplicação
  private static mapFinanceswebToPedido(numeroDoc: number, detalhes: PedidoDetalheFinancesweb[]): Pedido {
    const primeiroItem = detalhes[0];
    
    const itens: PedidoItem[] = detalhes.map(detalhe => ({
      id: detalhe.fnc_pvp_id.toString(),
      produtoId: detalhe.fnc_pro_id?.toString() || '',
      produtoNome: detalhe.fnc_pro_descricao || '',
      produtoCodigo: detalhe.fnc_pro_codigo_automacao || '',
      quantidade: detalhe.fnc_pvp_quantidade || 0,
      precoUnitario: detalhe.fnc_pvp_preco_unitario || 0,
      desconto: detalhe.fnc_pvp_valor_desconto || 0,
      total: detalhe.fnc_pvp_total_item || 0
    }));

    const total = itens.reduce((sum, item) => sum + item.total, 0);

    return {
      id: numeroDoc.toString(),
      pedidoNumero: numeroDoc.toString(),
      clienteId: primeiroItem.fnc_pes_id?.toString() || '',
      clienteNome: primeiroItem.fnc_pes_nome_fantasia || primeiroItem.fnc_pes_razao_social || '',
      dataEmissao: primeiroItem.fnc_pve_data_emissao || new Date().toISOString(),
      situacao: primeiroItem.fnc_pve_situacao || 'PENDENTE',
      total,
      itens,
      vendedorId: primeiroItem.fnc_ope_id?.toString(),
      vendedorNome: primeiroItem.fnc_ope_nome,
      formaPagamento: primeiroItem.fnc_fpg_descricao,
      observacoes: '',
      createdAt: primeiroItem.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: primeiroItem.updated_at?.toISOString() || new Date().toISOString()
    };
  }

  static async getAll(filters?: {
    clienteId?: string;
    situacao?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Pedido[]> {
    try {
      let whereClause = 'WHERE 1=1';
      const params: (string | number)[] = [];
      let paramCount = 1;

      if (filters?.clienteId) {
        whereClause += ` AND fnc_pes_id = $${paramCount}`;
        params.push(parseInt(filters.clienteId));
        paramCount++;
      }

      if (filters?.situacao) {
        whereClause += ` AND fnc_pve_situacao = $${paramCount}`;
        params.push(filters.situacao);
        paramCount++;
      }

      if (filters?.dataInicio) {
        whereClause += ` AND fnc_pve_data_emissao >= $${paramCount}`;
        params.push(filters.dataInicio);
        paramCount++;
      }

      if (filters?.dataFim) {
        whereClause += ` AND fnc_pve_data_emissao <= $${paramCount}`;
        params.push(filters.dataFim);
        paramCount++;
      }

      const result = await query<PedidoDetalheFinancesweb>(
        `SELECT * FROM pedidos_detalhe_financesweb 
         ${whereClause}
         ORDER BY fnc_pve_data_emissao DESC, fnc_pve_numero_documento DESC`,
        params
      );

      // Agrupa por número do pedido
      const pedidosMap = this.groupPedidosByNumero(result);
      
      // Converte para formato da aplicação
      const pedidos: Pedido[] = [];
      pedidosMap.forEach((detalhes, numeroDoc) => {
        pedidos.push(this.mapFinanceswebToPedido(numeroDoc, detalhes));
      });

      return pedidos;
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Pedido | null> {
    try {
      const numeroDoc = parseInt(id);
      const result = await query<PedidoDetalheFinancesweb>(
        'SELECT * FROM pedidos_detalhe_financesweb WHERE fnc_pve_numero_documento = $1',
        [numeroDoc]
      );
      
      if (result.length === 0) return null;
      
      return this.mapFinanceswebToPedido(numeroDoc, result);
    } catch (error) {
      console.error('Error fetching pedido by id:', error);
      return null;
    }
  }

  static async getByCliente(clienteId: string): Promise<Pedido[]> {
    return this.getAll({ clienteId });
  }

  static async search(searchTerm: string): Promise<Pedido[]> {
    try {
      const result = await query<PedidoDetalheFinancesweb>(
        `SELECT * FROM pedidos_detalhe_financesweb 
         WHERE fnc_pve_numero_documento::text LIKE $1
            OR fnc_pes_nome_fantasia ILIKE $2
            OR fnc_pes_razao_social ILIKE $2
            OR fnc_pro_descricao ILIKE $2
         ORDER BY fnc_pve_data_emissao DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );

      // Agrupa por número do pedido
      const pedidosMap = this.groupPedidosByNumero(result);
      
      // Converte para formato da aplicação
      const pedidos: Pedido[] = [];
      pedidosMap.forEach((detalhes, numeroDoc) => {
        pedidos.push(this.mapFinanceswebToPedido(numeroDoc, detalhes));
      });

      return pedidos;
    } catch (error) {
      console.error('Error searching pedidos:', error);
      return [];
    }
  }

  static async getStats(): Promise<{
    totalPedidos: number;
    pedidosHoje: number;
    valorTotal: number;
    ticketMedio: number;
  }> {
    try {
      // Total de pedidos (contando documentos únicos)
      const totalResult = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT fnc_pve_numero_documento) as count FROM pedidos_detalhe_financesweb'
      );
      
      // Pedidos de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const hojeResult = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT fnc_pve_numero_documento) as count FROM pedidos_detalhe_financesweb WHERE DATE(fnc_pve_data_emissao) = $1',
        [hoje]
      );
      
      // Valor total
      const valorResult = await queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(fnc_pvp_total_item), 0) as total FROM pedidos_detalhe_financesweb'
      );
      
      const totalPedidos = parseInt(totalResult?.count || '0');
      const valorTotal = parseFloat(valorResult?.total || '0');
      
      return {
        totalPedidos,
        pedidosHoje: parseInt(hojeResult?.count || '0'),
        valorTotal,
        ticketMedio: totalPedidos > 0 ? valorTotal / totalPedidos : 0
      };
    } catch (error) {
      console.error('Error fetching pedido stats:', error);
      return { totalPedidos: 0, pedidosHoje: 0, valorTotal: 0, ticketMedio: 0 };
    }
  }
}