'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/common/EmptyState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { useSmartData } from '@/hooks/useSmartData';
import { useUserLogger, USER_ACTIONS, MODULES } from '@/hooks/useUserLogger';
import toast from 'react-hot-toast';

interface Customer {
  fnc_pes_id: number;
  fnc_pes_nome_fantasia: string;
  fnc_pes_razao_social: string;
  fnc_pes_cpf_cnpj: string;
  fnc_pes_email: string;
  fnc_pes_telefone: string;
  fnc_pes_cidade: string;
  fnc_pes_uf: string;
  fnc_pes_status: string;
  fnc_pes_endereco?: string;
}

// Sem dados de demonstração - apenas dados reais do banco

export default function ClientesPageV2() {
  const { logAction } = useUserLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  
  // Usar o hook inteligente de dados
  const { 
    data: customers, 
    loading, 
    isDemo, 
    sync,
    refresh 
  } = useSmartData<Customer>({
    endpoint: '/api/clientes',
    fallbackData: [], // Sem dados de demonstração
    showToasts: true
  });

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.fnc_pes_nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.fnc_pes_razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.fnc_pes_cpf_cnpj.includes(searchTerm);
    
    const matchesStatus = !selectedStatus || customer.fnc_pes_status === selectedStatus;
    const matchesState = !selectedState || customer.fnc_pes_uf === selectedState;
    
    return matchesSearch && matchesStatus && matchesState;
  });

  // Estados únicos
  const states = [...new Set(customers.map(c => c.fnc_pes_uf))].sort();

  // Função para sincronizar
  const handleSync = async () => {
    setSyncLoading(true);
    logAction({ 
      action: USER_ACTIONS.SYNC_DATA, 
      module: MODULES.CLIENTS,
      details: { entity: 'clientes' }
    });
    
    try {
      await sync();
      await refresh();
    } finally {
      setSyncLoading(false);
    }
  };

  // Função para ver detalhes
  const handleViewDetails = (customer: Customer) => {
    logAction({ 
      action: USER_ACTIONS.VIEW, 
      module: MODULES.CLIENTS,
      details: { customerId: customer.fnc_pes_id }
    });
    toast('Detalhes do cliente em desenvolvimento');
  };

  // Função para enviar email
  const handleSendEmail = (customer: Customer) => {
    window.location.href = `mailto:${customer.fnc_pes_email}`;
  };

  // Função para ligar
  const handleCall = (customer: Customer) => {
    window.location.href = `tel:${customer.fnc_pes_telefone}`;
  };

  // Formatar CNPJ
  const formatCNPJ = (cnpj: string) => {
    // Remove caracteres não numéricos
    const cleaned = cnpj.replace(/\D/g, '');
    
    // Aplica máscara
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    return cnpj;
  };

  return (
    <DashboardLayout title="Clientes" subtitle="Gerencie sua base de clientes">
      <div className="p-6">
        {/* Header com ações */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:w-auto">
            {/* Busca */}
            <div className="relative flex-1 md:max-w-md">
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>

            {/* Filtro por status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Todos os status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>

            {/* Filtro por estado */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Todos os estados</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={() => toast('Adicionar cliente em desenvolvimento')}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Novo Cliente
            </button>
            
            {isDemo && (
              <button
                onClick={handleSync}
                disabled={syncLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <i className={`fas ${syncLoading ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i>
                Sincronizar
              </button>
            )}
          </div>
        </div>

        {/* Indicador de dados demo */}
        {isDemo && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <i className="fas fa-info-circle text-yellow-500"></i>
            <div className="flex-1">
              <p className="text-yellow-200">
                Mostrando dados de demonstração. 
                <button 
                  onClick={handleSync}
                  className="ml-2 text-yellow-400 hover:text-yellow-300 underline"
                >
                  Sincronize para obter dados reais do ERP
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        <div className="relative">
          <LoadingOverlay show={loading} message="Carregando clientes..." />
          
          {/* Conteúdo */}
          {!loading && (
            <>
              {filteredCustomers.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title={searchTerm || selectedStatus || selectedState ? "Nenhum cliente encontrado" : "Sem clientes cadastrados"}
                  description={
                    searchTerm || selectedStatus || selectedState 
                      ? "Tente ajustar os filtros de busca"
                      : "Sincronize com o ERP para importar seus clientes"
                  }
                  action={!isDemo ? {
                    label: "Sincronizar Agora",
                    onClick: handleSync,
                    loading: syncLoading
                  } : undefined}
                  secondaryAction={{
                    label: "Adicionar Cliente",
                    onClick: () => toast('Em desenvolvimento')
                  }}
                />
              ) : (
                <div className="grid gap-4">
                  {filteredCustomers.map((customer) => (
                    <div 
                      key={customer.fnc_pes_id} 
                      className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        {/* Informações principais */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {customer.fnc_pes_nome_fantasia}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {customer.fnc_pes_razao_social}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              customer.fnc_pes_status === 'Ativo' 
                                ? 'bg-green-900/20 text-green-400 border border-green-600/30'
                                : 'bg-red-900/20 text-red-400 border border-red-600/30'
                            }`}>
                              {customer.fnc_pes_status}
                            </span>
                          </div>

                          {/* Detalhes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <i className="fas fa-id-card text-gray-500 w-4"></i>
                              <span className="text-gray-300">{formatCNPJ(customer.fnc_pes_cpf_cnpj)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <i className="fas fa-map-marker-alt text-gray-500 w-4"></i>
                              <span className="text-gray-300">
                                {customer.fnc_pes_cidade}/{customer.fnc_pes_uf}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <i className="fas fa-envelope text-gray-500 w-4"></i>
                              <a 
                                href={`mailto:${customer.fnc_pes_email}`}
                                className="text-primary-400 hover:text-primary-300"
                              >
                                {customer.fnc_pes_email}
                              </a>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <i className="fas fa-phone text-gray-500 w-4"></i>
                              <a 
                                href={`tel:${customer.fnc_pes_telefone}`}
                                className="text-primary-400 hover:text-primary-300"
                              >
                                {customer.fnc_pes_telefone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-row md:flex-col gap-2 justify-end">
                          <button
                            onClick={() => handleViewDetails(customer)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          <button
                            onClick={() => handleSendEmail(customer)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Enviar email"
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                          
                          <button
                            onClick={() => handleCall(customer)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Ligar"
                          >
                            <i className="fas fa-phone"></i>
                          </button>
                          
                          <button
                            onClick={() => toast('Edição em desenvolvimento')}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}