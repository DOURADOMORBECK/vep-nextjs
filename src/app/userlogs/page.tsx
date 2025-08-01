'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface UserLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  details: Record<string, unknown>;
  module: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export default function UserLogsPage() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });


  useEffect(() => {
    loadLogs();
  }, []);

  const filterLogs = useCallback(() => {
    let filtered = logs;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por módulo
    if (selectedModule !== 'all') {
      filtered = filtered.filter(log => log.module === selectedModule);
    }

    // Filtro por ação
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Filtro por data
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        if (dateRange.start && logDate < new Date(dateRange.start + 'T00:00:00')) {
          return false;
        }
        if (dateRange.end && logDate > new Date(dateRange.end + 'T23:59:59')) {
          return false;
        }
        return true;
      });
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedModule, selectedAction, dateRange]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // API UserLogs ainda não está implementada no railwayApi
      // Por enquanto retornar array vazio até a API estar disponível
      setLogs([]);
      
      // Quando a API estiver disponível:
      // const response = await railwayApi.getUserLogs();
      // if (response.ok) {
      //   const data = await response.json();
      //   setLogs(data.logs || []);
      // }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };


  const getModules = () => {
    const modules = new Set(logs.map(log => log.module));
    return Array.from(modules);
  };

  const getActions = () => {
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-400';
    if (action.includes('UPDATE')) return 'text-blue-400';
    if (action.includes('DELETE')) return 'text-red-400';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-purple-400';
    if (action.includes('START') || action.includes('COMPLETE')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'AUTH': return 'fa-lock';
      case 'PRODUCTS': return 'fa-box';
      case 'ORDERS': return 'fa-shopping-cart';
      case 'DELIVERY': return 'fa-truck';
      case 'CLIENTS': return 'fa-users';
      case 'SUPPLIERS': return 'fa-industry';
      default: return 'fa-file';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `userlogs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <DashboardLayout title="Histórico de Ações" subtitle="Acompanhe todas as ações realizadas no sistema">
      <div className="p-6">
        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por usuário, ação..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                />
                <i className="fa-solid fa-search absolute right-3 top-3 text-gray-400"></i>
              </div>
            </div>

            {/* Módulo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Módulo
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="all">Todos os Módulos</option>
                {getModules().map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            {/* Ação */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ação
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="all">Todas as Ações</option>
                {getActions().map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Período
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {filteredLogs.length} de {logs.length} registros
            </div>
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <i className="fa-solid fa-download mr-2"></i>
              Exportar Logs
            </button>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-6 py-3 text-left font-medium">Usuário</th>
                  <th className="px-6 py-3 text-left font-medium">Módulo</th>
                  <th className="px-6 py-3 text-left font-medium">Ação</th>
                  <th className="px-6 py-3 text-left font-medium">Detalhes</th>
                  <th className="px-6 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                      <p>Carregando logs...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      <i className="fa-solid fa-file-circle-xmark text-4xl mb-2"></i>
                      <p>Nenhum log encontrado</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div>
                          <div className="font-medium">{formatTimestamp(log.timestamp)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                            <i className="fa-solid fa-user text-xs"></i>
                          </div>
                          <div>
                            <div className="text-white font-medium">{log.userName || 'Usuário'}</div>
                            <div className="text-xs text-gray-400">{log.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <i className={`fa-solid ${getModuleIcon(log.module)} text-gray-400 mr-2`}></i>
                          <span className="text-gray-300">{log.module}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-gray-400 hover:text-gray-300">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 text-xs text-gray-500 bg-gray-700 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {log.ip || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Ações</p>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
              </div>
              <i className="fa-solid fa-chart-line text-2xl text-blue-400"></i>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Usuários Ativos</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(logs.map(log => log.userId)).size}
                </p>
              </div>
              <i className="fa-solid fa-users text-2xl text-green-400"></i>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Módulos Usados</p>
                <p className="text-2xl font-bold text-white">{getModules().length}</p>
              </div>
              <i className="fa-solid fa-cubes text-2xl text-purple-400"></i>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ações Hoje</p>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(log => 
                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <i className="fa-solid fa-calendar-day text-2xl text-yellow-400"></i>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}