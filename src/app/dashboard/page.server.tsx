import { Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import UnifiedSearch from '@/components/UnifiedSearch';
import { railwayApi } from '@/lib/api-interceptor';

// Server Component for fetching dashboard stats
async function DashboardStats() {
  try {
    const response = await railwayApi.getDashboardStats();
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    
    const data = await response.json();
    const stats = {
      activeOrders: data.orders?.active || 0,
      deliveriesInProgress: data.deliveries?.in_progress || 0,
      activeOperators: data.operators?.active || 0,
      totalProducts: data.products?.total || 0
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon="fa-clipboard-list"
          color="primary"
          label="Pedidos Ativos"
          value={stats.activeOrders}
        />
        <StatsCard
          icon="fa-truck"
          color="blue"
          label="Entregas em Curso"
          value={stats.deliveriesInProgress}
        />
        <StatsCard
          icon="fa-users"
          color="yellow"
          label="Operadores Ativos"
          value={stats.activeOperators}
        />
        <StatsCard
          icon="fa-box"
          color="green"
          label="Produtos"
          value={stats.totalProducts}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return <StatsError />;
  }
}

// Loading skeleton for stats
function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-700 animate-pulse">
              <div className="w-8 h-8"></div>
            </div>
            <div className="ml-4">
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-6 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Error component for stats
function StatsError() {
  return (
    <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-8">
      <p className="text-red-400">Failed to load dashboard statistics. Please try again later.</p>
    </div>
  );
}

// Stats card component
function StatsCard({ icon, color, label, value }: {
  icon: string;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-600 bg-opacity-20`}>
          <i className={`fa-solid ${icon} text-${color}-400 text-xl`}></i>
        </div>
        <div className="ml-4">
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Server Component for Recent Activity
async function RecentActivity() {
  // Simulate fetching recent activity
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return (
    <div className="space-y-4">
      <div className="text-gray-400 text-sm">
        <p>• Novo pedido #1234 criado</p>
        <p>• Entrega #5678 concluída</p>
        <p>• Operador João Silva iniciou turno</p>
      </div>
    </div>
  );
}

// Loading skeleton for activity
function ActivityLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-700 rounded animate-pulse"></div>
      ))}
    </div>
  );
}

// Main dashboard page (Server Component)
export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard Principal">
      <div className="px-6 pt-8 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Visão Geral do Sistema</h1>
          <div className="lg:max-w-md">
            <UnifiedSearch />
          </div>
        </div>
        
        {/* Stats Cards with Suspense */}
        <Suspense fallback={<StatsLoadingSkeleton />}>
          <DashboardStats />
        </Suspense>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                  icon="fa-box-open"
                  title="Jornada do Pedido"
                  description="Gerir processos de pedidos"
                  href="/jornada-pedido"
                />
                <QuickActionCard
                  icon="fa-truck"
                  title="Jornada da Entrega"
                  description="Controlar entregas"
                  href="/jornada-entrega"
                />
                <QuickActionCard
                  icon="fa-industry"
                  title="Jornada do Produto"
                  description="Rastrear produção"
                  href="/jornada-produto"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <RecentActivity />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Quick action card component
function QuickActionCard({ icon, title, description, href }: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a href={href} className="block">
      <div className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 cursor-pointer transition-colors">
        <i className={`fa-solid ${icon} text-primary-400 text-2xl mb-2`}></i>
        <p className="text-white font-medium">{title}</p>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </a>
  );
}