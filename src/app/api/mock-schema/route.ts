import { NextResponse } from 'next/server';

// Mock schema based on Railway production errors
// This helps us fix the column mapping issues even without database access
export async function GET() {
  const mockSchema = {
    connection: true,
    tables: ['pessoas_financesweb', 'produtos_financesweb'],
    schemas: {
      pessoas_financesweb: {
        columns: [
          // Based on error messages, these columns DON'T exist:
          // - fnc_pes_tipo_pessoa
          // - fnc_pes_razao_social
          // - fnc_pes_telefone
          // - fnc_pes_tipo
          
          // These likely exist based on the query patterns:
          { column_name: 'fnc_pes_id', data_type: 'integer' },
          { column_name: 'fnc_pes_nome_fantasia', data_type: 'character varying' },
          { column_name: 'fnc_pes_email', data_type: 'character varying' },
          { column_name: 'fnc_pes_cpf_cnpj', data_type: 'character varying' },
          { column_name: 'fnc_pes_cidade', data_type: 'character varying' },
          { column_name: 'fnc_pes_uf', data_type: 'character varying' },
          { column_name: 'fnc_pes_status', data_type: 'character varying' },
          { column_name: 'fnc_pes_ativo', data_type: 'boolean' },
          
          // Possible alternative columns (guessing based on common patterns):
          { column_name: 'fnc_pes_telefone_principal', data_type: 'character varying' },
          { column_name: 'fnc_pes_cliente', data_type: 'boolean' },
          { column_name: 'fnc_pes_fornecedor', data_type: 'boolean' },
          
          // Standard timestamps
          { column_name: 'created_at', data_type: 'timestamp' },
          { column_name: 'updated_at', data_type: 'timestamp' }
        ],
        recordCount: 0,
        sample: null
      },
      produtos_financesweb: {
        columns: [
          { column_name: 'fnc_pro_id', data_type: 'integer' },
          { column_name: 'fnc_pro_codigo_automacao', data_type: 'character varying' },
          { column_name: 'fnc_pro_descricao', data_type: 'character varying' },
          { column_name: 'fnc_gpr_descricao', data_type: 'character varying' },
          { column_name: 'fnc_uni_codigo', data_type: 'character varying' },
          { column_name: 'fnc_pro_preco_venda', data_type: 'numeric' },
          { column_name: 'fnc_pro_estoque_atual', data_type: 'numeric' },
          { column_name: 'fnc_pro_estoque_minimo', data_type: 'numeric' },
          { column_name: 'fnc_pro_ativo', data_type: 'boolean' }
        ],
        recordCount: 74,
        sample: {
          fnc_pro_id: 1,
          fnc_pro_codigo_automacao: 'PROD001',
          fnc_pro_descricao: 'Sample Product',
          fnc_gpr_descricao: 'Category',
          fnc_uni_codigo: 'UN',
          fnc_pro_preco_venda: 100.00,
          fnc_pro_estoque_atual: 50,
          fnc_pro_estoque_minimo: 10,
          fnc_pro_ativo: true
        }
      }
    },
    queries: {
      products: {
        success: true,
        count: 74,
        sample: { id: 1, name: 'Sample Product' }
      },
      customers: {
        success: false,
        error: 'column "fnc_pes_tipo_pessoa" does not exist'
      }
    },
    stats: {
      products: 74,
      customers: { error: 'column "fnc_pes_tipo" does not exist' },
      operators: 0,
      orders: 0
    },
    errors: [
      { step: 'customers_query', error: 'column "fnc_pes_tipo_pessoa" does not exist' },
      { step: 'customers_stats', error: 'column "fnc_pes_tipo" does not exist' }
    ]
  };

  return NextResponse.json(mockSchema, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}