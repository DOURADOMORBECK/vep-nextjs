'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { localApi } from '@/lib/local-api';

interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'PJ' | 'PF';
  document: string; // CNPJ ou CPF
  email: string;
  phone: string;
  whatsapp: string;
  contact: string; // Pessoa de contato
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  categories: string[]; // Categorias de produtos fornecidos
  paymentTerms: string; // Condições de pagamento
  deliveryDays: number[]; // Dias de entrega (0=Dom, 1=Seg, etc)
  minimumOrder: number; // Pedido mínimo
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PJ' as 'PJ' | 'PF',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
    contact: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    categories: [] as string[],
    paymentTerms: '',
    deliveryDays: [] as number[],
    minimumOrder: 0,
    active: true
  });

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const productCategories = [
    'Frutas',
    'Verduras',
    'Legumes',
    'Grãos',
    'Laticínios',
    'Carnes',
    'Bebidas',
    'Congelados',
    'Padaria',
    'Mercearia',
    'Limpeza',
    'Descartáveis',
    'Embalagens',
    'Outros'
  ];

  const weekDays = [
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' }
  ];

  const paymentTermsOptions = [
    'À vista',
    '7 dias',
    '14 dias',
    '21 dias',
    '28 dias',
    '30 dias',
    '30/60 dias',
    '30/60/90 dias',
    'Negociável'
  ];

  // Buscar fornecedores
  useEffect(() => {
    fetchSuppliers();
    logUserAction('VIEW_SUPPLIERS_PAGE');
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await localApi.getSuppliers();
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        console.error('Erro ao buscar fornecedores:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  const logUserAction = async (action: string, details?: unknown) => {
    try {
      await railwayApi.logUserAction(action, { ...(details as Record<string, unknown> || {}), module: 'SUPPLIERS' });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  // const generateSupplierCode = () => {
  //   const prefix = 'FOR';
  //   const date = new Date();
  //   const year = date.getFullYear().toString().slice(-2);
  //   const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  //   return `${prefix}${year}${random}`;
  // };

  const formatDocument = (doc: string, type: 'PJ' | 'PF') => {
    const cleaned = doc.replace(/\D/g, '');
    if (type === 'PJ' && cleaned.length === 14) {
      return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12, 14)}`;
    } else if (type === 'PF' && cleaned.length === 11) {
      return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
    }
    return doc;
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
    }
    return phone;
  };

  const formatZipCode = (zipCode: string) => {
    const cleaned = zipCode.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 8)}`;
    }
    return zipCode;
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Transform data to match API expected format
      const supplierData = {
        tipo_pessoa: formData.type,
        nome_fantasia: formData.name,
        razao_social: formData.name,
        cpf: formData.type === 'PF' ? formData.document.replace(/\D/g, '') : undefined,
        cnpj: formData.type === 'PJ' ? formData.document.replace(/\D/g, '') : undefined,
        cep: formData.zipCode.replace(/\D/g, ''),
        endereco: formData.address,
        numero: formData.number,
        complemento: formData.complement,
        bairro: formData.neighborhood,
        cidade: formData.city,
        uf: formData.state,
        telefone_1: formData.phone.replace(/\D/g, ''),
        celular: formData.whatsapp.replace(/\D/g, ''),
        email: formData.email,
        contato: formData.contact,
        status: formData.active ? 'ATIVO' : 'INATIVO'
      };

      if (editingSupplier) {
        const response = await railwayApi.updateSupplier(editingSupplier.id, supplierData);
        if (response.ok) {
          const updatedSupplier = await response.json();
          setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updatedSupplier : s));
          logUserAction('UPDATE_SUPPLIER', { supplierId: editingSupplier.id, ...supplierData });
          alert('Fornecedor atualizado com sucesso!');
        } else {
          alert('Erro ao atualizar fornecedor');
        }
      } else {
        const response = await railwayApi.createSupplier(supplierData);
        if (response.ok) {
          const newSupplier = await response.json();
          setSuppliers([...suppliers, newSupplier]);
          logUserAction('CREATE_SUPPLIER', newSupplier);
          alert('Fornecedor cadastrado com sucesso!');
        } else {
          alert('Erro ao cadastrar fornecedor');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor. Tente novamente.');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      type: supplier.type,
      document: supplier.document,
      email: supplier.email,
      phone: supplier.phone,
      whatsapp: supplier.whatsapp,
      contact: supplier.contact,
      address: supplier.address,
      number: supplier.number,
      complement: supplier.complement,
      neighborhood: supplier.neighborhood,
      city: supplier.city,
      state: supplier.state,
      zipCode: supplier.zipCode,
      categories: supplier.categories,
      paymentTerms: supplier.paymentTerms,
      deliveryDays: supplier.deliveryDays,
      minimumOrder: supplier.minimumOrder,
      active: supplier.active
    });
    setIsModalOpen(true);
    logUserAction('OPEN_EDIT_SUPPLIER', { supplierId: supplier.id });
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        const response = await railwayApi.deleteSupplier(supplierId);
        if (response.ok) {
          setSuppliers(suppliers.filter(s => s.id !== supplierId));
          logUserAction('DELETE_SUPPLIER', { supplierId });
          alert('Fornecedor excluído com sucesso!');
        } else {
          alert('Erro ao excluir fornecedor');
        }
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        alert('Erro ao excluir fornecedor. Tente novamente.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData({
      code: '',
      name: '',
      type: 'PJ',
      document: '',
      email: '',
      phone: '',
      whatsapp: '',
      contact: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      categories: [],
      paymentTerms: '',
      deliveryDays: [],
      minimumOrder: 0,
      active: true
    });
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDeliveryDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      deliveryDays: prev.deliveryDays.includes(day)
        ? prev.deliveryDays.filter(d => d !== day)
        : [...prev.deliveryDays, day].sort((a, b) => a - b)
    }));
  };

  // Filtros e paginação
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.document.includes(searchTerm) ||
                         supplier.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || supplier.type === selectedType;
    const matchesCategory = !selectedCategory || supplier.categories.includes(selectedCategory);
    return matchesSearch && matchesType && matchesCategory;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDeliveryDaysText = (days: number[]) => {
    if (days.length === 0) return 'Não definido';
    if (days.length === 7) return 'Todos os dias';
    return days.map(d => weekDays.find(w => w.value === d)?.label || '').join(', ');
  };

  return (
    <DashboardLayout title="Cadastro de Fornecedores" subtitle="Gerenciar fornecedores e suas informações">
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
                  placeholder="Buscar por nome, código, documento ou contato..."
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Todos os Tipos</option>
              <option value="PJ">Pessoa Jurídica</option>
              <option value="PF">Pessoa Física</option>
            </select>
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              {productCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                logUserAction('OPEN_CREATE_SUPPLIER');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Fornecedor
            </button>
          </div>
        </div>

        {/* Tabela de Fornecedores */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">Código</th>
                  <th className="px-6 py-3 text-left font-medium">Fornecedor</th>
                  <th className="px-6 py-3 text-left font-medium">Contato</th>
                  <th className="px-6 py-3 text-left font-medium">Categorias</th>
                  <th className="px-6 py-3 text-left font-medium">Pagamento</th>
                  <th className="px-6 py-3 text-left font-medium">Entregas</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">{supplier.code}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{supplier.name}</div>
                        <div className="text-xs text-gray-400">
                          {supplier.type === 'PJ' ? 'CNPJ' : 'CPF'}: {formatDocument(supplier.document, supplier.type)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white">{supplier.contact}</div>
                        <div className="text-gray-400">{formatPhone(supplier.phone)}</div>
                        <div className="text-gray-400 text-xs">{supplier.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories.slice(0, 3).map((cat, idx) => (
                          <span key={idx} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
                            {cat}
                          </span>
                        ))}
                        {supplier.categories.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
                            +{supplier.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white">{supplier.paymentTerms}</div>
                        <div className="text-xs text-gray-400">
                          Mín: R$ {supplier.minimumOrder.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {getDeliveryDaysText(supplier.deliveryDays)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        supplier.active 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {supplier.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} de {filteredSuppliers.length} fornecedores
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
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Código
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="Deixe vazio para gerar automaticamente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="PJ"
                          checked={formData.type === 'PJ'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'PJ' | 'PF', document: ''})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-300">Pessoa Jurídica</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="PF"
                          checked={formData.type === 'PF'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'PJ' | 'PF', document: ''})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-300">Pessoa Física</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {formData.type === 'PJ' ? 'CNPJ' : 'CPF'} *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formatDocument(formData.document, formData.type)}
                      onChange={(e) => setFormData({...formData, document: e.target.value.replace(/\D/g, '')})}
                      maxLength={formData.type === 'PJ' ? 18 : 14}
                      placeholder={formData.type === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome/Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pessoa de Contato *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formatPhone(formData.phone)}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formatPhone(formData.whatsapp)}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value.replace(/\D/g, '')})}
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <h3 className="text-lg font-medium text-white mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CEP *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formatZipCode(formData.zipCode)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, zipCode: value});
                        if (value.length === 8) {
                          fetchAddressByCEP(value);
                        }
                      }}
                      maxLength={9}
                      placeholder="00000-000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estado *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Endereço *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.complement}
                      onChange={(e) => setFormData({...formData, complement: e.target.value})}
                    />
                  </div>
                </div>

                {/* Informações Comerciais */}
                <h3 className="text-lg font-medium text-white mb-4">Informações Comerciais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Condições de Pagamento *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {paymentTermsOptions.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pedido Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.minimumOrder}
                      onChange={(e) => setFormData({...formData, minimumOrder: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Categorias de Produtos */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categorias de Produtos Fornecidos
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {productCategories.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                        />
                        <span className="text-sm text-gray-300">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dias de Entrega */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dias de Entrega
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {weekDays.map(day => (
                      <label key={day.value} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                          checked={formData.deliveryDays.includes(day.value)}
                          onChange={() => handleDeliveryDayToggle(day.value)}
                        />
                        <span className="text-sm text-gray-300">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    />
                    <span className="text-sm text-gray-300">Fornecedor Ativo</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
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
                    {editingSupplier ? 'Atualizar' : 'Cadastrar'}
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