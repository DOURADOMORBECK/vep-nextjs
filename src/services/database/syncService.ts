import { query, queryOne } from '@/lib/db-wrapper';
import { fetchFromAPI } from '@/app/api/financesweb/sync/config';
import { UserLogService } from './userLogService';

// Interfaces para os dados do FinancesWeb
interface ProdutoFinancesWeb {
  fnc_pro_id: number;
  fnc_pro_descricao: string;
  fnc_pro_codigo: string;
  fnc_gpr_descricao: string;
  fnc_pro_preco_venda: number;
  fnc_pro_status: string;
  fnc_pro_estoque_atual: number;
  fnc_pro_estoque_minimo: number;
}

interface PessoaFinancesWeb {
  fnc_pes_id: number;
  fnc_pes_nome_fantasia: string;
  fnc_pes_razao_social: string;
  fnc_pes_cpf_cnpj: string;
  fnc_pes_email: string;
  fnc_pes_telefone: string;
  fnc_pes_celular: string;
  fnc_pes_endereco: string;
  fnc_pes_numero: string;
  fnc_pes_complemento: string;
  fnc_pes_bairro: string;
  fnc_pes_cidade: string;
  fnc_pes_uf: string;
  fnc_pes_cep: string;
  fnc_pes_tipo_pessoa: number;
  fnc_pes_status: string;
}

interface OperadorFinancesWeb {
  fnc_ope_id: number;
  fnc_ope_nome: string;
  fnc_ope_email: string;
  fnc_ope_telefone: string;
  fnc_ope_ativo: boolean;
}

interface PedidoFinancesWeb {
  fnc_ped_id: number;
  fnc_ped_numero: number;
  fnc_pes_id: number;
  fnc_ped_data_emissao: string;
  fnc_ped_valor_total: number;
  fnc_ped_status: string;
  fnc_ped_observacao: string;
  fnc_ped_data_modificacao: string;
  fnc_ped_peso_total: number;
  fnc_ped_qtd_itens: number;
}

export interface SyncConfig {
  entity: string;
  table: string;
  apiEndpoint: string;
  filters?: string;
  incrementalField?: string;
  chunkSize?: number;
}

export interface SyncResult {
  entity: string;
  totalRecords: number;
  inserted: number;
  updated: number;
  errors: number;
  duration: number;
  isIncremental: boolean;
  lastSyncDate?: string;
}

export interface SyncStatus {
  entity: string;
  lastSync: Date | null;
  lastRecordDate: Date | null;
  recordCount: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  lastError?: string;
}

class SyncService {
  // Configuração das entidades para sincronização
  private static readonly SYNC_CONFIGS: SyncConfig[] = [
    {
      entity: 'produtos',
      table: 'produtos_financesweb',
      apiEndpoint: 'fnc_produtos_e_servicos',
      incrementalField: 'updated_at',
      chunkSize: 1000
    },
    {
      entity: 'pessoas',
      table: 'pessoas_financesweb',
      apiEndpoint: 'fnc_pessoas',
      incrementalField: 'updated_at',
      chunkSize: 500
    },
    {
      entity: 'operadores',
      table: 'operadores_financesweb',
      apiEndpoint: 'fnc_operadores',
      incrementalField: 'updated_at',
      chunkSize: 100
    },
    {
      entity: 'pedidos',
      table: 'pedidos_financesweb',
      apiEndpoint: 'vw_pedidos_venda_produtos',
      incrementalField: 'fnc_ped_data_modificacao',
      chunkSize: 500
    }
  ];

  // Criar tabela de controle de sincronização
  static async initializeSyncControl(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS sync_control (
          id SERIAL PRIMARY KEY,
          entity VARCHAR(100) UNIQUE NOT NULL,
          last_sync_date TIMESTAMP WITH TIME ZONE,
          last_record_date TIMESTAMP WITH TIME ZONE,
          record_count INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          last_error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_sync_control_entity ON sync_control(entity);
        CREATE INDEX IF NOT EXISTS idx_sync_control_status ON sync_control(status);
      `);

      // Inicializar registros de controle para cada entidade
      for (const config of this.SYNC_CONFIGS) {
        await query(`
          INSERT INTO sync_control (entity, status)
          VALUES ($1, 'pending')
          ON CONFLICT (entity) DO NOTHING
        `, [config.entity]);
      }
    } catch (error) {
      console.error('Erro ao inicializar tabela de controle de sincronização:', error);
      throw error;
    }
  }

  // Obter status de sincronização
  static async getSyncStatus(entity?: string): Promise<SyncStatus[]> {
    try {
      const whereClause = entity ? 'WHERE entity = $1' : '';
      const params = entity ? [entity] : [];

      const results = await query<{
        entity: string;
        last_sync_date: Date | null;
        last_record_date: Date | null;
        record_count: number;
        status: string;
        last_error: string | null;
      }>(`
        SELECT 
          entity,
          last_sync_date,
          last_record_date,
          record_count,
          status,
          last_error
        FROM sync_control
        ${whereClause}
        ORDER BY entity
      `, params);

      return results.map(r => ({
        entity: r.entity,
        lastSync: r.last_sync_date,
        lastRecordDate: r.last_record_date,
        recordCount: r.record_count,
        status: r.status as SyncStatus['status'],
        lastError: r.last_error || undefined
      }));
    } catch (error) {
      console.error('Erro ao obter status de sincronização:', error);
      return [];
    }
  }

  // Atualizar status de sincronização
  private static async updateSyncStatus(
    entity: string, 
    status: SyncStatus['status'], 
    error?: string
  ): Promise<void> {
    await query(`
      UPDATE sync_control
      SET 
        status = $2,
        last_error = $3,
        updated_at = NOW()
      WHERE entity = $1
    `, [entity, status, error || null]);
  }

  // Sincronização completa (inicial)
  static async performFullSync(entity?: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const configs = entity 
      ? this.SYNC_CONFIGS.filter(c => c.entity === entity)
      : this.SYNC_CONFIGS;

    for (const config of configs) {
      try {
        const result = await this.syncEntity(config, false);
        results.push(result);
      } catch (error) {
        console.error(`Erro ao sincronizar ${config.entity}:`, error);
        results.push({
          entity: config.entity,
          totalRecords: 0,
          inserted: 0,
          updated: 0,
          errors: 1,
          duration: 0,
          isIncremental: false
        });
      }
    }

    return results;
  }

  // Sincronização incremental
  static async performIncrementalSync(entity?: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const configs = entity 
      ? this.SYNC_CONFIGS.filter(c => c.entity === entity)
      : this.SYNC_CONFIGS;

    for (const config of configs) {
      if (!config.incrementalField) {
        console.log(`${config.entity} não suporta sincronização incremental`);
        continue;
      }

      try {
        const result = await this.syncEntity(config, true);
        results.push(result);
      } catch (error) {
        console.error(`Erro na sincronização incremental de ${config.entity}:`, error);
        results.push({
          entity: config.entity,
          totalRecords: 0,
          inserted: 0,
          updated: 0,
          errors: 1,
          duration: 0,
          isIncremental: true
        });
      }
    }

    return results;
  }

  // Sincronizar uma entidade específica
  private static async syncEntity(
    config: SyncConfig, 
    incremental: boolean
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let totalRecords = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Atualizar status para 'running'
      await this.updateSyncStatus(config.entity, 'running');

      // Log de início
      await UserLogService.create({
        userId: 'system',
        userName: 'Sistema de Sincronização',
        action: incremental ? 'SYNC_INCREMENTAL_START' : 'SYNC_FULL_START',
        module: 'SYNC',
        details: { entity: config.entity }
      });

      // Obter última data de sincronização se for incremental
      let filter = config.filters;
      if (incremental && config.incrementalField) {
        const lastSync = await this.getLastSyncDate(config.entity);
        if (lastSync) {
          const dateFilter = `${config.incrementalField}=gt.${lastSync.toISOString()}`;
          filter = filter ? `${filter},${dateFilter}` : dateFilter;
        }
      }

      // Buscar dados da API
      console.log(`🔄 Sincronizando ${config.entity}... (${incremental ? 'incremental' : 'completo'})`);
      const data = await fetchFromAPI(config.apiEndpoint, filter);
      totalRecords = Array.isArray(data) ? data.length : 0;
      console.log(`📦 ${totalRecords} registros encontrados`);

      if (totalRecords === 0) {
        await this.updateSyncCompletion(config.entity, totalRecords);
        return {
          entity: config.entity,
          totalRecords: 0,
          inserted: 0,
          updated: 0,
          errors: 0,
          duration: Date.now() - startTime,
          isIncremental: incremental
        };
      }

      // Processar em chunks para não sobrecarregar o banco
      const chunkSize = config.chunkSize || 500;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        try {
          const result = await this.processChunk(config, chunk);
          inserted += result.inserted;
          updated += result.updated;
        } catch (error) {
          console.error(`Erro ao processar chunk ${i}-${i + chunkSize}:`, error);
          errors += chunk.length;
        }

        // Log de progresso
        const progress = Math.round((i + chunk.length) / totalRecords * 100);
        console.log(`📊 Progresso ${config.entity}: ${progress}%`);
      }

      // Atualizar controle de sincronização
      await this.updateSyncCompletion(config.entity, totalRecords);

      // Log de conclusão
      await UserLogService.create({
        userId: 'system',
        userName: 'Sistema de Sincronização',
        action: incremental ? 'SYNC_INCREMENTAL_COMPLETE' : 'SYNC_FULL_COMPLETE',
        module: 'SYNC',
        details: {
          entity: config.entity,
          totalRecords,
          inserted,
          updated,
          errors,
          duration: Date.now() - startTime
        }
      });

      console.log(`✅ ${config.entity} sincronizado: ${inserted} inseridos, ${updated} atualizados`);

      return {
        entity: config.entity,
        totalRecords,
        inserted,
        updated,
        errors,
        duration: Date.now() - startTime,
        isIncremental: incremental
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.updateSyncStatus(config.entity, 'error', errorMessage);
      
      await UserLogService.create({
        userId: 'system',
        userName: 'Sistema de Sincronização',
        action: 'SYNC_ERROR',
        module: 'SYNC',
        details: {
          entity: config.entity,
          error: errorMessage,
          incremental
        }
      });

      throw error;
    }
  }

  // Processar chunk de dados
  private static async processChunk(
    config: SyncConfig,
    data: unknown[]
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    // Lógica específica por entidade
    switch (config.entity) {
      case 'produtos':
        const produtoResult = await this.upsertProdutos(data as ProdutoFinancesWeb[]);
        inserted = produtoResult.inserted;
        updated = produtoResult.updated;
        break;

      case 'pessoas':
        const pessoaResult = await this.upsertPessoas(data as PessoaFinancesWeb[]);
        inserted = pessoaResult.inserted;
        updated = pessoaResult.updated;
        break;

      case 'operadores':
        const operadorResult = await this.upsertOperadores(data as OperadorFinancesWeb[]);
        inserted = operadorResult.inserted;
        updated = operadorResult.updated;
        break;

      case 'pedidos':
        const pedidoResult = await this.upsertPedidos(data as PedidoFinancesWeb[]);
        inserted = pedidoResult.inserted;
        updated = pedidoResult.updated;
        break;
    }

    return { inserted, updated };
  }

  // Métodos específicos de upsert para cada entidade
  private static async upsertProdutos(produtos: ProdutoFinancesWeb[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const produto of produtos) {
      try {
        const exists = await queryOne(`
          SELECT 1 FROM produtos_financesweb WHERE fnc_pro_id = $1
        `, [produto.fnc_pro_id]);

        if (exists) {
          await query(`
            UPDATE produtos_financesweb
            SET 
              fnc_pro_descricao = $2,
              fnc_pro_codigo = $3,
              fnc_gpr_descricao = $4,
              fnc_pro_preco_venda = $5,
              fnc_pro_status = $6,
              fnc_pro_estoque_atual = $7,
              fnc_pro_estoque_minimo = $8,
              updated_at = NOW()
            WHERE fnc_pro_id = $1
          `, [
            produto.fnc_pro_id,
            produto.fnc_pro_descricao,
            produto.fnc_pro_codigo,
            produto.fnc_gpr_descricao,
            produto.fnc_pro_preco_venda,
            produto.fnc_pro_status,
            produto.fnc_pro_estoque_atual,
            produto.fnc_pro_estoque_minimo
          ]);
          updated++;
        } else {
          await query(`
            INSERT INTO produtos_financesweb (
              fnc_pro_id,
              fnc_pro_descricao,
              fnc_pro_codigo,
              fnc_gpr_descricao,
              fnc_pro_preco_venda,
              fnc_pro_status,
              fnc_pro_estoque_atual,
              fnc_pro_estoque_minimo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            produto.fnc_pro_id,
            produto.fnc_pro_descricao,
            produto.fnc_pro_codigo,
            produto.fnc_gpr_descricao,
            produto.fnc_pro_preco_venda,
            produto.fnc_pro_status,
            produto.fnc_pro_estoque_atual,
            produto.fnc_pro_estoque_minimo
          ]);
          inserted++;
        }
      } catch (error) {
        console.error('Erro ao processar produto:', error);
      }
    }

    return { inserted, updated };
  }

  private static async upsertPessoas(pessoas: PessoaFinancesWeb[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const pessoa of pessoas) {
      try {
        const exists = await queryOne(`
          SELECT 1 FROM pessoas_financesweb WHERE fnc_pes_id = $1
        `, [pessoa.fnc_pes_id]);

        if (exists) {
          await query(`
            UPDATE pessoas_financesweb
            SET 
              fnc_pes_nome_fantasia = $2,
              fnc_pes_razao_social = $3,
              fnc_pes_cpf_cnpj = $4,
              fnc_pes_email = $5,
              fnc_pes_telefone = $6,
              fnc_pes_celular = $7,
              fnc_pes_endereco = $8,
              fnc_pes_numero = $9,
              fnc_pes_complemento = $10,
              fnc_pes_bairro = $11,
              fnc_pes_cidade = $12,
              fnc_pes_uf = $13,
              fnc_pes_cep = $14,
              fnc_pes_tipo_pessoa = $15,
              fnc_pes_status = $16,
              updated_at = NOW()
            WHERE fnc_pes_id = $1
          `, [
            pessoa.fnc_pes_id,
            pessoa.fnc_pes_nome_fantasia,
            pessoa.fnc_pes_razao_social,
            pessoa.fnc_pes_cpf_cnpj,
            pessoa.fnc_pes_email,
            pessoa.fnc_pes_telefone,
            pessoa.fnc_pes_celular,
            pessoa.fnc_pes_endereco,
            pessoa.fnc_pes_numero,
            pessoa.fnc_pes_complemento,
            pessoa.fnc_pes_bairro,
            pessoa.fnc_pes_cidade,
            pessoa.fnc_pes_uf,
            pessoa.fnc_pes_cep,
            pessoa.fnc_pes_tipo_pessoa,
            pessoa.fnc_pes_status
          ]);
          updated++;
        } else {
          await query(`
            INSERT INTO pessoas_financesweb (
              fnc_pes_id,
              fnc_pes_nome_fantasia,
              fnc_pes_razao_social,
              fnc_pes_cpf_cnpj,
              fnc_pes_email,
              fnc_pes_telefone,
              fnc_pes_celular,
              fnc_pes_endereco,
              fnc_pes_numero,
              fnc_pes_complemento,
              fnc_pes_bairro,
              fnc_pes_cidade,
              fnc_pes_uf,
              fnc_pes_cep,
              fnc_pes_tipo_pessoa,
              fnc_pes_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          `, [
            pessoa.fnc_pes_id,
            pessoa.fnc_pes_nome_fantasia,
            pessoa.fnc_pes_razao_social,
            pessoa.fnc_pes_cpf_cnpj,
            pessoa.fnc_pes_email,
            pessoa.fnc_pes_telefone,
            pessoa.fnc_pes_celular,
            pessoa.fnc_pes_endereco,
            pessoa.fnc_pes_numero,
            pessoa.fnc_pes_complemento,
            pessoa.fnc_pes_bairro,
            pessoa.fnc_pes_cidade,
            pessoa.fnc_pes_uf,
            pessoa.fnc_pes_cep,
            pessoa.fnc_pes_tipo_pessoa,
            pessoa.fnc_pes_status
          ]);
          inserted++;
        }
      } catch (error) {
        console.error('Erro ao processar pessoa:', error);
      }
    }

    return { inserted, updated };
  }

  private static async upsertOperadores(operadores: OperadorFinancesWeb[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const operador of operadores) {
      try {
        const exists = await queryOne(`
          SELECT 1 FROM operadores_financesweb WHERE fnc_ope_id = $1
        `, [operador.fnc_ope_id]);

        if (exists) {
          await query(`
            UPDATE operadores_financesweb
            SET 
              fnc_ope_nome = $2,
              fnc_ope_email = $3,
              fnc_ope_telefone = $4,
              fnc_ope_ativo = $5,
              updated_at = NOW()
            WHERE fnc_ope_id = $1
          `, [
            operador.fnc_ope_id,
            operador.fnc_ope_nome,
            operador.fnc_ope_email,
            operador.fnc_ope_telefone,
            operador.fnc_ope_ativo
          ]);
          updated++;
        } else {
          await query(`
            INSERT INTO operadores_financesweb (
              fnc_ope_id,
              fnc_ope_nome,
              fnc_ope_email,
              fnc_ope_telefone,
              fnc_ope_ativo
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            operador.fnc_ope_id,
            operador.fnc_ope_nome,
            operador.fnc_ope_email,
            operador.fnc_ope_telefone,
            operador.fnc_ope_ativo
          ]);
          inserted++;
        }
      } catch (error) {
        console.error('Erro ao processar operador:', error);
      }
    }

    return { inserted, updated };
  }

  private static async upsertPedidos(pedidos: PedidoFinancesWeb[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const pedido of pedidos) {
      try {
        const exists = await queryOne(`
          SELECT 1 FROM pedidos_financesweb WHERE fnc_ped_id = $1
        `, [pedido.fnc_ped_id]);

        if (exists) {
          await query(`
            UPDATE pedidos_financesweb
            SET 
              fnc_ped_numero = $2,
              fnc_pes_id = $3,
              fnc_ped_data_emissao = $4,
              fnc_ped_valor_total = $5,
              fnc_ped_status = $6,
              fnc_ped_observacao = $7,
              fnc_ped_data_modificacao = $8,
              fnc_ped_peso_total = $9,
              fnc_ped_qtd_itens = $10,
              updated_at = NOW()
            WHERE fnc_ped_id = $1
          `, [
            pedido.fnc_ped_id,
            pedido.fnc_ped_numero,
            pedido.fnc_pes_id,
            pedido.fnc_ped_data_emissao,
            pedido.fnc_ped_valor_total,
            pedido.fnc_ped_status,
            pedido.fnc_ped_observacao,
            pedido.fnc_ped_data_modificacao,
            pedido.fnc_ped_peso_total,
            pedido.fnc_ped_qtd_itens
          ]);
          updated++;
        } else {
          await query(`
            INSERT INTO pedidos_financesweb (
              fnc_ped_id,
              fnc_ped_numero,
              fnc_pes_id,
              fnc_ped_data_emissao,
              fnc_ped_valor_total,
              fnc_ped_status,
              fnc_ped_observacao,
              fnc_ped_data_modificacao,
              fnc_ped_peso_total,
              fnc_ped_qtd_itens
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            pedido.fnc_ped_id,
            pedido.fnc_ped_numero,
            pedido.fnc_pes_id,
            pedido.fnc_ped_data_emissao,
            pedido.fnc_ped_valor_total,
            pedido.fnc_ped_status,
            pedido.fnc_ped_observacao,
            pedido.fnc_ped_data_modificacao,
            pedido.fnc_ped_peso_total,
            pedido.fnc_ped_qtd_itens
          ]);
          inserted++;
        }
      } catch (error) {
        console.error('Erro ao processar pedido:', error);
      }
    }

    return { inserted, updated };
  }

  // Obter última data de sincronização
  private static async getLastSyncDate(entity: string): Promise<Date | null> {
    const result = await queryOne<{ last_sync_date: Date | null }>(`
      SELECT last_sync_date FROM sync_control WHERE entity = $1
    `, [entity]);

    return result?.last_sync_date || null;
  }

  // Atualizar conclusão da sincronização
  private static async updateSyncCompletion(entity: string, recordCount: number): Promise<void> {
    await query(`
      UPDATE sync_control
      SET 
        last_sync_date = NOW(),
        last_record_date = NOW(),
        record_count = record_count + $2,
        status = 'completed',
        last_error = NULL,
        updated_at = NOW()
      WHERE entity = $1
    `, [entity, recordCount]);
  }
}

export { SyncService };