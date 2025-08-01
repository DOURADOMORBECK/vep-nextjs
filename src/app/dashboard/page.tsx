'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { railwayApi } from '@/lib/api-interceptor';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    deliveriesInProgress: 0,
    activeOperators: 0,
    totalProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await railwayApi.getDashboardStats();
      if (response.ok) {
        const data = await response.json();
        setStats({
          activeOrders: data.orders?.active || 0,
          deliveriesInProgress: data.deliveries?.in_progress || 0,
          activeOperators: data.operators?.active || 0,
          totalProducts: data.products?.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout title="Dashboard Principal">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-white mb-4">Visão Geral do Sistema</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-600 bg-opacity-20">
                <i className="fa-solid fa-clipboard-list text-primary-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Pedidos Ativos</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.activeOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-600 bg-opacity-20">
                <i className="fa-solid fa-truck text-blue-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Entregas em Curso</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.deliveriesInProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-600 bg-opacity-20">
                <i className="fa-solid fa-users text-yellow-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Operadores Ativos</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.activeOperators}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-600 bg-opacity-20">
                <i className="fa-solid fa-box text-green-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Produtos</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.totalProducts}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 cursor-pointer transition-colors">
                  <i className="fa-solid fa-box-open text-primary-400 text-2xl mb-2"></i>
                  <p className="text-white font-medium">Jornada do Pedido</p>
                  <p className="text-gray-400 text-sm">Gerir processos de pedidos</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 cursor-pointer transition-colors">
                  <i className="fa-solid fa-truck text-primary-400 text-2xl mb-2"></i>
                  <p className="text-white font-medium">Jornada da Entrega</p>
                  <p className="text-gray-400 text-sm">Controlar entregas</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 cursor-pointer transition-colors">
                  <i className="fa-solid fa-industry text-primary-400 text-2xl mb-2"></i>
                  <p className="text-white font-medium">Jornada do Produto</p>
                  <p className="text-gray-400 text-sm">Rastrear produção</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">Carregando atividades...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}