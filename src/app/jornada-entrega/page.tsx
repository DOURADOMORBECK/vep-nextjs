'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DeliveryMap from '@/components/DeliveryMap';
import { railwayApi } from '@/lib/api-interceptor';
import { toast } from 'react-hot-toast';
import { DeliveryRoute, DeliveryPoint, DeliveryStats } from '@/types/delivery';

interface PendingOrder {
  id: string;
  customer: string;
  address: string;
  items: string;
  weight: string;
  coords: [number, number];
  status: string;
}

interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  driver_id: string;
  status: string;
  capacity: string;
}

export default function JornadaEntregaPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Seleção, 2: Rota, 3: Carregamento, 4: Entrega, 5: Resumo
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState('preparing'); // preparing, in_transit, delivering, completed
  const [currentDeliveryIndex, setCurrentDeliveryIndex] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState<string[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<{[key: string]: string}>({});
  
  // API States
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<DeliveryRoute | null>(null);
  const [routePoints, setRoutePoints] = useState<DeliveryPoint[]>([]);
  const [, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Fetch delivery stats on mount
  useEffect(() => {
    fetchDeliveryStats();
    fetchPendingOrders();
    fetchVehicles();
  }, []);

  const fetchDeliveryStats = async () => {
    try {
      const response = await railwayApi.getDeliveryStats();
      if (response.ok) {
        const data = await response.json();
        setDeliveryStats(data);
      }
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await railwayApi.getOrders();
      if (response.ok) {
        const data = await response.json();
        setPendingOrders(data);
      } else {
        console.error('Failed to fetch pending orders');
        toast.error('Erro ao buscar pedidos pendentes');
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast.error('Erro ao conectar com servidor de pedidos');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await railwayApi.getVehicles();
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      } else {
        console.error('Failed to fetch vehicles');
        toast.error('Erro ao buscar veículos');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Erro ao conectar com servidor de veículos');
    }
  };

  const progressSteps = [
    { id: 1, name: 'Seleção de Pedidos', icon: 'fa-clipboard-list', active: currentStep === 1, completed: currentStep > 1 },
    { id: 2, name: 'Criação da Rota', icon: 'fa-route', active: currentStep === 2, completed: currentStep > 2 },
    { id: 3, name: 'Carregamento', icon: 'fa-boxes-stacked', active: currentStep === 3, completed: currentStep > 3 },
    { id: 4, name: 'Entrega em Tempo Real', icon: 'fa-truck-fast', active: currentStep === 4, completed: currentStep > 4 },
    { id: 5, name: 'Resumo Final', icon: 'fa-flag-checkered', active: currentStep === 5, completed: false },
  ];


  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const removeSelectedOrder = (orderId: string) => {
    setSelectedOrders(prev => prev.filter(id => id !== orderId));
  };

  const handleStepComplete = async () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      
      // Auto-actions based on step
      if (currentStep === 1) {
        // Create route when moving to step 2
        await createRoute();
      } else if (currentStep === 2) {
        // Route already optimized
      } else if (currentStep === 3) {
        // Simulate loading progress and start route
        simulateLoading();
        setTimeout(() => startRoute(), 3000);
      } else if (currentStep === 4) {
        // Already in delivery
      }
    }
  };

  const simulateLoading = () => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleDeliveryComplete = async (orderId: string, notes: string = '') => {
    const point = routePoints.find(p => p.notes?.includes(orderId));
    if (point) {
      await markDelivered(point.id.toString(), notes);
    }
  };

  const getTotalWeight = () => {
    return selectedOrders.reduce((total, orderId) => {
      const order = pendingOrders.find(o => o.id === orderId);
      return total + (order ? parseFloat(order.weight.replace(' kg', '')) : 0);
    }, 0).toFixed(1);
  };

  const getTotalItems = () => {
    return selectedOrders.reduce((total, orderId) => {
      const order = pendingOrders.find(o => o.id === orderId);
      return total + (order ? Number(order.items) || 0 : 0);
    }, 0);
  };

  const createRoute = async () => {
    if (selectedOrders.length === 0 || !selectedVehicle) return;
    
    setLoading(true);
    try {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      const routeCode = `ROTA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      // Create route
      const routeResponse = await railwayApi.createDeliveryRoute({
        route_code: routeCode,
        driver_id: vehicle?.driver_id ? Number(vehicle.driver_id) : undefined,
        driver_name: vehicle?.driver,
        vehicle_id: selectedVehicle,
        total_points: selectedOrders.length,
        distance_km: 18.5 // This would be calculated by a real routing service
      });
      
      const route = await routeResponse.json();
      setActiveRoute(route);
      
      // Add points to route
      const points = [];
      for (let i = 0; i < selectedOrders.length; i++) {
        const order = pendingOrders.find(o => o.id === selectedOrders[i]);
        if (order) {
          const pointResponse = await railwayApi.addDeliveryPoint(route.id.toString(), {
            sequence: i + 1,
            customer_name: order.customer,
            address: order.address,
            lat: order.coords[0],
            lng: order.coords[1],
            notes: `Pedido: ${order.id} - ${order.items} itens - ${order.weight}`
          });
          const point = await pointResponse.json();
          points.push(point);
        }
      }
      
      setRoutePoints(points);
      toast.success('Rota criada com sucesso!');
      
      // Simulate route optimization
      setTimeout(() => setRouteOptimized(true), 2000);
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Erro ao criar rota');
    } finally {
      setLoading(false);
    }
  };

  const startRoute = async () => {
    if (!activeRoute) return;
    
    setLoading(true);
    try {
      await railwayApi.startDeliveryRoute(activeRoute.id.toString());
      setActiveRoute({ ...activeRoute, status: 'EM_ANDAMENTO' });
      setDeliveryStatus('in_transit');
      toast.success('Rota iniciada!');
    } catch (error) {
      console.error('Error starting route:', error);
      toast.error('Erro ao iniciar rota');
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (pointId: string, notes: string = '') => {
    setLoading(true);
    try {
      await railwayApi.markPointAsDelivered(pointId, {
        notes,
        // In a real app, you would upload photo/signature and get URLs
        photo_url: undefined,
        signature_url: undefined
      });
      
      // Update local state
      setDeliveredOrders(prev => [...prev, pointId]);
      setDeliveryNotes(prev => ({ ...prev, [pointId]: notes }));
      
      // Update route progress
      if (activeRoute) {
        await railwayApi.updateDeliveryRoute(activeRoute.id.toString(), {
          completed_points: deliveredOrders.length + 1
        });
      }
      
      toast.success('Entrega confirmada!');
      
      // Move to next delivery
      if (currentDeliveryIndex < selectedOrders.length - 1) {
        setCurrentDeliveryIndex(prev => prev + 1);
      } else {
        // All deliveries completed
        await finishRoute();
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Erro ao confirmar entrega');
    } finally {
      setLoading(false);
    }
  };

  const finishRoute = async () => {
    if (!activeRoute) return;
    
    setLoading(true);
    try {
      await railwayApi.finishDeliveryRoute(activeRoute.id.toString());
      setActiveRoute({ ...activeRoute, status: 'CONCLUIDA' });
      setDeliveryStatus('completed');
      toast.success('Rota finalizada!');
      setTimeout(() => handleStepComplete(), 1000);
    } catch (error) {
      console.error('Error finishing route:', error);
      toast.error('Erro ao finalizar rota');
    } finally {
      setLoading(false);
    }
  };

  const renderSelecaoPedidos = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Orders List */}
      <div className="lg:col-span-2">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-medium text-white">Pedidos Verificados Disponíveis</h3>
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded">Selecionando</span>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-400 mb-4">Selecione os pedidos verificados que serão incluídos nesta rota de entrega.</p>
            </div>
            
            <div className="space-y-3">
              {pendingOrders.filter(order => order.status === 'Verificado').map((order) => (
                <div key={order.id} className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedOrders.includes(order.id) 
                    ? 'bg-primary-900/30 border-primary-800 ring-1 ring-primary-600' 
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }`} onClick={() => toggleOrder(order.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2 mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">#{order.id}</h4>
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-1">{order.customer}</p>
                        <p className="text-sm text-gray-400 mb-2">{order.address}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span><i className="fa-solid fa-box mr-1"></i>{order.items} itens</span>
                          <span><i className="fa-solid fa-weight-hanging mr-1"></i>{order.weight}</span>
                          <span><i className="fa-solid fa-truck mr-1"></i>{order.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Selection Summary */}
      <div className="lg:col-span-1">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="p-4 bg-gray-700 border-b border-gray-600">
            <h3 className="font-medium text-white">Resumo da Seleção</h3>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary-400">{selectedOrders.length}</p>
                  <p className="text-xs text-gray-400">Pedidos</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary-400">{getTotalItems()}</p>
                  <p className="text-xs text-gray-400">Itens Total</p>
                </div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg text-center mb-4">
                <p className="text-2xl font-bold text-primary-400">{getTotalWeight()} kg</p>
                <p className="text-xs text-gray-400">Peso Total</p>
              </div>
            </div>
            
            {selectedOrders.length > 0 && (
              <div className="space-y-2 mb-6">
                <h5 className="text-sm font-medium text-gray-300">Pedidos Selecionados:</h5>
                {selectedOrders.map(orderId => {
                  const order = pendingOrders.find(o => o.id === orderId);
                  return order ? (
                    <div key={orderId} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                      <span className="text-sm text-white">#{order.id}</span>
                      <button 
                        onClick={() => removeSelectedOrder(orderId)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            
            <button 
              onClick={handleStepComplete}
              disabled={selectedOrders.length === 0 || loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando rota...' : 'Avançar para Criação da Rota'}
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCriacaoRota = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Route Planning */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
          <h3 className="font-medium text-white">Planejamento da Rota</h3>
          <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded">Criando Rota</span>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-4">Otimização Automática</h4>
            
            <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-center text-yellow-400 mb-2">
                <i className="fa-solid fa-route mr-2"></i>
                <span className="font-medium">Sistema calculando melhor rota...</span>
              </div>
              <p className="text-yellow-300 text-sm">
                Considerando distância, trânsito e prioridades de entrega
              </p>
            </div>
            
            {routeOptimized && (
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-4">
                <div className="flex items-center text-green-400 mb-2">
                  <i className="fa-solid fa-check-circle mr-2"></i>
                  <span className="font-medium">Rota otimizada com sucesso!</span>
                </div>
                <div className="text-green-300 text-sm space-y-1">
                  <p>• Distância total: 18.5 km</p>
                  <p>• Tempo estimado: 2h 15min</p>
                  <p>• Economia de combustível: 15%</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-300">Sequência de Entrega:</h5>
              {selectedOrders.map((orderId, index) => {
                const order = pendingOrders.find(o => o.id === orderId);
                return order ? (
                  <div key={orderId} className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">#{order.id} - {order.customer}</p>
                      <p className="text-xs text-gray-400">{order.address}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {index === 0 ? 'Partida' : `${(index * 0.5 + 0.5).toFixed(1)}h`}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Preview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Visualização da Rota</h3>
        </div>
        <div className="p-4">
          <div className="h-[400px] mb-4">
            <DeliveryMap />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-white">18.5 km</p>
              <p className="text-xs text-gray-400">Distância</p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-white">2h 15min</p>
              <p className="text-xs text-gray-400">Tempo</p>
            </div>
          </div>
          
          <button 
            onClick={handleStepComplete}
            disabled={!routeOptimized || loading}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Confirmar Rota e Avançar'}
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCarregamento = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vehicle Selection and Loading */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
          <h3 className="font-medium text-white">Seleção de Veículo e Carregamento</h3>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Carregando</span>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-4">Escolha do Veículo</h4>
            <div className="space-y-3 mb-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedVehicle === vehicle.id 
                    ? 'bg-primary-900/30 border-primary-800 ring-1 ring-primary-600' 
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }`} onClick={() => setSelectedVehicle(vehicle.id)}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="vehicle"
                      checked={selectedVehicle === vehicle.id}
                      onChange={() => setSelectedVehicle(vehicle.id)}
                      className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 focus:ring-primary-500 mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-white">{vehicle.plate}</p>
                        <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                          {vehicle.capacity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Placa: {vehicle.plate} • Motorista: {vehicle.driver}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedVehicle && (
              <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                <h5 className="text-sm font-medium text-white mb-3">Progresso do Carregamento</h5>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Carregando pedidos...</span>
                  <span className="text-sm text-primary-400">{loadingProgress}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                
                {loadingProgress === 100 && (
                  <div className="bg-green-900/30 border border-green-800 rounded-lg p-3">
                    <div className="flex items-center text-green-400">
                      <i className="fa-solid fa-check-circle mr-2"></i>
                      <span className="text-sm font-medium">Carregamento concluído!</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Loading Checklist */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Lista de Verificação</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center p-3 bg-gray-700/30 rounded-lg">
              <i className={`fa-solid mr-3 ${
                selectedVehicle ? 'fa-check-circle text-green-400' : 'fa-circle text-gray-400'
              }`}></i>
              <span className={selectedVehicle ? 'text-white' : 'text-gray-400'}>
                Veículo selecionado
              </span>
            </div>
            <div className="flex items-center p-3 bg-gray-700/30 rounded-lg">
              <i className={`fa-solid mr-3 ${
                loadingProgress > 0 ? 'fa-check-circle text-green-400' : 'fa-circle text-gray-400'
              }`}></i>
              <span className={loadingProgress > 0 ? 'text-white' : 'text-gray-400'}>
                Carregamento iniciado
              </span>
            </div>
            <div className="flex items-center p-3 bg-gray-700/30 rounded-lg">
              <i className={`fa-solid mr-3 ${
                loadingProgress === 100 ? 'fa-check-circle text-green-400' : 'fa-circle text-gray-400'
              }`}></i>
              <span className={loadingProgress === 100 ? 'text-white' : 'text-gray-400'}>
                Todos os pedidos carregados
              </span>
            </div>
          </div>
          
          <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
            <h5 className="text-sm font-medium text-white mb-3">Resumo do Carregamento</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Pedidos:</span>
                <span className="text-white">{selectedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Peso total:</span>
                <span className="text-white">{getTotalWeight()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Veículo:</span>
                <span className="text-white">
                  {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.plate : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Motorista:</span>
                <span className="text-white">
                  {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.driver : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleStepComplete}
            disabled={loadingProgress !== 100 || loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando rota...' : 'Iniciar Entrega'}
            <i className="fa-solid fa-truck-fast ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEntregaTempoReal = () => {
    const currentOrder = selectedOrders[currentDeliveryIndex] ? pendingOrders.find(o => o.id === selectedOrders[currentDeliveryIndex]) : null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Map and Delivery */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-medium text-white">Entrega em Tempo Real</h3>
            <span className={`text-white text-xs px-2 py-1 rounded ${
              deliveryStatus === 'in_transit' ? 'bg-blue-600' :
              deliveryStatus === 'delivering' ? 'bg-yellow-600' :
              deliveryStatus === 'completed' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {deliveryStatus === 'in_transit' ? 'Em Trânsito' :
               deliveryStatus === 'delivering' ? 'Entregando' :
               deliveryStatus === 'completed' ? 'Concluído' : 'Preparando'}
            </span>
          </div>
          <div className="p-6">
            <div className="h-[300px] mb-6">
              <DeliveryMap />
            </div>
            
            {currentOrder && deliveryStatus !== 'completed' && (
              <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
                <h5 className="text-sm font-medium text-white mb-3">Entrega Atual:</h5>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">#{currentOrder.id}</p>
                    <p className="text-sm text-gray-300">{currentOrder.customer}</p>
                    <p className="text-sm text-gray-400">{currentOrder.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Progresso</p>
                    <p className="text-lg font-bold text-primary-400">
                      {currentDeliveryIndex + 1}/{selectedOrders.length}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button 
                    onClick={() => setDeliveryStatus('delivering')}
                    disabled={deliveryStatus === 'delivering'}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-xs disabled:opacity-50"
                  >
                    <i className="fa-solid fa-truck mr-1"></i>
                    Chegou
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs">
                    <i className="fa-solid fa-phone mr-1"></i>
                    Ligar
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs">
                    <i className="fa-solid fa-camera mr-1"></i>
                    Foto
                  </button>
                </div>
                
                {deliveryStatus === 'delivering' && (
                  <div className="space-y-3">
                    <textarea 
                      placeholder="Observações da entrega (opcional)..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 text-sm" 
                      rows={2}
                      value={deliveryNotes[currentOrder.id] || ''}
                      onChange={(e) => setDeliveryNotes(prev => ({ ...prev, [currentOrder.id]: e.target.value }))}
                    />
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDeliveryComplete(currentOrder.id, deliveryNotes[currentOrder.id] || '')}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium disabled:opacity-50"
                      >
                        {loading ? 'Confirmando...' : '✅ Entrega Concluída'}
                      </button>
                      <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium">
                        ❌ Problema na Entrega
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {deliveryStatus === 'completed' && (
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                <div className="flex items-center text-green-400 mb-2">
                  <i className="fa-solid fa-check-circle mr-2"></i>
                  <span className="font-medium">Todas as entregas concluídas!</span>
                </div>
                <p className="text-green-300 text-sm">
                  {deliveredOrders.length} pedidos entregues com sucesso
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Delivery Progress */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="p-4 bg-gray-700 border-b border-gray-600">
            <h3 className="font-medium text-white">Progresso das Entregas</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedOrders.map((orderId, index) => {
                const order = pendingOrders.find(o => o.id === orderId);
                const isDelivered = deliveredOrders.includes(orderId);
                const isCurrent = index === currentDeliveryIndex && !isDelivered;
                
                return order ? (
                  <div key={orderId} className={`p-3 rounded-lg border ${
                    isDelivered ? 'bg-green-900/30 border-green-800' :
                    isCurrent ? 'bg-yellow-900/30 border-yellow-800' :
                    'bg-gray-700/30 border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                          isDelivered ? 'bg-green-600 text-white' :
                          isCurrent ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {isDelivered ? <i className="fa-solid fa-check"></i> : index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">#{order.id}</p>
                          <p className="text-xs text-gray-400">{order.customer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          isDelivered ? 'text-green-400' :
                          isCurrent ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {isDelivered ? 'Entregue' :
                           isCurrent ? 'Atual' :
                           'Pendente'}
                        </p>
                        {isDelivered && (
                          <p className="text-xs text-gray-400">
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {deliveryNotes[orderId] && (
                      <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs text-gray-300">
                        <strong>Obs:</strong> {deliveryNotes[orderId]}
                      </div>
                    )}
                  </div>
                ) : null;
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Progresso:</span>
                <span className="text-primary-400 font-medium">
                  {deliveredOrders.length}/{selectedOrders.length} entregues
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(deliveredOrders.length / selectedOrders.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResumoFinal = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Delivery Summary */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
          <h3 className="font-medium text-white">Resumo Final da Entrega</h3>
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Concluído</span>
        </div>
        <div className="p-6">
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center text-green-400 mb-2">
              <i className="fa-solid fa-check-circle mr-2 text-lg"></i>
              <span className="font-medium text-lg">Entrega Concluída com Sucesso!</span>
            </div>
            <p className="text-green-300 text-sm">
              Todas as {selectedOrders.length} entregas foram realizadas conforme planejado.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{deliveredOrders.length}</p>
              <p className="text-xs text-gray-400">Entregas Realizadas</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">18.5km</p>
              <p className="text-xs text-gray-400">Distância Percorrida</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">2h 08min</p>
              <p className="text-xs text-gray-400">Tempo Total</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">100%</p>
              <p className="text-xs text-gray-400">Taxa de Sucesso</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-gray-300">Detalhes da Operação:</h5>
            <div className="bg-gray-700/30 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Data da entrega:</span>
                <span className="text-white">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Veículo utilizado:</span>
                <span className="text-white">
                  {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.plate : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Motorista:</span>
                <span className="text-white">
                  {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.driver : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Peso transportado:</span>
                <span className="text-white">{getTotalWeight()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Itens entregues:</span>
                <span className="text-white">{getTotalItems()} itens</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delivery List and Actions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Entregas Realizadas</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
            {selectedOrders.map((orderId) => {
              const order = pendingOrders.find(o => o.id === orderId);
              return order ? (
                <div key={orderId} className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                        <i className="fa-solid fa-check"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">#{order.id}</p>
                        <p className="text-xs text-gray-400">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-400 font-medium">Entregue</p>
                      <p className="text-xs text-gray-400">15:30</p>
                    </div>
                  </div>
                  {deliveryNotes[orderId] && (
                    <div className="mt-2 p-2 bg-gray-700/30 rounded text-xs text-gray-300">
                      <strong>Observações:</strong> {deliveryNotes[orderId]}
                    </div>
                  )}
                </div>
              ) : null;
            })}
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.print()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium"
            >
              <i className="fa-solid fa-download mr-2"></i>
              Gerar Relatório de Entrega
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Iniciar Nova Jornada de Entrega
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg">
              <i className="fa-solid fa-home mr-2"></i>
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderSelecaoPedidos();
      case 2:
        return renderCriacaoRota();
      case 3:
        return renderCarregamento();
      case 4:
        return renderEntregaTempoReal();
      case 5:
        return renderResumoFinal();
      default:
        return renderSelecaoPedidos();
    }
  };

  return (
    <DashboardLayout title="Jornada da Entrega" subtitle="Logística de Entrega">
      {/* Order Info Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-xs text-gray-400">Rota</span>
              <div className="font-medium">{activeRoute ? `#${activeRoute.route_code}` : '#ROTA-2023-0125'}</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Data de entrega</span>
              <div className="font-medium">{new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Veículo</span>
              <div className="font-medium">
                {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.plate : 'Não selecionado'}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Motorista</span>
              <div className="font-medium">
                {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.driver : 'Não definido'}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Status</span>
              <div className="font-medium">
                {currentStep === 1 ? 'Selecionando Pedidos' :
                 currentStep === 2 ? 'Criando Rota' :
                 currentStep === 3 ? 'Carregando Veículo' :
                 currentStep === 4 ? 'Em Entrega' :
                 'Concluído'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm hover:bg-gray-600">
              <i className="fa-solid fa-route mr-2 text-gray-400"></i>
              Ver Rota
            </button>
            <button className="flex items-center px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm hover:bg-gray-600">
              <i className="fa-solid fa-history mr-2 text-gray-400"></i>
              Histórico
            </button>
          </div>
        </div>
      </div>

      {/* Process Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-8">
            {progressSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-600' :
                    step.active ? 'bg-primary-600' : 'bg-gray-700 border-2 border-gray-600'
                  }`}>
                    <i className={`fa-solid ${
                      step.completed ? 'fa-check' : step.icon
                    } text-white`}></i>
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step.completed ? 'text-green-400' :
                    step.active ? 'text-primary-400' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < progressSteps.length - 1 && (
                  <div className={`w-20 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Progresso da entrega</div>
            <div className="font-medium text-primary-400">
              Etapa {currentStep}/5
            </div>
          </div>
        </div>
      </div>

      {/* Main Workflow Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Current Stage Info */}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              {progressSteps.find(s => s.id === currentStep)?.name}
            </h3>
            <p className="text-gray-400">
              {currentStep === 1 && 'Selecione os pedidos verificados que serão incluídos nesta rota de entrega.'}
              {currentStep === 2 && 'O sistema está criando a rota mais eficiente baseada nos endereços selecionados.'}
              {currentStep === 3 && 'Escolha o veículo adequado e acompanhe o progresso do carregamento.'}
              {currentStep === 4 && 'Acompanhe as entregas em tempo real através do mapa e registre o status de cada entrega.'}
              {currentStep === 5 && 'Visualize o resumo completo da jornada de entrega realizada.'}
            </p>
          </div>
          
          {renderCurrentStep()}

          {/* Emergency Actions */}
          {currentStep < 5 && (
            <div className="mt-8 flex justify-center">
              <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                Reportar Problema na Entrega
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}