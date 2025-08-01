'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { railwayApi } from '@/lib/api-interceptor';
import Link from 'next/link';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  orderDate: string;
  deliveryDate: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'separation' | 'labeling' | 'verification' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  deliveryPeriod: 'morning' | 'afternoon' | 'night';
  deliveryAddress: string;
  deliveryNotes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  active: boolean;
}

interface Client {
  id: string;
  code: string;
  name: string;
  type: 'PF' | 'PJ';
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  deliveryNotes: string;
  active: boolean;
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    orderNumber: '',
    clientId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    items: [] as OrderItem[],
    totalAmount: 0,
    status: 'pending' as Order['status'],
    paymentMethod: 'money',
    paymentStatus: 'pending' as Order['paymentStatus'],
    deliveryPeriod: 'morning' as Order['deliveryPeriod'],
    deliveryAddress: '',
    deliveryNotes: ''
  });

  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1
  });

  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-900 text-yellow-300' },
    { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-900 text-blue-300' },
    { value: 'separation', label: 'Em Separação', color: 'bg-orange-900 text-orange-300' },
    { value: 'labeling', label: 'Etiquetagem', color: 'bg-purple-900 text-purple-300' },
    { value: 'verification', label: 'Verificação', color: 'bg-indigo-900 text-indigo-300' },
    { value: 'ready', label: 'Pronto', color: 'bg-green-900 text-green-300' },
    { value: 'delivering', label: 'Em Entrega', color: 'bg-cyan-900 text-cyan-300' },
    { value: 'delivered', label: 'Entregue', color: 'bg-gray-700 text-gray-300' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-900 text-red-300' }
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-900 text-yellow-300' },
    { value: 'paid', label: 'Pago', color: 'bg-green-900 text-green-300' },
    { value: 'partial', label: 'Parcial', color: 'bg-orange-900 text-orange-300' },
    { value: 'overdue', label: 'Vencido', color: 'bg-red-900 text-red-300' }
  ];

  const paymentMethods = [
    { value: 'money', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'bank_slip', label: 'Boleto' },
    { value: 'check', label: 'Cheque' },
    { value: 'credit', label: 'Crediário' }
  ];

  const deliveryPeriods = [
    { value: 'morning', label: 'Manhã (8h - 12h)' },
    { value: 'afternoon', label: 'Tarde (12h - 18h)' },
    { value: 'night', label: 'Noite (18h - 22h)' }
  ];

  // Buscar dados iniciais
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchClients();
    logUserAction('VIEW_ORDERS_PAGE');
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await railwayApi.getOrders();
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        console.error('Erro ao buscar pedidos:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await railwayApi.getProducts();
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.active));
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await railwayApi.getClients();
      if (response.ok) {
        const data = await response.json();
        setClients(data.filter((c: Client) => c.active));
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const logUserAction = async (action: string, details?: unknown) => {
    try {
      await railwayApi.logUserAction(action, { ...(details as Record<string, unknown> || {}), module: 'ORDERS' });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PED${year}${month}${day}${random}`;
  };

  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0) {
      const product = products.find(p => p.id === newItem.productId);
      if (product) {
        const item: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: newItem.quantity,
          unit: product.unit,
          price: product.price,
          total: product.price * newItem.quantity
        };
        
        const updatedItems = [...formData.items, item];
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
        
        setFormData({
          ...formData,
          items: updatedItems,
          totalAmount
        });
        
        setNewItem({ productId: '', quantity: 1 });
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount
    });
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const deliveryAddress = `${client.address}, ${client.number}${client.complement ? ' - ' + client.complement : ''}, ${client.neighborhood} - ${client.city}/${client.state}`;
      setFormData({
        ...formData,
        clientId,
        deliveryAddress,
        deliveryNotes: client.deliveryNotes || ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Adicione pelo menos um produto ao pedido!');
      return;
    }
    
    try {
      const orderData = {
        ...formData,
        orderNumber: editingOrder ? editingOrder.orderNumber : generateOrderNumber(),
        createdBy: localStorage.getItem('userId') || 'admin'
      };

      if (editingOrder) {
        const response = await railwayApi.updateOrder(editingOrder.id, orderData);
        if (response.ok) {
          const updatedOrder = await response.json();
          setOrders(orders.map(o => o.id === editingOrder.id ? updatedOrder : o));
          logUserAction('UPDATE_ORDER', { orderId: editingOrder.id, ...orderData });
          alert('Pedido atualizado com sucesso!');
        } else {
          alert('Erro ao atualizar pedido');
        }
      } else {
        const response = await railwayApi.createOrder(orderData);
        if (response.ok) {
          const newOrder = await response.json();
          setOrders([...orders, newOrder]);
          logUserAction('CREATE_ORDER', newOrder);
          alert('Pedido criado com sucesso!');
        } else {
          alert('Erro ao criar pedido');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      alert('Erro ao salvar pedido. Tente novamente.');
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      orderDate: order.orderDate.split('T')[0],
      deliveryDate: order.deliveryDate.split('T')[0],
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryPeriod: order.deliveryPeriod,
      deliveryAddress: order.deliveryAddress,
      deliveryNotes: order.deliveryNotes
    });
    setIsModalOpen(true);
    logUserAction('OPEN_EDIT_ORDER', { orderId: order.id });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setFormData({
      orderNumber: '',
      clientId: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      items: [],
      totalAmount: 0,
      status: 'pending',
      paymentMethod: 'money',
      paymentStatus: 'pending',
      deliveryPeriod: 'morning',
      deliveryAddress: '',
      deliveryNotes: ''
    });
    setNewItem({ productId: '', quantity: 1 });
  };

  const getStatusBadge = (status: Order['status']) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || statusOptions[0];
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const option = paymentStatusOptions.find(opt => opt.value === status);
    return option || paymentStatusOptions[0];
  };

  // Filtros e paginação
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    const matchesPaymentStatus = !selectedPaymentStatus || order.paymentStatus === selectedPaymentStatus;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout title="Gestão de Pedidos" subtitle="Gerenciar pedidos e acompanhar status">
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
                  placeholder="Buscar por número, cliente..."
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            >
              <option value="">Status Pagamento</option>
              {paymentStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <Link
              href="/jornada-pedido"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-clipboard-list mr-2"></i>
              Jornada do Pedido
            </Link>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                logUserAction('OPEN_CREATE_ORDER');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Pedido
            </button>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">Número</th>
                  <th className="px-6 py-3 text-left font-medium">Cliente</th>
                  <th className="px-6 py-3 text-left font-medium">Data Pedido</th>
                  <th className="px-6 py-3 text-left font-medium">Entrega</th>
                  <th className="px-6 py-3 text-left font-medium">Valor</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Pagamento</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{order.clientName}</div>
                        <div className="text-xs text-gray-400">Cód: {order.clientCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {deliveryPeriods.find(p => p.value === order.deliveryPeriod)?.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.status).color}`}>
                        {getStatusBadge(order.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(order.paymentStatus).color}`}>
                        {getPaymentStatusBadge(order.paymentStatus).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <Link
                          href={`/jornada-pedido?orderId=${order.id}`}
                          className="text-green-400 hover:text-green-300"
                          title="Ver na Jornada"
                        >
                          <i className="fa-solid fa-route"></i>
                        </Link>
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
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
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
                  {editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Informações Básicas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cliente *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} - Cód: {client.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Data do Pedido *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Data de Entrega *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Período de Entrega *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.deliveryPeriod}
                      onChange={(e) => setFormData({...formData, deliveryPeriod: e.target.value as Order['deliveryPeriod']})}
                    >
                      {deliveryPeriods.map(period => (
                        <option key={period.value} value={period.value}>{period.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Endereço de Entrega *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Observações de Entrega
                    </label>
                    <textarea
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.deliveryNotes}
                      onChange={(e) => setFormData({...formData, deliveryNotes: e.target.value})}
                    />
                  </div>
                </div>

                {/* Seção de Produtos */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Produtos do Pedido</h3>
                  
                  {/* Adicionar Produto */}
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Produto
                        </label>
                        <select
                          className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                          value={newItem.productId}
                          onChange={(e) => setNewItem({...newItem, productId: e.target.value})}
                        >
                          <option value="">Selecione um produto...</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - R$ {product.price.toFixed(2)}/{product.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Quantidade
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            min="1"
                            className="flex-1 bg-gray-600 border border-gray-500 text-white rounded-l-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                          />
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-r-lg"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Produtos */}
                  <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-600 text-gray-300 text-sm">
                          <th className="px-4 py-2 text-left">Produto</th>
                          <th className="px-4 py-2 text-center">Qtd</th>
                          <th className="px-4 py-2 text-right">Preço Unit.</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-white">{item.productName}</td>
                            <td className="px-4 py-2 text-sm text-center text-gray-300">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-300">
                              R$ {item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-white font-medium">
                              R$ {item.total.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-600">
                          <td colSpan={3} className="px-4 py-2 text-right font-medium text-white">
                            Total do Pedido:
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-primary-400 text-lg">
                            R$ {formData.totalAmount.toFixed(2).replace('.', ',')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Pagamento e Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Forma de Pagamento *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    >
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status do Pagamento *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as Order['paymentStatus']})}
                    >
                      {paymentStatusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status do Pedido *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as Order['status']})}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
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
                    {editingOrder ? 'Atualizar' : 'Criar'} Pedido
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