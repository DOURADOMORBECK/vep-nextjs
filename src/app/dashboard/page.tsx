'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalPedidos: number;
  totalClientes: number;
  totalProdutos: number;
  faturamentoMes: number;
  pedidosHoje: number;
  ticketMedio: number;
}

// Dados de demonstração
const DEMO_STATS: DashboardStats = {
  totalPedidos: 1247,
  totalClientes: 43,
  totalProdutos: 967,
  faturamentoMes: 45678.90,
  pedidosHoje: 12,
  ticketMedio: 367.45
};

export default function DashboardPageV2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS);
  const [isDemo, setIsDemo] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Por enquanto usar dados demo
      setStats(DEMO_STATS);
      setIsDemo(true);
      
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Configurações dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF'
        }
      },
      tooltip: {
        backgroundColor: '#374151',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6'
      }
    },
    scales: {
      x: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9CA3AF'
        }
      }
    }
  };

  // Dados do gráfico de vendas
  const salesData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Vendas 2025',
        data: [32000, 35000, 38000, 42000, 41000, 45678],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Vendas 2024',
        data: [28000, 30000, 32000, 35000, 38000, 40000],
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Dados do gráfico de produtos mais vendidos
  const topProductsData = {
    labels: ['Detergente 5L', 'Álcool 70%', 'Desinfetante', 'Sabão Líquido', 'Papel Toalha'],
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: [450, 380, 320, 290, 250],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 146, 60)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Dados do gráfico de categorias
  const categoriesData = {
    labels: ['Limpeza', 'Higiene', 'Descartáveis', 'Químicos', 'Outros'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 146, 60)',
          'rgb(139, 92, 246)',
          'rgb(107, 114, 128)'
        ],
        borderWidth: 1
      }
    ]
  };

  const handleSync = () => {
    router.push('/sync-unified');
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Visão geral do seu negócio">
      <div className="p-6">
        {/* Header com período */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>
          </div>

          {isDemo && (
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-sync"></i>
              Sincronizar Dados Reais
            </button>
          )}
        </div>

        {/* Indicador de dados demo */}
        {isDemo && (
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <i className="fas fa-chart-line text-blue-500"></i>
            <div className="flex-1">
              <p className="text-blue-200">
                Dashboard com dados de demonstração para visualização. 
                <button 
                  onClick={handleSync}
                  className="ml-2 text-blue-400 hover:text-blue-300 underline"
                >
                  Sincronize para ver seus dados reais
                </button>
              </p>
            </div>
          </div>
        )}

        <LoadingOverlay show={loading} message="Carregando dashboard..." />

        {!loading && (
          <>
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Pedidos Total</span>
                  <i className="fas fa-shopping-cart text-blue-400"></i>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalPedidos.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-green-400 mt-1">+12% vs mês anterior</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Clientes</span>
                  <i className="fas fa-users text-green-400"></i>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalClientes}</p>
                <p className="text-xs text-green-400 mt-1">+3 novos este mês</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Produtos</span>
                  <i className="fas fa-box text-purple-400"></i>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalProdutos}</p>
                <p className="text-xs text-gray-400 mt-1">Em catálogo</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Faturamento</span>
                  <i className="fas fa-dollar-sign text-yellow-400"></i>
                </div>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-400 mt-1">+18% vs mês anterior</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Pedidos Hoje</span>
                  <i className="fas fa-calendar-day text-orange-400"></i>
                </div>
                <p className="text-2xl font-bold text-white">{stats.pedidosHoje}</p>
                <p className="text-xs text-gray-400 mt-1">Até agora</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Ticket Médio</span>
                  <i className="fas fa-receipt text-pink-400"></i>
                </div>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-400 mt-1">+5% vs mês anterior</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de vendas */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Evolução de Vendas</h3>
                <div className="h-64">
                  <Line data={salesData} options={chartOptions} />
                </div>
              </div>

              {/* Gráfico de produtos mais vendidos */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top 5 Produtos</h3>
                <div className="h-64">
                  <Bar data={topProductsData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Segunda linha de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de categorias */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Vendas por Categoria</h3>
                <div className="h-64">
                  <Doughnut data={categoriesData} options={chartOptions} />
                </div>
              </div>

              {/* Últimos pedidos */}
              <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Últimos Pedidos</h3>
                <div className="space-y-3">
                  {[
                    { id: '#1247', cliente: 'Supermercado Central', valor: 1234.50, status: 'Entregue' },
                    { id: '#1246', cliente: 'Hotel Plaza', valor: 890.00, status: 'Em Rota' },
                    { id: '#1245', cliente: 'Restaurante Sabor & Arte', valor: 456.30, status: 'Preparando' },
                    { id: '#1244', cliente: 'Padaria Pão Quente', valor: 234.80, status: 'Entregue' },
                    { id: '#1243', cliente: 'Academia Fitness', valor: 678.90, status: 'Entregue' }
                  ].map((pedido) => (
                    <div key={pedido.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-primary-400 font-medium">{pedido.id}</span>
                        <span className="text-gray-300">{pedido.cliente}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-medium">
                          R$ {pedido.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pedido.status === 'Entregue' 
                            ? 'bg-green-900/20 text-green-400 border border-green-600/30'
                            : pedido.status === 'Em Rota'
                            ? 'bg-blue-900/20 text-blue-400 border border-blue-600/30'
                            : 'bg-yellow-900/20 text-yellow-400 border border-yellow-600/30'
                        }`}>
                          {pedido.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}