import { query, queryOne } from '@/lib/db-wrapper';

// Interface para mapear os dados reais do PostgreSQL
interface PedidoVendaProdutos {
  fnc_pvp_id: bigint;
  fnc_pve_id?: bigint;
  fnc_tpe_codigo?: bigint;
  fnc_tpe_descricao?: string;
  fnc_pve_sequencial_pedido?: bigint;
  fnc_emp_id?: bigint;
  fnc_pve_data_emissao?: Date;
  fnc_pve_situacao?: string;
  fnc_pve_data_situacao?: Date;
  fnc_nat_descricao?: string;
  fnc_nat_origem?: string;
  fnc_mod_modelo?: string;
  fnc_mod_descricao?: string;
  fnc_pve_numero_documento?: bigint;
  fnc_pve_serie_documento?: string;
  fnc_pes_id?: bigint;
  fnc_pes_nome_fantasia?: string;
  fnc_pes_razao_social?: string;
  fnc_pes_cidade?: string;
  fnc_pes_uf?: string;
  fnc_ope_id?: bigint;
  fnc_ope_nome?: string;
  fnc_pla_id?: bigint;
  fnc_pla_descricao?: string;
  fnc_fpg_id?: bigint;
  fnc_fpg_descricao?: string;
  fnc_pro_id?: bigint;
  fnc_pro_descricao?: string;
  fnc_pro_codigo_automacao?: string;
  fnc_gpr_descricao?: string;
  fnc_dep_descricao?: string;
  fnc_mar_descricao?: string;
  fnc_pvp_quantidade?: number;
  fnc_pvp_preco_unitario?: number;
  fnc_pvp_valor_desconto?: number;
  fnc_pvp_valor_acrescimo?: number;
  fnc_pvp_total_item?: number;
  fnc_pvp_valor_frete?: number;
  fnc_pvp_valor_seguro?: number;
  fnc_pvp_valor_outras_desp?: number;
  fnc_pvp_valor_icms_st?: number;
  fnc_pvp_valor_ipi?: number;
  fnc_pvp_valor_ipi_devolvido?: number;
  fnc_pvp_valor_fcp_st?: number;
  sync_date?: Date;
}

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

export interface PedidoResumido {
  id: number;
  num_pedido: number;
  status: string;
  data_emissao?: string;
  cliente_nome?: string;
  valor_total?: number;
}

export class PedidoService {
  // Agrupa itens do pedido por número do pedido
  private static groupPedidosByNumero(detalhes: PedidoVendaProdutos[]): Map<number, PedidoVendaProdutos[]> {
    const pedidosMap = new Map<number, PedidoVendaProdutos[]>();
    
    detalhes.forEach(detalhe => {
      const numeroDoc = Number(detalhe.fnc_pve_numero_documento);
      if (numeroDoc) {
        if (!pedidosMap.has(numeroDoc)) {
          pedidosMap.set(numeroDoc, []);
        }
        pedidosMap.get(numeroDoc)!.push(detalhe);
      }
    });
    
    return pedidosMap;
  }

  // Converte grupo de detalhes do PostgreSQL real para formato da aplicação
  private static mapPostgresToPedido(numeroDoc: number, detalhes: PedidoVendaProdutos[]): Pedido {
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
      dataEmissao: primeiroItem.fnc_pve_data_emissao?.toISOString() || new Date().toISOString(),
      situacao: primeiroItem.fnc_pve_situacao || 'PENDENTE',
      total,
      itens,
      vendedorId: primeiroItem.fnc_ope_id?.toString(),
      vendedorNome: primeiroItem.fnc_ope_nome,
      formaPagamento: primeiroItem.fnc_fpg_descricao,
      observacoes: '',
      createdAt: primeiroItem.sync_date?.toISOString() || new Date().toISOString(),
      updatedAt: primeiroItem.sync_date?.toISOString() || new Date().toISOString()
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

      const result = await query<PedidoVendaProdutos>(
        `SELECT * FROM vw_pedidos_venda_produtos 
         ${whereClause}
         ORDER BY fnc_pve_data_emissao DESC, fnc_pve_numero_documento DESC`,
        params
      );

      // Agrupa por número do pedido
      const pedidosMap = this.groupPedidosByNumero(result);
      
      // Converte para formato da aplicação
      const pedidos: Pedido[] = [];
      pedidosMap.forEach((detalhes, numeroDoc) => {
        pedidos.push(this.mapPostgresToPedido(numeroDoc, detalhes));
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
      const result = await query<PedidoVendaProdutos>(
        'SELECT * FROM vw_pedidos_venda_produtos WHERE fnc_pve_numero_documento = $1',
        [numeroDoc]
      );
      
      if (result.length === 0) return null;
      
      return this.mapPostgresToPedido(numeroDoc, result);
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
      const result = await query<PedidoVendaProdutos>(
        `SELECT * FROM vw_pedidos_venda_produtos 
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
        pedidos.push(this.mapPostgresToPedido(numeroDoc, detalhes));
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
        'SELECT COUNT(DISTINCT fnc_pve_numero_documento) as count FROM vw_pedidos_venda_produtos'
      );
      
      // Pedidos de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const hojeResult = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT fnc_pve_numero_documento) as count FROM vw_pedidos_venda_produtos WHERE DATE(fnc_pve_data_emissao) = $1',
        [hoje]
      );
      
      // Valor total
      const valorResult = await queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(fnc_pvp_total_item), 0) as total FROM vw_pedidos_venda_produtos'
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

  // Método para obter pedidos recentes
  static async getRecentPedidos(limit: number = 5): Promise<PedidoResumido[]> {
    try {
      const result = await query<{
        fnc_pve_numero_documento: number;
        fnc_pve_situacao: string;
        fnc_pve_data_emissao: string;
        fnc_pes_nome_fantasia?: string;
        fnc_pes_razao_social?: string;
        valor_total?: number;
      }>(
        `SELECT DISTINCT 
          fnc_pve_numero_documento,
          fnc_pve_situacao,
          fnc_pve_data_emissao,
          fnc_pes_nome_fantasia,
          fnc_pes_razao_social,
          SUM(fnc_pvp_total_item) OVER (PARTITION BY fnc_pve_numero_documento) as valor_total
        FROM vw_pedidos_venda_produtos
        ORDER BY fnc_pve_data_emissao DESC
        LIMIT $1`,
        [limit]
      );

      return result.map(row => ({
        id: row.fnc_pve_numero_documento,
        num_pedido: row.fnc_pve_numero_documento,
        status: row.fnc_pve_situacao || 'PENDENTE',
        data_emissao: row.fnc_pve_data_emissao,
        cliente_nome: row.fnc_pes_nome_fantasia || row.fnc_pes_razao_social || 'Cliente não identificado',
        valor_total: row.valor_total || 0
      }));
    } catch (error) {
      console.error('Error fetching recent pedidos:', error);
      return [];
    }
  }

  // Método para obter todos os pedidos como resumo
  static async getAllPedidos(): Promise<PedidoResumido[]> {
    try {
      const result = await query<{
        fnc_pve_numero_documento: number;
        fnc_pve_situacao: string;
        fnc_pve_data_emissao: string;
        fnc_pes_nome_fantasia?: string;
        fnc_pes_razao_social?: string;
        valor_total?: number;
      }>(
        `SELECT DISTINCT 
          fnc_pve_numero_documento,
          fnc_pve_situacao,
          fnc_pve_data_emissao,
          fnc_pes_nome_fantasia,
          fnc_pes_razao_social,
          SUM(fnc_pvp_total_item) OVER (PARTITION BY fnc_pve_numero_documento) as valor_total
        FROM vw_pedidos_venda_produtos
        ORDER BY fnc_pve_data_emissao DESC`
      );

      return result.map(row => ({
        id: row.fnc_pve_numero_documento,
        num_pedido: row.fnc_pve_numero_documento,
        status: row.fnc_pve_situacao || 'PENDENTE',
        data_emissao: row.fnc_pve_data_emissao,
        cliente_nome: row.fnc_pes_nome_fantasia || row.fnc_pes_razao_social || 'Cliente não identificado',
        valor_total: row.valor_total || 0
      }));
    } catch (error) {
      console.error('Error fetching all pedidos:', error);
      return [];
    }
  }
}

export const pedidoService = new PedidoService();