'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { railwayApi } from '@/lib/api-interceptor';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  cpf: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  avatar?: string;
}

function UsuariosContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    phone: '',
    cpf: '',
    active: true
  });

  const roles = [
    { value: 'user', label: 'Usuário', color: 'bg-gray-700 text-gray-300' },
    { value: 'operator', label: 'Operador', color: 'bg-blue-900 text-blue-300' },
    { value: 'supervisor', label: 'Supervisor', color: 'bg-purple-900 text-purple-300' },
    { value: 'manager', label: 'Gerente', color: 'bg-green-900 text-green-300' },
    { value: 'admin', label: 'Administrador', color: 'bg-red-900 text-red-300' },
    { value: 'owner', label: 'Proprietário', color: 'bg-yellow-900 text-yellow-300' }
  ];

  const departments = [
    'Administrativo',
    'Comercial',
    'Compras',
    'Estoque',
    'Financeiro',
    'Logística',
    'Marketing',
    'Operações',
    'Qualidade',
    'RH',
    'TI',
    'Vendas'
  ];

  // Buscar usuários
  useEffect(() => {
    fetchUsers();
    logUserAction('VIEW_USERS_PAGE');
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await railwayApi.getUsers();
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Erro ao buscar usuários:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const logUserAction = async (action: string, details?: unknown) => {
    try {
      await railwayApi.logUserAction(action, { ...(details as Record<string, unknown> || {}), module: 'USERS' });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
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
      let userData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, '')
      };

      if (editingUser) {
        // Não enviar senha se não foi alterada
        if (!userData.password) {
          const { password: _password, ...dataWithoutPassword } = userData; // eslint-disable-line @typescript-eslint/no-unused-vars
          userData = dataWithoutPassword as typeof userData;
        }
        
        const response = await railwayApi.updateUser(editingUser.id, userData);
        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
          logUserAction('UPDATE_USER', { userId: editingUser.id, ...userData });
          alert('Usuário atualizado com sucesso!');
        } else {
          alert('Erro ao atualizar usuário');
        }
      } else {
        const response = await railwayApi.createUser(userData);
        if (response.ok) {
          const newUser = await response.json();
          setUsers([...users, newUser]);
          logUserAction('CREATE_USER', newUser);
          alert('Usuário cadastrado com sucesso!');
        } else {
          alert('Erro ao cadastrar usuário');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Senha vazia para edição
      role: user.role,
      department: user.department,
      phone: user.phone,
      cpf: user.cpf,
      active: user.active
    });
    setIsModalOpen(true);
    logUserAction('OPEN_EDIT_USER', { userId: user.id });
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await railwayApi.deleteUser(userId);
        if (response.ok) {
          setUsers(users.filter(u => u.id !== userId));
          logUserAction('DELETE_USER', { userId });
          alert('Usuário excluído com sucesso!');
        } else {
          alert('Erro ao excluir usuário');
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário. Tente novamente.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      department: '',
      phone: '',
      cpf: '',
      active: true
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig || roles[0];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filtros e paginação
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.cpf.includes(searchTerm);
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout title="Gestão de Usuários" subtitle="Gerenciar usuários do sistema">
      <div className="p-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Usuários</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <div className="bg-blue-900 bg-opacity-20 p-3 rounded-lg">
                <i className="fa-solid fa-users text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Usuários Ativos</p>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.active).length}</p>
              </div>
              <div className="bg-green-900 bg-opacity-20 p-3 rounded-lg">
                <i className="fa-solid fa-user-check text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Administradores</p>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="bg-red-900 bg-opacity-20 p-3 rounded-lg">
                <i className="fa-solid fa-user-shield text-red-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Departamentos</p>
                <p className="text-2xl font-bold text-white">{new Set(users.map(u => u.department)).size}</p>
              </div>
              <div className="bg-purple-900 bg-opacity-20 p-3 rounded-lg">
                <i className="fa-solid fa-building text-purple-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

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
                  placeholder="Buscar por nome, email ou CPF..."
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
            
            <select
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">Todos os Departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                logUserAction('OPEN_CREATE_USER');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedUsers.map((user) => (
            <div key={user.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white font-medium mr-3 relative">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name} fill className="rounded-full object-cover" sizes="48px" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{user.name}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  user.active 
                    ? 'bg-green-900 text-green-300' 
                    : 'bg-red-900 text-red-300'
                }`}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Cargo:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role).color}`}>
                    {getRoleBadge(user.role).label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Departamento:</span>
                  <span className="text-white text-sm">{user.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Telefone:</span>
                  <span className="text-white text-sm">{formatPhone(user.phone)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">CPF:</span>
                  <span className="text-white text-sm">{formatCPF(user.cpf)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Último Acesso:</span>
                  <span className="text-white text-sm">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleEdit(user)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center"
                >
                  <i className="fa-solid fa-edit mr-1"></i>
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center"
                >
                  <i className="fa-solid fa-trash mr-1"></i>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuários
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="px-3 py-1 text-white">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
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
                      Senha {editingUser ? '(deixe vazio para manter)' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      minLength={6}
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
                      Cargo *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Departamento *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      />
                      <span className="text-sm text-gray-300">Usuário Ativo</span>
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
                    {editingUser ? 'Atualizar' : 'Cadastrar'}
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

export default function UsuariosPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'owner']} fallbackUrl="/dashboard">
      <UsuariosContent />
    </ProtectedRoute>
  );
}