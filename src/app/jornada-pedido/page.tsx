'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { localApi } from '@/lib/local-api';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  customer: string;
  products: Product[];
  status: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  expectedQuantity: number;
  category: string;
  location: string;
  batch: string;
  expiry: string;
  image: string;
}

export default function JornadaPedidoPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Separação, 2: Etiquetagem, 3: Verificação
  const [currentProduct, setCurrentProduct] = useState(0);
  const [separationQuantity, setSeparationQuantity] = useState(0);
  const [labelingQuantity, setLabelingQuantity] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, approved, blocked
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const progressSteps = [
    { id: 1, name: 'Separação', icon: 'fa-box', active: currentStep === 1, completed: currentStep > 1 },
    { id: 2, name: 'Etiquetagem', icon: 'fa-tag', active: currentStep === 2, completed: currentStep > 2 },
    { id: 3, name: 'Verificação', icon: 'fa-check-double', active: currentStep === 3, completed: false },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await localApi.getOrders();
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrder(data[0]);
        }
      } else {
        toast.error('Erro ao buscar pedidos');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao conectar com servidor de pedidos');
    } finally {
      setLoading(false);
    }
  };

  const currentProductData = selectedOrder?.products[currentProduct] || null;
  const totalProducts = selectedOrder?.products.length || 0;

  // Touch buttons for labeling step
  const touchButtons = [
    { value: 1, label: '+1', color: 'bg-gray-600' },
    { value: 3, label: '+3', color: 'bg-gray-600' },
    { value: 5, label: '+5', color: 'bg-primary-600' },
    { value: 10, label: '+10', color: 'bg-blue-600' },
    { value: 50, label: '+50', color: 'bg-purple-600' },
    { value: -1, label: '-1', color: 'bg-red-600' },
    { value: -3, label: '-3', color: 'bg-red-600' },
    { value: -5, label: '-5', color: 'bg-red-700' },
    { value: -10, label: '-10', color: 'bg-red-700' },
    { value: -50, label: '-50', color: 'bg-red-800' },
  ];

  const updateSeparationQuantity = (value: number) => {
    const newQuantity = Math.max(0, separationQuantity + value);
    setSeparationQuantity(newQuantity);
  };

  const updateLabelingQuantity = (value: number) => {
    const newQuantity = Math.max(0, labelingQuantity + value);
    setLabelingQuantity(newQuantity);
  };

  const handleStepComplete = () => {
    if (currentStep === 1 && separationQuantity > 0) {
      setCurrentStep(2);
    } else if (currentStep === 2 && labelingQuantity > 0) {
      setCurrentStep(3);
      // Check for discrepancy
      if (currentProductData && Math.abs(labelingQuantity - currentProductData.expectedQuantity) > 0) {
        setHasDiscrepancy(true);
        // Play audio alert (would be implemented with Web Audio API)
        playAlertSound();
      }
    }
  };

  const playAlertSound = () => {
    // In a real implementation, this would play an audio alert
    console.log('🔊 ALERTA: Divergência detectada!');
    if (currentProductData) {
      alert('⚠️ ATENÇÃO: Quantidade divergente detectada!\n\n' + 
            `Esperado: ${currentProductData.expectedQuantity} unidades\n` +
            `Etiquetado: ${labelingQuantity} unidades\n\n` +
            'Verifique antes de prosseguir.');
    }
  };

  const handleVerification = (status: 'approved' | 'blocked') => {
    setVerificationStatus(status);
    if (status === 'approved') {
      alert('✅ Item aprovado! Avançando para o próximo produto...');
      // Move to next product or complete
      if (currentProduct < totalProducts) {
        setCurrentProduct(currentProduct + 1);
        setCurrentStep(1);
        setSeparationQuantity(0);
        setLabelingQuantity(0);
        setVerificationStatus('pending');
        setHasDiscrepancy(false);
      } else {
        alert('🎉 Todos os produtos foram processados com sucesso!');
      }
    }
  };

  const renderSeparacao = () => {
    if (!currentProductData) {
      return (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Nenhum produto disponível</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Display */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-medium text-white">Separação - Produto {currentProduct + 1} de {totalProducts}</h3>
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded">Coletando</span>
          </div>
          <div className="p-6">
            <div className="mb-4 aspect-video bg-gray-700 rounded-lg overflow-hidden relative">
              {currentProductData.image ? (
                <Image 
                  className="object-contain" 
                  src={currentProductData.image}
                  alt={currentProductData.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-gray-500 text-4xl"></i>
                </div>
              )}
            </div>
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-white mb-2">{currentProductData.name}</h4>
              <p className="text-gray-400 mb-4">Colete e confirme visualmente cada item baseado nas informações abaixo.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Código</span>
                  <p className="font-medium text-white">{currentProductData.code}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Categoria</span>
                  <p className="font-medium text-white">{currentProductData.category}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Localização</span>
                  <p className="font-medium text-white">{currentProductData.location}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Lote</span>
                  <p className="font-medium text-white">{currentProductData.batch}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Validade</span>
                  <p className="font-medium text-white">{currentProductData.expiry}</p>
                </div>
                <div className="bg-primary-800 p-4 rounded-lg">
                  <span className="text-sm text-primary-300">Quantidade</span>
                  <p className="font-bold text-xl text-primary-400">{currentProductData.expectedQuantity} unidades</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separation Controls */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="p-4 bg-gray-700 border-b border-gray-600">
            <h3 className="font-medium text-white">Confirmação da Coleta</h3>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Quantidade esperada</span>
                  <span className="font-bold text-xl text-primary-400">{currentProductData?.expectedQuantity || 0} unidades</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (separationQuantity / (currentProductData?.expectedQuantity || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-300 mb-3">Quantidade coletada</label>
              <div className="flex items-center justify-center mb-6">
                <button 
                  onClick={() => updateSeparationQuantity(-1)}
                  className="w-12 h-12 bg-red-600 rounded-l-lg flex items-center justify-center text-white hover:bg-red-700"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <div className="w-32 h-12 bg-gray-700 border-y border-gray-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{separationQuantity}</span>
                </div>
                <button 
                  onClick={() => updateSeparationQuantity(1)}
                  className="w-12 h-12 bg-green-600 rounded-r-lg flex items-center justify-center text-white hover:bg-green-700"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm mb-2">Conferência visual realizada?</p>
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={() => setSeparationQuantity(currentProductData?.expectedQuantity || 0)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    ✓ Conferido Visualmente
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-between">
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Produto Anterior
            </button>
            <button 
              onClick={handleStepComplete}
              disabled={separationQuantity === 0}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Avançar para Etiquetagem
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEtiquetagem = () => {
    if (!currentProductData) {
      return (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Nenhum produto disponível</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Display (without quantity) */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-medium text-white">Etiquetagem - Produto {currentProduct + 1} de {totalProducts}</h3>
            <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded">Etiquetando</span>
          </div>
          <div className="p-6">
            <div className="mb-4 aspect-video bg-gray-700 rounded-lg overflow-hidden relative">
              {currentProductData.image ? (
                <Image 
                  className="object-contain" 
                  src={currentProductData.image}
                  alt={currentProductData.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-gray-500 text-4xl"></i>
                </div>
              )}
            </div>
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-white mb-2">{currentProductData.name}</h4>
              <p className="text-yellow-400 mb-4">
                ⚠️ Lance manualmente a quantidade usando os botões de toque.<br/>
                <strong>A quantidade esperada está oculta para atenção ativa.</strong>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Código</span>
                  <p className="font-medium text-white">{currentProductData.code}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Categoria</span>
                  <p className="font-medium text-white">{currentProductData.category}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Lote</span>
                  <p className="font-medium text-white">{currentProductData.batch}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-400">Validade</span>
                  <p className="font-medium text-white">{currentProductData.expiry}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Touch Controls */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="p-4 bg-gray-700 border-b border-gray-600">
            <h3 className="font-medium text-white">Controle de Etiquetagem</h3>
          </div>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-gray-700 p-6 rounded-lg mb-6">
                <p className="text-sm text-gray-400 mb-2">Quantidade etiquetada</p>
                <div className="text-6xl font-bold text-white mb-2">{labelingQuantity}</div>
                <p className="text-gray-400">unidades</p>
              </div>
              
              <p className="text-yellow-400 text-sm mb-4">
                🎯 <strong>Etapa de atenção ativa</strong><br/>
                Use os botões de toque para lançar a quantidade exata
              </p>
            </div>

            {/* Touch Buttons */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {touchButtons.map((button) => (
                <button 
                  key={button.value}
                  onClick={() => updateLabelingQuantity(button.value)}
                  className={`${button.color} hover:opacity-80 text-white rounded-lg py-4 px-2 font-bold text-lg transition-all active:scale-95`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-center text-yellow-400">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                <span className="text-sm font-medium">Conferência manual obrigatória</span>
              </div>
              <p className="text-xs text-yellow-300 mt-1">
                Conte manualmente e insira a quantidade exata usando os botões
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-between">
            <button 
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Voltar à Separação
            </button>
            <button 
              onClick={handleStepComplete}
              disabled={labelingQuantity === 0}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Avançar para Verificação
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderVerificacao = () => {
    if (!currentProductData) {
      return (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Nenhum produto disponível</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Display */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-medium text-white">Verificação - Produto {currentProduct + 1} de {totalProducts}</h3>
            <span className={`text-white text-xs px-2 py-1 rounded ${
              hasDiscrepancy ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {hasDiscrepancy ? 'Divergência' : 'Verificando'}
            </span>
          </div>
          <div className="p-6">
          <div className="mb-6">
            <h4 className="text-2xl font-bold text-white mb-2">{currentProductData.name}</h4>
            <p className="text-gray-400 mb-4">Comparação automática das quantidades lançadas</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Quantidade original do pedido</span>
                <span className="font-bold text-white text-xl">{currentProductData.expectedQuantity}</span>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Quantidade etiquetada</span>
                <span className="font-bold text-white text-xl">{labelingQuantity}</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              hasDiscrepancy 
                ? 'bg-red-900/30 border border-red-800' 
                : 'bg-green-900/30 border border-green-800'
            }`}>
              <div className="flex justify-between items-center">
                <span className={hasDiscrepancy ? 'text-red-300' : 'text-green-300'}>
                  Diferença detectada
                </span>
                <span className={`font-bold text-xl ${
                  hasDiscrepancy ? 'text-red-400' : 'text-green-400'
                }`}>
                  {hasDiscrepancy 
                    ? `${labelingQuantity - currentProductData.expectedQuantity > 0 ? '+' : ''}${labelingQuantity - currentProductData.expectedQuantity}`
                    : '0'
                  }
                </span>
              </div>
            </div>
          </div>

          {hasDiscrepancy && (
            <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center text-red-400 mb-2">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                <span className="font-bold">⚠️ ALERTA VISUAL E SONORO</span>
              </div>
              <p className="text-red-300 text-sm">
                Divergência detectada entre a quantidade original ({currentProductData.expectedQuantity}) 
                e a quantidade etiquetada ({labelingQuantity}). 
                Verifique antes de prosseguir.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Actions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Ações de Verificação</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h5 className="text-white font-medium mb-3">Resultado da Comparação</h5>
              <div className="space-y-2">
                <div className="flex items-center">
                  <i className={`fa-solid mr-3 ${
                    hasDiscrepancy ? 'fa-times-circle text-red-400' : 'fa-check-circle text-green-400'
                  }`}></i>
                  <span className={hasDiscrepancy ? 'text-red-300' : 'text-green-300'}>
                    {hasDiscrepancy ? 'Quantidade divergente detectada' : 'Quantidades conferem'}
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-eye mr-3 text-blue-400"></i>
                  <span className="text-blue-300">Verificação visual necessária</span>
                </div>
                <div className="flex items-center">
                  <i className={`fa-solid mr-3 ${
                    hasDiscrepancy ? 'fa-volume-up text-red-400' : 'fa-volume-off text-gray-400'
                  }`}></i>
                  <span className={hasDiscrepancy ? 'text-red-300' : 'text-gray-300'}>
                    {hasDiscrepancy ? 'Alerta sonoro ativado' : 'Sem alertas'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleVerification('approved')}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  hasDiscrepancy 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <i className="fa-solid fa-check mr-2"></i>
                {hasDiscrepancy ? '⚠️ APROVAR MESMO COM DIVERGÊNCIA' : '✅ APROVAR - Seguir em Frente'}
              </button>
              
              <button 
                onClick={() => handleVerification('blocked')}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium"
              >
                <i className="fa-solid fa-ban mr-2"></i>
                ❌ BLOQUEAR - Requer Correção
              </button>

              <button 
                onClick={() => setCurrentStep(2)}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Voltar à Etiquetagem
              </button>
            </div>

            {verificationStatus === 'blocked' && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg">
                <div className="flex items-center text-red-400 mb-2">
                  <i className="fa-solid fa-ban mr-2"></i>
                  <span className="font-medium">Etapa seguinte bloqueada</span>
                </div>
                <p className="text-red-300 text-sm">
                  O produto foi bloqueado devido à divergência. 
                  Corrija a quantidade na etapa de etiquetagem antes de prosseguir.
                </p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderSeparacao();
      case 2:
        return renderEtiquetagem();
      case 3:
        return renderVerificacao();
      default:
        return renderSeparacao();
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Jornada do Pedido" subtitle="Preparação Física">
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Carregando pedidos...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedOrder) {
    return (
      <DashboardLayout title="Jornada do Pedido" subtitle="Preparação Física">
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Nenhum pedido pendente</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Jornada do Pedido" subtitle="Preparação Física">
      {/* Order Info Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-xs text-gray-400">Pedido</span>
              <div className="font-medium">#{selectedOrder.id}</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Cliente</span>
              <div className="font-medium">{selectedOrder.customer}</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Status</span>
              <div className="font-medium">{selectedOrder.status}</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Total de itens</span>
              <div className="font-medium">{totalProducts} produtos</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Operador</span>
              <div className="font-medium">Carregando...</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm hover:bg-gray-600">
              <i className="fa-solid fa-file-alt mr-2 text-gray-400"></i>
              Detalhes
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
        <div className="flex items-center justify-between max-w-4xl mx-auto">
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
            <div className="text-sm text-gray-400">Progresso do pedido</div>
            <div className="font-medium text-primary-400">{currentProduct}/{totalProducts} produtos</div>
          </div>
        </div>
      </div>

      {/* Main Workflow Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Current Stage Info */}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Etapa: {progressSteps.find(s => s.id === currentStep)?.name}
            </h3>
            <p className="text-gray-400">
              {currentStep === 1 && 'Colete e confirme visualmente cada item baseado nas informações exibidas.'}
              {currentStep === 2 && 'Lance manualmente a quantidade usando os botões de toque. A quantidade esperada está oculta.'}
              {currentStep === 3 && 'O sistema compara as quantidades e exibe alertas em caso de divergência.'}
            </p>
          </div>
          
          {renderCurrentStep()}

          {/* Emergency Actions */}
          <div className="mt-8 flex justify-center">
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              Reportar Problema no Produto
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}