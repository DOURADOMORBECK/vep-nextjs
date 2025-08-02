'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { localApi } from '@/lib/local-api';
import { toast } from 'react-hot-toast';
import { DeliveryRoute, DeliveryStats, DriverStats } from '@/types/delivery';

export default function RotasEntregaPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedStatus) params.status = selectedStatus;
      if (selectedDriver) params.driver_id = selectedDriver;
      
      const response = await localApi.getDeliveries(params);
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Erro ao buscar rotas');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedDriver]);

  const fetchStats = async () => {
    try {
      const response = await localApi.getDeliveryStats();
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDriverStats = async (driverId: string) => {
    try {
      const response = await localApi.getDriverDeliveryStats(driverId);
      if (response.ok) {
        const data = await response.json();
        setDriverStats(data);
      }
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-gray-600 text-gray-200';
      case 'EM_ANDAMENTO':
        return 'bg-blue-600 text-blue-200';
      case 'CONCLUIDA':
        return 'bg-green-600 text-green-200';
      case 'CANCELADA':
        return 'bg-red-600 text-red-200';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'fa-clock';
      case 'EM_ANDAMENTO':
        return 'fa-truck';
      case 'CONCLUIDA':
        return 'fa-check-circle';
      case 'CANCELADA':
        return 'fa-times-circle';
      default:
        return 'fa-question-circle';
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchStats();
  }, [selectedStatus, selectedDriver, fetchRoutes]);

  return (
    <DashboardLayout title="Rotas de Entrega" subtitle="Gestão de Rotas">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Rotas</p>
                <p className="text-2xl font-bold text-white">{stats.totalRoutes}</p>
              </div>
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-route text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Rotas Ativas</p>
                <p className="text-2xl font-bold text-blue-400">{stats.activeRoutes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-truck-fast text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Entregas Hoje</p>
                <p className="text-2xl font-bold text-green-400">{stats.todayDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-box-open text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Pontos</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.totalPoints}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-map-pin text-white"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Todos os Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Motorista
            </label>
            <input 
              type="text"
              placeholder="ID do motorista"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedDriver('');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              <i className="fa-solid fa-filter-circle-xmark mr-2"></i>
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700 border-b border-gray-600">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Motorista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Veículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Distância
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Carregando rotas...
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    Nenhuma rota encontrada
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        #{route.route_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {route.driver_name || 'Não atribuído'}
                      </div>
                      {route.driver_id && (
                        <div className="text-xs text-gray-500">ID: {route.driver_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {route.vehicle_id || 'Não atribuído'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(route.status)}`}>
                        <i className={`fa-solid ${getStatusIcon(route.status)} mr-1`}></i>
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(route.completed_points / route.total_points) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-300">
                          {route.completed_points}/{route.total_points}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {route.distance_km ? `${route.distance_km} km` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(route.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(route.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          setSelectedRoute(route);
                          if (route.driver_id) {
                            fetchDriverStats(route.driver_id.toString());
                          }
                        }}
                        className="text-primary-400 hover:text-primary-300 mr-3"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        onClick={() => window.location.href = `/jornada-entrega?route=${route.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <i className="fa-solid fa-map-location-dot"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Details Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Detalhes da Rota #{selectedRoute.route_code}
              </h3>
              <button
                onClick={() => {
                  setSelectedRoute(null);
                  setDriverStats(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRoute.status)}`}>
                  <i className={`fa-solid ${getStatusIcon(selectedRoute.status)} mr-1`}></i>
                  {selectedRoute.status}
                </span>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Progresso</p>
                <p className="text-lg font-bold text-white">
                  {selectedRoute.completed_points}/{selectedRoute.total_points} pontos
                </p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Motorista</p>
                <p className="text-white">{selectedRoute.driver_name || 'Não atribuído'}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Veículo</p>
                <p className="text-white">{selectedRoute.vehicle_id || 'Não atribuído'}</p>
              </div>
            </div>

            {selectedRoute.start_time && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Início</p>
                  <p className="text-white">
                    {new Date(selectedRoute.start_time).toLocaleString('pt-BR')}
                  </p>
                </div>
                {selectedRoute.end_time && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Término</p>
                    <p className="text-white">
                      {new Date(selectedRoute.end_time).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {driverStats && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Estatísticas do Motorista
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Total de Rotas</p>
                    <p className="text-lg font-bold text-white">{driverStats.totalRoutes}</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Rotas Concluídas</p>
                    <p className="text-lg font-bold text-green-400">{driverStats.completedRoutes}</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Entregas Hoje</p>
                    <p className="text-lg font-bold text-blue-400">{driverStats.todayDeliveries}</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Tempo Médio/Entrega</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {Math.round(driverStats.avgDeliveryTimeMinutes)} min
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}