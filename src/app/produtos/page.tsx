'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { railwayApi } from '@/lib/api-interceptor';
import { useUserLogger, USER_ACTIONS, MODULES } from '@/hooks/useUserLogger';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
  barcode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProdutosPage() {
  const { logAction } = useUserLogger();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'UN',
    price: 0,
    stock: 0,
    minStock: 0,
    supplier: '',
    barcode: '',
    active: true
  });

  const categories = [
    'Frutas',
    'Verduras',
    'Legumes',
    'Grãos',
    'Laticínios',
    'Carnes',
    'Bebidas',
    'Outros'
  ];

  const units = [
    { value: 'UN', label: 'Unidade' },
    { value: 'KG', label: 'Quilograma' },
    { value: 'G', label: 'Grama' },
    { value: 'L', label: 'Litro' },
    { value: 'ML', label: 'Mililitro' },
    { value: 'CX', label: 'Caixa' },
    { value: 'PCT', label: 'Pacote' },
    { value: 'DZ', label: 'Dúzia' }
  ];

  // Buscar produtos da API Railway
  useEffect(() => {
    fetchProducts();
    // Log de acesso à página
    logUserAction('VIEW_PRODUCTS_PAGE');
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await railwayApi.getProducts();
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Erro ao buscar produtos:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const logUserAction = async (action: string, details?: unknown) => {
    try {
      await railwayApi.logUserAction(action, { ...(details as Record<string, unknown> || {}), module: 'PRODUCTS' });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        // Atualizar produto via API
        const response = await railwayApi.updateProduct(editingProduct.id, formData);
        if (response.ok) {
          const updatedProduct = await response.json();
          setProducts(products.map(p => 
            p.id === editingProduct.id ? updatedProduct : p
          ));
          logAction({ 
            action: USER_ACTIONS.UPDATE_PRODUCT,
            module: MODULES.PRODUCTS,
            details: { productId: editingProduct.id, ...formData }
          });
          alert('Produto atualizado com sucesso!');
        } else {
          alert('Erro ao atualizar produto');
        }
      } else {
        // Criar novo produto via API
        const response = await railwayApi.createProduct(formData);
        if (response.ok) {
          const newProduct = await response.json();
          setProducts([...products, newProduct]);
          logAction({ 
            action: USER_ACTIONS.CREATE_PRODUCT,
            module: MODULES.PRODUCTS,
            details: newProduct
          });
          alert('Produto cadastrado com sucesso!');
        } else {
          alert('Erro ao cadastrar produto');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description,
      category: product.category,
      unit: product.unit,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      supplier: product.supplier,
      barcode: product.barcode,
      active: product.active
    });
    setIsModalOpen(true);
    logAction({ 
      action: USER_ACTIONS.VIEW,
      module: MODULES.PRODUCTS,
      details: { productId: product.id, action: 'open_edit' }
    });
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await railwayApi.deleteProduct(productId);
        if (response.ok) {
          setProducts(products.filter(p => p.id !== productId));
          logAction({ 
            action: USER_ACTIONS.DELETE_PRODUCT,
            module: MODULES.PRODUCTS,
            details: { productId }
          });
          alert('Produto excluído com sucesso!');
        } else {
          alert('Erro ao excluir produto');
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      unit: 'UN',
      price: 0,
      stock: 0,
      minStock: 0,
      supplier: '',
      barcode: '',
      active: true
    });
  };

  // Filtros e paginação
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout title="Cadastro de Produtos" subtitle="Gerenciar produtos do estoque">
      <div className="p-6">
        {/* Header com Filtros */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-search text-gray-500"></i>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome, código ou código de barras..."
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                logUserAction('OPEN_CREATE_PRODUCT');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Produto
            </button>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">Código</th>
                  <th className="px-6 py-3 text-left font-medium">Nome</th>
                  <th className="px-6 py-3 text-left font-medium">Categoria</th>
                  <th className="px-6 py-3 text-left font-medium">Preço</th>
                  <th className="px-6 py-3 text-left font-medium">Estoque</th>
                  <th className="px-6 py-3 text-left font-medium">Unidade</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">{product.code}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{product.name}</div>
                        <div className="text-xs text-gray-400">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          product.stock <= product.minStock ? 'text-red-400' : 'text-white'
                        }`}>
                          {product.stock} {product.unit}
                        </span>
                        {product.stock <= product.minStock && (
                          <i className="fa-solid fa-exclamation-triangle text-red-400 text-xs ml-2"></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{product.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.active 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Excluir"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-6 py-3 bg-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} produtos
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <span className="px-3 py-1 text-white">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Código *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unidade *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estoque Atual
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fornecedor
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      />
                      <span className="text-sm text-gray-300">Produto Ativo</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                  >
                    {editingProduct ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}