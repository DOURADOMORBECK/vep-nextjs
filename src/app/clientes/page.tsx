'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { getClients, createClient, updateClient, deleteClient, type ClientData } from './actions';

// Importar mapa dinamicamente para evitar SSR issues
const ClientMap = dynamic(() => import('@/components/ClientMap'), { ssr: false });

// Use ClientData type from actions instead of defining Client interface

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PF' as 'PF' | 'PJ',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '',
    latitude: -23.550520,
    longitude: -46.633308,
    deliveryNotes: '',
    active: true
  });

  useEffect(() => {
    fetchClients();
    // Log de acesso
    logUserAction('VIEW_CLIENTS_PAGE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300); // Debounce search
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchClients = async () => {
    try {
      const result = await getClients(searchTerm);
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        console.error('Failed to fetch clients:', result.error);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const logUserAction = async (action: string, details?: unknown) => {
    try {
      await fetch('/api/userlogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          details,
          timestamp: new Date().toISOString(),
          userId: 'current-user-id',
          module: 'CLIENTS'
        })
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const formatDocument = (value: string, type: 'PF' | 'PJ') => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'PF') {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
  };

  const searchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          
          // Buscar coordenadas do endereço
          geocodeAddress();
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const geocodeAddress = async () => {
    // TODO: Integrate with real geocoding API
    // For now, leave coordinates empty - should be filled manually
    console.warn('Geocoding not implemented - please add coordinates manually');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        const result = await updateClient(editingClient.id, formData);
        if (result.success && result.data) {
          const updatedClients = clients.map(c => 
            c.id === editingClient.id ? result.data : c
          );
          setClients(updatedClients);
          logUserAction('UPDATE_CLIENT', { clientId: editingClient.id, ...formData });
        } else {
          console.error('Failed to update client:', result.error);
          alert('Erro ao atualizar cliente');
        }
      } else {
        const result = await createClient({
          ...formData,
          code: formData.code || Date.now().toString()
        });
        if (result.success && result.data) {
          setClients([...clients, result.data]);
          logUserAction('CREATE_CLIENT', result.data);
        } else {
          console.error('Failed to create client:', result.error);
          alert('Erro ao criar cliente');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting client:', error);
      alert('Erro ao processar solicitação');
    }
  };

  const handleEdit = (client: ClientData) => {
    setEditingClient(client);
    setFormData({
      code: client.code,
      name: client.name,
      type: client.type,
      document: client.document,
      email: client.email,
      phone: client.phone,
      whatsapp: client.whatsapp,
      address: client.address,
      number: client.number,
      complement: client.complement,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      zipCode: client.zipCode,
      latitude: client.latitude,
      longitude: client.longitude,
      deliveryNotes: client.deliveryNotes,
      active: client.active
    });
    setIsModalOpen(true);
    logUserAction('OPEN_EDIT_CLIENT', { clientId: client.id });
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const result = await deleteClient(clientId);
        if (result.success) {
          setClients(clients.filter(c => c.id !== clientId));
          logAction({ 
        action: USER_ACTIONS.DELETE,
        module: MODULES.CLIENTS,
        details: { clientId }
      });
        } else {
          console.error('Failed to delete client:', result.error);
          alert('Erro ao excluir cliente');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Erro ao excluir cliente');
      }
      logAction({ 
        action: USER_ACTIONS.DELETE,
        module: MODULES.CLIENTS,
        details: { clientId }
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({
      code: '',
      name: '',
      type: 'PF',
      document: '',
      email: '',
      phone: '',
      whatsapp: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '',
      latitude: -23.550520,
      longitude: -46.633308,
      deliveryNotes: '',
      active: true
    });
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.document.includes(searchTerm);
    const matchesType = !selectedType || client.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout title="Cadastro de Clientes" subtitle="Gerenciar clientes e localizações">
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
                  placeholder="Buscar por nome, código ou documento..."
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
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
            
            <button
              onClick={() => setShowMap(!showMap)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className={`fa-solid ${showMap ? 'fa-table' : 'fa-map'} mr-2`}></i>
              {showMap ? 'Ver Lista' : 'Ver Mapa'}
            </button>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                logAction({ 
                  action: USER_ACTIONS.VIEW,
                  module: MODULES.CLIENTS,
                  details: { action: 'open_create' }
                });
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Cliente
            </button>
          </div>
        </div>

        {showMap ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="h-[600px]">
              <ClientMap clients={clients} onClientClick={(client) => handleEdit(client)} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700 text-gray-300 text-sm">
                    <th className="px-6 py-3 text-left font-medium">Código</th>
                    <th className="px-6 py-3 text-left font-medium">Nome</th>
                    <th className="px-6 py-3 text-left font-medium">Tipo</th>
                    <th className="px-6 py-3 text-left font-medium">Documento</th>
                    <th className="px-6 py-3 text-left font-medium">Telefone</th>
                    <th className="px-6 py-3 text-left font-medium">Endereço</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-white">{client.code}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{client.name}</div>
                          <div className="text-xs text-gray-400">{client.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          client.type === 'PJ' 
                            ? 'bg-blue-900 text-blue-300' 
                            : 'bg-purple-900 text-purple-300'
                        }`}>
                          {client.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{client.document}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          <div>{client.phone}</div>
                          {client.whatsapp && (
                            <div className="text-xs text-green-400">
                              <i className="fa-brands fa-whatsapp mr-1"></i>
                              {client.whatsapp}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          <div>{client.address}, {client.number}</div>
                          <div className="text-xs text-gray-400">{client.neighborhood} - {client.city}/{client.state}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          client.active 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {client.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => window.open(`https://www.google.com/maps?q=${client.latitude},${client.longitude}`, '_blank')}
                            className="text-green-400 hover:text-green-300"
                            title="Ver no Mapa"
                          >
                            <i className="fa-solid fa-map-marker-alt"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(client)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Editar"
                          >
                            <i className="fa-solid fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
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

            <div className="px-6 py-3 bg-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length} clientes
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
        )}

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
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
                      Tipo *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'PF' | 'PJ'})}
                    >
                      <option value="PF">Pessoa Física</option>
                      <option value="PJ">Pessoa Jurídica</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
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
                      {formData.type === 'PF' ? 'CPF' : 'CNPJ'} *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={formData.type === 'PF' ? 14 : 18}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.document}
                      onChange={(e) => setFormData({...formData, document: formatDocument(e.target.value, formData.type)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: formatPhone(e.target.value)})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-white mb-3 border-b border-gray-700 pb-2">
                      Endereço de Entrega
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      maxLength={9}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.zipCode}
                      onChange={(e) => {
                        const formatted = formatZipCode(e.target.value);
                        setFormData({...formData, zipCode: formatted});
                        if (formatted.replace(/\D/g, '').length === 8) {
                          searchAddressByCep(formatted);
                        }
                      }}
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
                      Complemento
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.complement}
                      onChange={(e) => setFormData({...formData, complement: e.target.value})}
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
                      Estado *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Observações de Entrega
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.deliveryNotes}
                      onChange={(e) => setFormData({...formData, deliveryNotes: e.target.value})}
                      placeholder="Ex: Entregar pela portaria dos fundos, ligar ao chegar..."
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
                      <span className="text-sm text-gray-300">Cliente Ativo</span>
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
                    {editingClient ? 'Atualizar' : 'Cadastrar'}
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