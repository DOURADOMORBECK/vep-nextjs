'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/common/EmptyState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { useSmartData } from '@/hooks/useSmartData';
import { useUserLogger, USER_ACTIONS, MODULES } from '@/hooks/useUserLogger';
import toast from 'react-hot-toast';

interface Product {
  fnc_pro_id: number;
  fnc_pro_descricao: string;
  fnc_pro_codigo: string;
  fnc_gpr_descricao: string;
  fnc_pro_preco_venda: number;
  fnc_pro_status: string;
  fnc_pro_estoque_atual: number;
  fnc_pro_estoque_minimo?: number;
}

// Sem dados de demonstração - apenas dados reais do banco

export default function ProdutosPageV2() {
  const { logAction } = useUserLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  
  // Usar o hook inteligente de dados
  const { 
    data: products, 
    loading, 
    isDemo, 
    sync,
    refresh 
  } = useSmartData<Product>({
    endpoint: '/api/produtos',
    fallbackData: [], // Sem dados de demonstração
    showToasts: true
  });

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.fnc_pro_descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.fnc_pro_codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.fnc_gpr_descricao === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Categorias únicas
  const categories = [...new Set(products.map(p => p.fnc_gpr_descricao))];

  // Função para sincronizar
  const handleSync = async () => {
    setSyncLoading(true);
    logAction({ 
      action: USER_ACTIONS.SYNC_DATA, 
      module: MODULES.PRODUCTS,
      details: { entity: 'produtos' }
    });
    
    try {
      await sync();
      await refresh();
    } finally {
      setSyncLoading(false);
    }
  };

  // Função para editar produto
  const handleEdit = (product: Product) => {
    logAction({ 
      action: USER_ACTIONS.VIEW, 
      module: MODULES.PRODUCTS,
      details: { productId: product.fnc_pro_id }
    });
    toast('Edição de produtos em desenvolvimento');
  };

  // Função para exportar
  const handleExport = () => {
    toast('Exportação será implementada em breve');
  };

  return (
    <DashboardLayout title="Produtos" subtitle="Gerencie seu catálogo de produtos">
      <div className="p-6">
        {/* Header com ações */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:w-auto">
            {/* Busca */}
            <div className="relative flex-1 md:max-w-xs">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>

            {/* Filtro por categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Exportar
            </button>
            
            {isDemo && (
              <button
                onClick={handleSync}
                disabled={syncLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
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
                  Clique aqui para sincronizar dados reais
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        <div className="relative">
          <LoadingOverlay show={loading} message="Carregando produtos..." />
          
          {/* Conteúdo */}
          {!loading && (
            <>
              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon="📦"
                  title={searchTerm || selectedCategory ? "Nenhum produto encontrado" : "Sem produtos cadastrados"}
                  description={
                    searchTerm || selectedCategory 
                      ? "Tente ajustar os filtros de busca"
                      : "Sincronize com o ERP para importar seus produtos"
                  }
                  action={!isDemo ? {
                    label: "Sincronizar Agora",
                    onClick: handleSync,
                    loading: syncLoading
                  } : undefined}
                />
              ) : (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Código
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Categoria
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Preço
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Estoque
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {filteredProducts.map((product) => (
                          <tr key={product.fnc_pro_id} className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {product.fnc_pro_codigo}
                            </td>
                            <td className="px-6 py-4 text-sm text-white">
                              {product.fnc_pro_descricao}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-700">
                                {product.fnc_gpr_descricao}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              R$ {product.fnc_pro_preco_venda.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`${
                                product.fnc_pro_estoque_atual < (product.fnc_pro_estoque_minimo || 0)
                                  ? 'text-red-400'
                                  : 'text-green-400'
                              }`}>
                                {product.fnc_pro_estoque_atual}
                              </span>
                              {product.fnc_pro_estoque_minimo && (
                                <span className="text-gray-500 ml-1">
                                  / {product.fnc_pro_estoque_minimo}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.fnc_pro_status === 'Ativo' || product.fnc_pro_status === '2'
                                  ? 'bg-green-900/20 text-green-400 border border-green-600/30'
                                  : 'bg-red-900/20 text-red-400 border border-red-600/30'
                              }`}>
                                {product.fnc_pro_status === '2' ? 'Ativo' : product.fnc_pro_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}