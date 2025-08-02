import { ProdutoFinancesweb } from '@/services/database/financesweb/produtoFinanceswebService';
import { OperadorFinancesweb } from '@/services/database/financesweb/operadorFinanceswebService';
import { PessoaFinancesweb } from '@/services/database/financesweb/pessoaFinanceswebService';
import { PedidoDetalheFinancesweb } from '@/services/database/financesweb/pedidoDetalheFinanceswebService';

export type EntityData = ProdutoFinancesweb | OperadorFinancesweb | PessoaFinancesweb | PedidoDetalheFinancesweb;

export interface SyncResult {
  inseridos: number;
  atualizados: number;
  erros: number;
}

export interface EntityResult extends Partial<SyncResult> {
  total?: number;
  status: 'success' | 'error';
  error?: string;
}

export interface SyncResponse {
  timestamp: string;
  results: Record<string, EntityResult>;
  errors: Array<{
    entity: string;
    error: string;
  }>;
  success: boolean;
}

export interface BaseService {
  createTable(): Promise<void>;
  upsertMany(data: EntityData[]): Promise<SyncResult>;
}