'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { railwayApi } from '@/lib/api-interceptor';

interface Operator {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: string;
  permissions: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export default function OperadoresPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    role: 'operator',
    permissions: [] as string[],
    active: true
  });

  const roles = [
    { value: 'operator', label: 'Operador', color: 'bg-blue-900 text-blue-300' },
    { value: 'supervisor', label: 'Supervisor', color: 'bg-purple-900 text-purple-300' },
    { value: 'manager', label: 'Gerente', color: 'bg-green-900 text-green-300' },
    { value: 'admin', label: 'Administrador', color: 'bg-red-900 text-red-300' }
  ];

  const allPermissions = [
    { value: 'products.view', label: 'Visualizar Produtos', category: 'Produtos' },
    { value: 'products.create', label: 'Criar Produtos', category: 'Produtos' },
    { value: 'products.edit', label: 'Editar Produtos', category: 'Produtos' },
    { value: 'products.delete', label: 'Excluir Produtos', category: 'Produtos' },
    
    { value: 'orders.view', label: 'Visualizar Pedidos', category: 'Pedidos' },
    { value: 'orders.create', label: 'Criar Pedidos', category: 'Pedidos' },
    { value: 'orders.edit', label: 'Editar Pedidos', category: 'Pedidos' },
    { value: 'orders.process', label: 'Processar Pedidos', category: 'Pedidos' },
    
    { value: 'delivery.view', label: 'Visualizar Entregas', category: 'Entregas' },
    { value: 'delivery.manage', label: 'Gerenciar Entregas', category: 'Entregas' },
    { value: 'delivery.route', label: 'Definir Rotas', category: 'Entregas' },
    
    { value: 'clients.view', label: 'Visualizar Clientes', category: 'Clientes' },
    { value: 'clients.create', label: 'Criar Clientes', category: 'Clientes' },
    { value: 'clients.edit', label: 'Editar Clientes', category: 'Clientes' },
    { value: 'clients.delete', label: 'Excluir Clientes', category: 'Clientes' },
    
    { value: 'reports.view', label: 'Visualizar Relatórios', category: 'Relatórios' },
    { value: 'reports.export', label: 'Exportar Relatórios', category: 'Relatórios' },
    
    { value: 'system.users', label: 'Gerenciar Usuários', category: 'Sistema' },
    { value: 'system.settings', label: 'Configurações', category: 'Sistema' },
    { value: 'system.audit', label: 'Auditoria', category: 'Sistema' }
  ];

  // Buscar operadores
  useEffect(() => {
    fetchOperators();
    logUserAction('VIEW_OPERATORS_PAGE');
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await railwayApi.getOperators();
      if (response.ok) {
        const data = await response.json();
        setOperators(data);
      } else {
        console.error('Erro ao buscar operadores:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
    }
  };

  const logUserAction = async (action: string, details?: unknown) => {
    try {
      await railwayApi.logUserAction(action, { ...(details as Record<string, unknown> || {}), module: 'OPERATORS' });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const generateOperatorCode = () => {
    const prefix = 'OP';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 11) return phone;
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const operatorData = {
        ...formData,
        code: formData.code || generateOperatorCode(),
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, '')
      };

      if (editingOperator) {
        // Não enviar senha se não foi alterada
        let finalOperatorData = operatorData;
        if (!operatorData.password) {
          const { password: _password, ...dataWithoutPassword } = operatorData; // eslint-disable-line @typescript-eslint/no-unused-vars
          finalOperatorData = dataWithoutPassword as typeof operatorData;
        }
        
        const response = await railwayApi.updateOperator(editingOperator.id, finalOperatorData);
        if (response.ok) {
          const updatedOperator = await response.json();
          setOperators(operators.map(o => o.id === editingOperator.id ? updatedOperator : o));
          logUserAction('UPDATE_OPERATOR', { operatorId: editingOperator.id, ...operatorData });
          alert('Operador atualizado com sucesso!');
        } else {
          alert('Erro ao atualizar operador');
        }
      } else {
        const response = await railwayApi.createOperator(operatorData);
        if (response.ok) {
          const newOperator = await response.json();
          setOperators([...operators, newOperator]);
          logUserAction('CREATE_OPERATOR', newOperator);
          alert('Operador cadastrado com sucesso!');
        } else {
          alert('Erro ao cadastrar operador');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar operador:', error);
      alert('Erro ao salvar operador. Tente novamente.');
    }
  };

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator);
    setFormData({
      code: operator.code,
      name: operator.name,
      email: operator.email,
      phone: operator.phone,
      cpf: operator.cpf,
      password: '', // Senha vazia para edição
      role: operator.role,
      permissions: operator.permissions,
      active: operator.active
    });
    setIsModalOpen(true);
    logUserAction('OPEN_EDIT_OPERATOR', { operatorId: operator.id });
  };

  const handleDelete = async (operatorId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este operador?')) {
      try {
        const response = await railwayApi.deleteOperator(operatorId);
        if (response.ok) {
          setOperators(operators.filter(o => o.id !== operatorId));
          logUserAction('DELETE_OPERATOR', { operatorId });
          alert('Operador excluído com sucesso!');
        } else {
          alert('Erro ao excluir operador');
        }
      } catch (error) {
        console.error('Erro ao excluir operador:', error);
        alert('Erro ao excluir operador. Tente novamente.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOperator(null);
    setFormData({
      code: '',
      name: '',
      email: '',
      phone: '',
      cpf: '',
      password: '',
      role: 'operator',
      permissions: [],
      active: true
    });
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleRoleChange = (role: string) => {
    // Define permissões padrão por cargo
    const defaultPermissions: Record<string, string[]> = {
      operator: ['products.view', 'orders.view', 'delivery.view', 'clients.view'],
      supervisor: [
        'products.view', 'products.create', 'products.edit',
        'orders.view', 'orders.create', 'orders.edit', 'orders.process',
        'delivery.view', 'delivery.manage',
        'clients.view', 'clients.create', 'clients.edit',
        'reports.view'
      ],
      manager: [
        'products.view', 'products.create', 'products.edit', 'products.delete',
        'orders.view', 'orders.create', 'orders.edit', 'orders.process',
        'delivery.view', 'delivery.manage', 'delivery.route',
        'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
        'reports.view', 'reports.export'
      ],
      admin: allPermissions.map(p => p.value)
    };

    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions[role] || []
    }));
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig || roles[0];
  };

  // Filtros e paginação
  const filteredOperators = operators.filter(operator => {
    const matchesSearch = operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.cpf.includes(searchTerm);
    const matchesRole = !selectedRole || operator.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);
  const paginatedOperators = filteredOperators.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Agrupar permissões por categoria
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  return (
    <DashboardLayout title="Gestão de Operadores" subtitle="Gerenciar operadores e suas permissões">
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
                  placeholder="Buscar por nome, email, código ou CPF..."
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Todos os Cargos</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                logUserAction('OPEN_CREATE_OPERATOR');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Operador
            </button>
          </div>
        </div>

        {/* Tabela de Operadores */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">Código</th>
                  <th className="px-6 py-3 text-left font-medium">Nome</th>
                  <th className="px-6 py-3 text-left font-medium">Email</th>
                  <th className="px-6 py-3 text-left font-medium">Telefone</th>
                  <th className="px-6 py-3 text-left font-medium">Cargo</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Último Acesso</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">{operator.code}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{operator.name}</div>
                        <div className="text-xs text-gray-400">CPF: {formatCPF(operator.cpf)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{operator.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{formatPhone(operator.phone)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(operator.role).color}`}>
                        {getRoleBadge(operator.role).label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        operator.active 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {operator.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {operator.lastLogin 
                        ? new Date(operator.lastLogin).toLocaleString('pt-BR')
                        : 'Nunca acessou'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(operator)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(operator.id)}
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
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredOperators.length)} de {filteredOperators.length} operadores
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
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingOperator ? 'Editar Operador' : 'Novo Operador'}
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
                      CPF *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formatCPF(formData.cpf)}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})}
                      maxLength={14}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Completo *
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
                      Senha {editingOperator ? '(deixe vazio para manter)' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingOperator}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cargo *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Permissões */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Permissões</h3>
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {permissions.map(perm => (
                            <label key={perm.value} className="flex items-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 bg-gray-600 border-gray-500 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                                checked={formData.permissions.includes(perm.value)}
                                onChange={() => handlePermissionToggle(perm.value)}
                              />
                              <span className="text-sm text-gray-300">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
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
                    <span className="text-sm text-gray-300">Operador Ativo</span>
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
                    {editingOperator ? 'Atualizar' : 'Cadastrar'}
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