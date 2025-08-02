import { operadorService } from './operadorService';
import { query, queryOne } from '@/lib/db-wrapper';

// Interfaces baseadas nos dados reais disponíveis
export interface EntregaPedido {
  id: string;
  pedidoNumero: string;
  clienteNome: string;
  clienteEndereco: string;
  status: 'Verificado' | 'Em_Rota' | 'Entregue' | 'Problema';
  peso: number; // calculado baseado nos produtos
  itens: number; // quantidade de itens
  coords: [number, number]; // coordenadas estimadas
  dataEmissao: string;
  valorTotal: number;
}

export interface EntregaVeiculo {
  id: string;
  placa: string; // baseado no operador
  motorista: string; // nome do operador
  motoristaId: string; // id do operador
  status: 'Disponivel' | 'Em_Rota' | 'Manutencao';
  capacidade: string; // capacidade estimada
}

export interface EntregaRota {
  id: number;
  codigo: string;
  motoristaId: number;
  motoristaNome: string;
  veiculoId: string;
  totalPontos: number;
  distanciaKm: number;
  status: 'CRIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  dataCreation: Date;
  dataAtualizacao: Date;
}

export interface EntregaStats {
  totalEntregas: number;
  entregasHoje: number;
  rotasAtivas: number;
  veiculosDisponiveis: number;
  eficienciaMedia: number;
}

class EntregaService {
  // Buscar pedidos que podem ser entregues (status 'Verificado')
  async getPedidosParaEntrega(): Promise<EntregaPedido[]> {
    try {
      // Buscar pedidos com dados completos do cliente
      const pedidosCompletos = await query<{
        id: number;
        num_pedido: number;
        cliente_id: number;
        cliente_nome: string;
        status: string;
        data_emissao: Date;
        valor_total: number;
        peso_total: number;
        qtd_itens: number;
        endereco: string;
        numero: string;
        complemento: string;
        cidade: string;
        uf: string;
        cep: string;
        latitude: number;
        longitude: number;
      }>(`
        SELECT 
          p.fnc_ped_id as id,
          p.fnc_ped_numero as num_pedido,
          p.fnc_pes_id as cliente_id,
          pe.fnc_pes_nome_fantasia as cliente_nome,
          p.fnc_ped_status as status,
          p.fnc_ped_data_emissao as data_emissao,
          p.fnc_ped_valor_total as valor_total,
          COALESCE(p.fnc_ped_peso_total, 0) as peso_total,
          COALESCE(p.fnc_ped_qtd_itens, 1) as qtd_itens,
          pe.fnc_pes_endereco as endereco,
          pe.fnc_pes_numero as numero,
          pe.fnc_pes_complemento as complemento,
          pe.fnc_pes_cidade as cidade,
          pe.fnc_pes_uf as uf,
          pe.fnc_pes_cep as cep,
          COALESCE(pe.fnc_pes_latitude, 0) as latitude,
          COALESCE(pe.fnc_pes_longitude, 0) as longitude
        FROM pedidos_financesweb p
        JOIN pessoas_financesweb pe ON p.fnc_pes_id = pe.fnc_pes_id
        WHERE p.fnc_ped_status IN ('Confirmado', 'Aprovado', 'Liberado')
        ORDER BY p.fnc_ped_data_emissao DESC
        LIMIT 20
      `);
      
      // Mapear para formato de entrega
      const pedidosEntrega: EntregaPedido[] = pedidosCompletos.map(pedido => {
        const enderecoCompleto = [
          pedido.endereco,
          pedido.numero,
          pedido.complemento
        ].filter(Boolean).join(', ');

        return {
          id: pedido.id.toString(),
          pedidoNumero: pedido.num_pedido.toString(),
          clienteNome: pedido.cliente_nome || `Cliente ${pedido.cliente_id}`,
          clienteEndereco: `${enderecoCompleto}, ${pedido.cidade}/${pedido.uf} - ${pedido.cep}`,
          status: 'Verificado' as const,
          peso: pedido.peso_total || 5, // Usar peso real ou default mínimo
          itens: pedido.qtd_itens || 1,
          coords: pedido.latitude && pedido.longitude 
            ? [pedido.latitude, pedido.longitude] as [number, number]
            : this.getDefaultCoords(pedido.cidade),
          dataEmissao: pedido.data_emissao?.toISOString() || new Date().toISOString(),
          valorTotal: pedido.valor_total || 0
        };
      });
      
      return pedidosEntrega;
    } catch (error) {
      console.error('Erro ao buscar pedidos para entrega:', error);
      return [];
    }
  }

  // Buscar veículos disponíveis (baseado nos operadores)
  async getVeiculosDisponiveis(): Promise<EntregaVeiculo[]> {
    try {
      const operadores = await operadorService.getAllOperadores();
      
      // Criar veículos baseados nos operadores ativos
      const veiculos = operadores
        .filter(op => op.ativo)
        .map((operador, index) => ({
          id: operador.id.toString(),
          placa: this.generatePlaca(operador.id),
          motorista: operador.nome,
          motoristaId: operador.id.toString(),
          status: 'Disponivel' as const,
          capacidade: this.getCapacidadeVeiculo(index)
        }));
      
      return veiculos;
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      return [];
    }
  }

  // Criar rota de entrega
  async criarRota(dados: {
    codigoRota: string;
    motoristaId?: number;
    motoristaNome?: string;
    veiculoId: string;
    totalPontos: number;
    distanciaKm: number;
  }): Promise<EntregaRota> {
    try {
      // Como não temos tabela de rotas, vamos simular com dados em memória
      // Em uma implementação real, criaria uma tabela no banco
      const novaRota: EntregaRota = {
        id: Date.now(), // ID temporário
        codigo: dados.codigoRota,
        motoristaId: dados.motoristaId || 1,
        motoristaNome: dados.motoristaNome || 'Motorista',
        veiculoId: dados.veiculoId,
        totalPontos: dados.totalPontos,
        distanciaKm: dados.distanciaKm,
        status: 'CRIADA',
        dataCreation: new Date(),
        dataAtualizacao: new Date()
      };

      return novaRota;
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      throw error;
    }
  }

  // Obter estatísticas de entrega
  async getEstatisticasEntrega(): Promise<EntregaStats> {
    try {
      // Buscar estatísticas reais do banco
      const statsQuery = await queryOne<{
        total_entregas: string;
        entregas_hoje: string;
        veiculos_disponiveis: string;
      }>(`
        SELECT 
          COUNT(DISTINCT p.fnc_ped_id) as total_entregas,
          COUNT(DISTINCT CASE 
            WHEN DATE(p.fnc_ped_data_emissao) = CURRENT_DATE 
            THEN p.fnc_ped_id 
          END) as entregas_hoje,
          COUNT(DISTINCT CASE 
            WHEN o.fnc_ope_ativo = true 
            THEN o.fnc_ope_id 
          END) as veiculos_disponiveis
        FROM pedidos_financesweb p
        JOIN pessoas_financesweb pe ON p.fnc_pes_id = pe.fnc_pes_id
        LEFT JOIN operadores_financesweb o ON true
        WHERE p.fnc_ped_status IN ('Confirmado', 'Aprovado', 'Liberado')
      `);

      // Calcular eficiência baseada em pedidos entregues vs total
      const eficienciaQuery = await queryOne<{
        entregues: string;
        total: string;
      }>(`
        SELECT 
          COUNT(CASE WHEN fnc_ped_status = 'Entregue' THEN 1 END) as entregues,
          COUNT(*) as total
        FROM pedidos_financesweb 
        WHERE fnc_ped_data_emissao >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const totalEntregas = parseInt(statsQuery?.total_entregas || '0');
      const entregasHoje = parseInt(statsQuery?.entregas_hoje || '0');
      const veiculosDisponiveis = parseInt(statsQuery?.veiculos_disponiveis || '0');
      
      const entregues = parseInt(eficienciaQuery?.entregues || '0');
      const totalPedidos = parseInt(eficienciaQuery?.total || '0');
      const eficienciaMedia = totalPedidos > 0 ? (entregues / totalPedidos) * 100 : 0;

      return {
        totalEntregas,
        entregasHoje,
        rotasAtivas: Math.floor(veiculosDisponiveis * 0.6), // Estimativa baseada em veículos disponíveis
        veiculosDisponiveis,
        eficienciaMedia: Math.round(eficienciaMedia * 100) / 100
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalEntregas: 0,
        entregasHoje: 0,
        rotasAtivas: 0,
        veiculosDisponiveis: 0,
        eficienciaMedia: 0
      };
    }
  }

  // Métodos auxiliares
  private getDefaultCoords(cidade: string): [number, number] {
    // Mapeamento de coordenadas de cidades reais do RS
    const coordenadas: Record<string, [number, number]> = {
      'PORTO ALEGRE': [-30.0346, -51.2177],
      'CANOAS': [-29.9177, -51.1806],
      'CAXIAS DO SUL': [-29.1634, -51.1797],
      'PELOTAS': [-31.7685, -52.3417],
      'SANTA MARIA': [-29.6868, -53.8062],
      'GRAVATAÍ': [-29.9447, -50.9919],
      'VIAMÃO': [-30.0811, -51.0233],
      'NOVO HAMBURGO': [-29.6783, -51.1309],
      'SÃO LEOPOLDO': [-29.7604, -51.1472],
      'RIO GRANDE': [-32.0350, -52.0986]
    };

    const chaveCidade = cidade?.toUpperCase() || '';
    
    // Retorna coordenadas da cidade ou default para Porto Alegre
    return coordenadas[chaveCidade] || coordenadas['PORTO ALEGRE'];
  }

  private generatePlaca(operadorId: number): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letra1 = letras[operadorId % 26];
    const letra2 = letras[(operadorId * 2) % 26]; 
    const letra3 = letras[(operadorId * 3) % 26];
    const num1 = (operadorId % 10);
    const num2 = ((operadorId * 2) % 10);
    const num3 = ((operadorId * 3) % 10);
    const num4 = ((operadorId * 4) % 10);
    
    return `${letra1}${letra2}${letra3}-${num1}${num2}${num3}${num4}`;
  }

  private getCapacidadeVeiculo(index: number): string {
    const capacidades = ['1000kg', '1500kg', '2000kg', '2500kg', '3000kg'];
    return capacidades[index % capacidades.length];
  }

  // Métodos para operações de rota (simulados já que não temos tabelas específicas)
  async iniciarRota(rotaId: string): Promise<boolean> {
    // Em implementação real, atualizaria status na tabela
    console.log(`Rota ${rotaId} iniciada`);
    return true;
  }

  async marcarPontoEntregue(pontoId: string, observacoes?: string): Promise<boolean> {
    // Em implementação real, atualizaria status do ponto na tabela
    console.log(`Ponto ${pontoId} marcado como entregue. Obs: ${observacoes || 'N/A'}`);
    return true;
  }

  async finalizarRota(rotaId: string): Promise<boolean> {
    // Em implementação real, atualizaria status da rota na tabela
    console.log(`Rota ${rotaId} finalizada`);
    return true;
  }

  async atualizarRota(rotaId: string, dados: { pontosCompletos?: number }): Promise<boolean> {
    // Em implementação real, atualizaria dados da rota na tabela
    console.log(`Rota ${rotaId} atualizada:`, dados);
    return true;
  }
}

export const entregaService = new EntregaService();