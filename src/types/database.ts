// Database table types based on PostgreSQL schema

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
  login_attempts?: number;
  locked_until?: Date;
}

export interface FncOperador {
  fnc_ope_id: number;
  fnc_emp_id?: number;
  fnc_ope_tipo_usuario?: string;
  fnc_ope_nome?: string;
  fnc_ope_status?: string;
  fnc_ope_comissao_vendas?: number;
  fnc_ope_limite_desconto?: number;
  fnc_ope_dh_atualizacao?: Date;
}

export interface FncPessoa {
  fnc_pes_id: number;
  fnc_emp_id?: number;
  fnc_pes_data_cadastro?: Date;
  fnc_pes_tipo_cadastro?: string;
  fnc_pes_tipo_pessoa?: string;
  fnc_pes_nome_fantasia?: string;
  fnc_pes_razao_social?: string;
  fnc_pes_cpf?: string;
  fnc_pes_cnpj?: string;
  fnc_pes_ie?: string;
  fnc_pes_insc_municipal?: string;
  fnc_pes_insc_suframa?: string;
  fnc_pes_insc_produtor?: string;
  fnc_pes_cep?: string;
  fnc_pes_endereco?: string;
  fnc_pes_numero?: string;
  fnc_pes_complemento?: string;
  fnc_pes_bairro?: string;
  fnc_pes_cidade?: string;
  fnc_pes_uf?: string;
  fnc_pes_latitude?: string;
  fnc_pes_longitude?: string;
  fnc_pes_telefone_1?: string;
  fnc_pes_telefone_2?: string;
  fnc_pes_celular?: string;
  fnc_pes_email?: string;
  fnc_pes_email_financeiro?: string;
  fnc_pes_contato?: string;
  fnc_pes_status?: string;
  fnc_pes_limite_de_credito?: number;
  fnc_pes_dh_atualizacao?: Date;
}

export interface FncProduto {
  fnc_pro_id: string;
  fnc_pro_descricao?: string;
  fnc_pro_codigo_automacao?: string;
  fnc_pro_codigo_referencia?: string;
  fnc_uni_codigo?: string;
  fnc_gpr_descricao?: string;
  fnc_dep_descricao?: string;
  fnc_mar_descricao?: string;
  fnc_emp_id?: string;
  fnc_pro_tipo_cadastro?: string;
  fnc_pro_status?: number;
  fnc_pro_destino?: string;
  fnc_pro_preco_de_custo_final?: number;
  fnc_pro_preco_a_vista?: number;
  fnc_pro_preco_a_prazo?: number;
  fnc_pro_estoque_atual?: number;
  fnc_pro_estoque_minimo?: number;
  fnc_pro_estoque_maximo?: number;
  fnc_pro_dh_atualizacao?: Date;
}

export interface PedidoVendaProduto {
  fnc_pvp_id: number;
  fnc_pve_id?: number;
  fnc_tpe_codigo?: number;
  fnc_tpe_descricao?: string;
  fnc_pve_sequencial_pedido?: number;
  fnc_emp_id?: number;
  fnc_pve_data_emissao?: Date;
  fnc_pve_situacao?: string;
  fnc_pve_data_situacao?: Date;
  fnc_nat_descricao?: string;
  fnc_nat_origem?: string;
  fnc_mod_modelo?: string;
  fnc_mod_descricao?: string;
  fnc_pve_numero_documento?: number;
  fnc_pve_serie_documento?: string;
  fnc_pes_id?: number;
  fnc_pes_nome_fantasia?: string;
  fnc_pes_razao_social?: string;
  fnc_pes_cidade?: string;
  fnc_pes_uf?: string;
  fnc_ope_id?: number;
  fnc_ope_nome?: string;
  fnc_pla_id?: number;
  fnc_pla_descricao?: string;
  fnc_fpg_id?: number;
  fnc_fpg_descricao?: string;
  fnc_pro_id?: number;
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
}

export interface SsxPosition {
  id?: number;
  id_tracked_unit?: string;
  latitude?: number;
  longitude?: number;
  velocity?: number;
  direction?: number;
  time?: Date;
  created_at?: Date;
}

export interface DeliveryRoute {
  id?: number;
  route_name?: string;
  driver_id?: number;
  vehicle_id?: string;
  status?: string;
  start_time?: Date;
  end_time?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuditLog {
  id?: number;
  user_id?: number;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp?: Date;
}

// Additional table types based on API references
export interface Usuario {
  id?: number;
  nome?: string;
  email?: string;
  senha_hash?: string;
  ativo?: boolean;
  criado_em?: Date;
  atualizado_em?: Date;
}

export interface ItensPedidoVenda {
  id?: number;
  pedido_id?: number;
  produto_id?: string;
  quantidade?: number;
  preco_unitario?: number;
  desconto?: number;
  total?: number;
}