'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { railwayApi } from '@/lib/api-interceptor';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  code: string;
  assemblyInstructions?: string;
  components?: string[];
  targetQuantity?: number;
}

export default function JornadaProdutoPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Montagem, 2: Embalagem, 3: Verificação Final
  const [currentItem] = useState(0);
  const [assembledQuantity, setAssembledQuantity] = useState(0);
  const [observations, setObservations] = useState('');
  const [assemblyStartTime] = useState(new Date());
  const [selectedPackaging, setSelectedPackaging] = useState('');
  const [finalVerificationStatus, setFinalVerificationStatus] = useState('pending'); // pending, approved, rejected
  const [rejectionReason, setRejectionReason] = useState('');
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, item: 'Todos os componentes presentes', checked: false },
    { id: 2, item: 'Componentes em perfeito estado', checked: false },
    { id: 3, item: 'Montagem seguindo especificações', checked: false },
    { id: 4, item: 'Teste de qualidade aprovado', checked: false },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const progressSteps = [
    { id: 1, name: 'Montagem', icon: 'fa-screwdriver-wrench', active: currentStep === 1, completed: currentStep > 1 },
    { id: 2, name: 'Embalagem', icon: 'fa-box', active: currentStep === 2, completed: currentStep > 2 },
    { id: 3, name: 'Verificação Final', icon: 'fa-clipboard-check', active: currentStep === 3, completed: false },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await railwayApi.getProducts();
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast.error('Erro ao buscar produtos');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao conectar com servidor de produtos');
    } finally {
      setLoading(false);
    }
  };

  const currentProduct = products[currentItem] || null;
  const totalItems = products.length;

  const packagingOptions = [
    { id: 'cardboard_small', name: 'Caixa de Papelão Pequena', description: '20x15x10 cm' },
    { id: 'cardboard_medium', name: 'Caixa de Papelão Média', description: '30x25x15 cm' },
    { id: 'cardboard_large', name: 'Caixa de Papelão Grande', description: '40x35x20 cm' },
    { id: 'plastic_bag', name: 'Embalagem Plástica', description: 'Resistente à água' },
    { id: 'thermal', name: 'Embalagem Térmica', description: 'Para produtos refrigerados' },
  ];

  const updateQuantity = (change: number) => {
    const newQuantity = Math.max(0, assembledQuantity + change);
    setAssembledQuantity(newQuantity);
  };

  const toggleChecklistItem = (id: number) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleStepComplete = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinalApproval = (status: 'approved' | 'rejected') => {
    setFinalVerificationStatus(status);
    if (status === 'approved') {
      alert('🎉 Produto aprovado e liberado para expedição!');
    }
  };

  const getElapsedTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - assemblyStartTime.getTime()) / 1000 / 60);
    return `${diff} min`;
  };

  const overallProgress = Math.round((2 / totalItems) * 100);

  const renderMontagem = () => {
    if (!currentProduct) {
      return (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Nenhum produto disponível</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Item Assembly */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-medium text-white">Montagem - Item {currentItem + 1} de {totalItems}</h3>
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded">Em Montagem</span>
          </div>
          <div className="p-6">
            <div className="mb-4 aspect-video bg-gray-700 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <i className="fa-solid fa-image text-gray-500 text-4xl"></i>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-white mb-1">{currentProduct.name}</h4>
              <p className="text-gray-400 text-sm">Código: {currentProduct.code}</p>
              <p className="text-gray-400 text-sm">Responsável: Carregando...</p>
              <p className="text-gray-400 text-sm">Tempo decorrido: {getElapsedTime()}</p>
            </div>
          
          {/* Assembly Checklist */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-300 mb-3">Checklist de Montagem</h5>
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label className={`ml-3 text-sm ${item.checked ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                    {item.item}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Quantidade Esperada</p>
              <p className="text-xl font-semibold text-white">20 unidades</p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Quantidade Montada</p>
              <p className="text-xl font-semibold text-primary-400">{assembledQuantity} unidades</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ajustar Quantidade
            </label>
            <div className="flex">
              <button 
                onClick={() => updateQuantity(-1)}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded-l-lg px-4 py-2 border-r border-gray-600"
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <input 
                type="number" 
                value={assembledQuantity}
                onChange={(e) => setAssembledQuantity(parseInt(e.target.value) || 0)}
                className="bg-gray-700 text-white text-center w-full py-2"
              />
              <button 
                onClick={() => updateQuantity(1)}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded-r-lg px-4 py-2 border-l border-gray-600"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações da Montagem
            </label>
            <textarea 
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500" 
              rows={3} 
              placeholder="Registre observações sobre o processo de montagem..."
            />
          </div>
          </div>
          <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-between">
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
              <i className="fa-solid fa-camera mr-2"></i>
              Foto da Montagem
            </button>
            <button 
              onClick={handleStepComplete}
              disabled={checklistItems.some(item => !item.checked)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Concluir Montagem
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>

      {/* Assembly Progress */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Progresso da Montagem</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-white">Progresso Geral</h4>
            <span className="text-sm text-primary-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div className="flex items-center p-3 bg-primary-900/30 rounded-lg border border-primary-800/50">
              <div className="mr-3">
                <i className="fa-solid fa-circle-check text-primary-500 text-lg"></i>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-white">Tomate Italiano</h5>
                <p className="text-xs text-gray-400">10 unidades - Montado por Maria Santos</p>
              </div>
              <span className="text-xs text-primary-400 font-medium">Completo</span>
            </div>

            <div className="flex items-center p-3 bg-primary-900/30 rounded-lg border border-primary-800/50">
              <div className="mr-3">
                <i className="fa-solid fa-circle-check text-primary-500 text-lg"></i>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-white">Cebola Roxa</h5>
                <p className="text-xs text-gray-400">15 unidades - Montado por João Silva</p>
              </div>
              <span className="text-xs text-primary-400 font-medium">Completo</span>
            </div>

            <div className="flex items-center p-3 bg-primary-900/20 rounded-lg border border-primary-800/20">
              <div className="mr-3">
                <i className="fa-solid fa-spinner fa-spin text-primary-400 text-lg"></i>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-white">Alface Crespa Orgânica</h5>
                <p className="text-xs text-gray-400">{assembledQuantity}/20 unidades - João Silva</p>
              </div>
              <span className="text-xs text-yellow-400 font-medium">Em Montagem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  const renderEmbalagem = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Packaging Selection */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Seleção de Embalagem</h3>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-4">Escolha o tipo de embalagem ideal</h4>
            <div className="space-y-3">
              {packagingOptions.map((option) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={option.id}
                    name="packaging"
                    value={option.id}
                    checked={selectedPackaging === option.id}
                    onChange={(e) => setSelectedPackaging(e.target.value)}
                    className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 focus:ring-primary-500"
                  />
                  <label htmlFor={option.id} className="ml-3 flex-1">
                    <div className="text-sm font-medium text-white">{option.name}</div>
                    <div className="text-xs text-gray-400">{option.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-300 mb-3">Etiquetas e Identificação</h5>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400">Etiqueta do Cliente</div>
                <div className="font-medium text-white">#CLIENTE-001 - Mercado São José</div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400">Código do Pedido</div>
                <div className="font-medium text-white">#PED-2023-0458</div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400">Data de Validade</div>
                <div className="font-medium text-white">28/08/2023</div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-between">
          <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
            <i className="fa-solid fa-camera mr-2"></i>
            Foto da Embalagem
          </button>
          <button 
            onClick={handleStepComplete}
            disabled={!selectedPackaging}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
          >
            Concluir Embalagem
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      {/* Packaging Preview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Registro Fotográfico</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="border border-dashed border-gray-600 rounded-lg p-8 text-center">
              <i className="fa-solid fa-camera text-gray-500 text-3xl mb-3"></i>
              <p className="text-gray-400 mb-3">Foto da embalagem finalizada</p>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
                Capturar Foto
              </button>
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-2">Informações da Embalagem</h5>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Responsável: João da Silva</div>
                <div>Data/Hora: {new Date().toLocaleString('pt-BR')}</div>
                <div>Tipo: {packagingOptions.find(p => p.id === selectedPackaging)?.name || 'Não selecionado'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerificacaoFinal = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Final Verification */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Verificação Final</h3>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-4">Conferência Visual e de Integridade</h4>
            
            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Produto embalado corretamente</span>
                <i className="fa-solid fa-eye text-primary-400"></i>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Etiquetas aplicadas corretamente</span>
                <i className="fa-solid fa-tag text-primary-400"></i>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Integridade do produto preservada</span>
                <i className="fa-solid fa-shield-halved text-primary-400"></i>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Documentação completa</span>
                <i className="fa-solid fa-clipboard-check text-primary-400"></i>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleFinalApproval('approved')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
              >
                <i className="fa-solid fa-check mr-2"></i>
                ✅ APROVAR - Liberar para Expedição
              </button>
              
              <button 
                onClick={() => setFinalVerificationStatus('rejected')}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium"
              >
                <i className="fa-solid fa-times mr-2"></i>
                ❌ REPROVAR - Requer Correção
              </button>
            </div>

            {finalVerificationStatus === 'rejected' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motivo da Reprovação
                </label>
                <select 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 mb-3"
                >
                  <option value="">Selecione o motivo</option>
                  <option value="dano">Produto com dano</option>
                  <option value="erro_montagem">Erro na montagem</option>
                  <option value="falta_componente">Falta de componente</option>
                  <option value="embalagem_inadequada">Embalagem inadequada</option>
                  <option value="etiqueta_incorreta">Etiqueta incorreta</option>
                  <option value="outro">Outro motivo</option>
                </select>
                <textarea 
                  placeholder="Descreva o problema detalhadamente..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500" 
                  rows={3}
                />
                <button className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">
                  Confirmar Reprovação
                </button>
              </div>
            )}

            {finalVerificationStatus === 'approved' && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-800 rounded-lg">
                <div className="flex items-center text-green-400">
                  <i className="fa-solid fa-check-circle mr-2"></i>
                  <span className="font-medium">Produto aprovado e liberado para expedição!</span>
                </div>
                <div className="text-xs text-green-300 mt-2">
                  Aprovado por: João da Silva<br />
                  Data/Hora: {new Date().toLocaleString('pt-BR')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Summary */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <h3 className="font-medium text-white">Resumo do Produto</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-3">Informações Finais</h5>
              <div className="text-xs text-gray-300 space-y-2">
                <div className="flex justify-between">
                  <span>Produto:</span>
                  <span>Alface Crespa Orgânica</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantidade:</span>
                  <span>{assembledQuantity} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span>Embalagem:</span>
                  <span>{packagingOptions.find(p => p.id === selectedPackaging)?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Total:</span>
                  <span>{getElapsedTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Responsável:</span>
                  <span>João da Silva</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-3">Fotos do Processo</h5>
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square bg-gray-600 rounded flex items-center justify-center">
                  <i className="fa-solid fa-image text-gray-400"></i>
                </div>
                <div className="aspect-square bg-gray-600 rounded flex items-center justify-center">
                  <i className="fa-solid fa-image text-gray-400"></i>
                </div>
                <div className="aspect-square bg-gray-600 rounded flex items-center justify-center">
                  <i className="fa-solid fa-image text-gray-400"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderMontagem();
      case 2:
        return renderEmbalagem();
      case 3:
        return renderVerificacaoFinal();
      default:
        return renderMontagem();
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Jornada do Produto">
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Carregando produtos...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (products.length === 0) {
    return (
      <DashboardLayout title="Jornada do Produto">
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Nenhum produto em produção</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Jornada do Produto">
      <div className="flex bg-gray-900 h-full">
        {/* Product Journey Navigation */}
        <div className="w-64 border-r border-gray-700 bg-gray-800">
          <div className="p-4 border-b border-gray-700 flex items-center">
            <div className="bg-primary-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">
              <i className="fa-solid fa-industry"></i>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Preparação Interna</div>
              <div className="text-xs text-gray-400">Produto → Expedição</div>
            </div>
          </div>
          
          {progressSteps.map((step) => (
            <div 
              key={step.id}
              className={`p-4 border-b border-gray-700 flex items-center justify-between cursor-pointer ${
                step.active ? 'bg-primary-900/30' : step.completed ? 'bg-green-900/20' : ''
              }`}
              onClick={() => step.completed || step.active ? setCurrentStep(step.id) : null}
            >
              <div className="flex items-center">
                <div className={`mr-3 ${
                  step.completed ? 'text-green-400' : 
                  step.active ? 'text-primary-400' : 'text-gray-400'
                }`}>
                  <i className={`fa-solid ${
                    step.completed ? 'fa-check-circle' : step.icon
                  }`}></i>
                </div>
                <div className={`text-sm font-medium ${
                  step.active ? 'text-white' : 
                  step.completed ? 'text-green-300' : 'text-gray-300'
                }`}>
                  {step.name}
                </div>
              </div>
              {step.active && (
                <div className="text-primary-400">
                  <i className="fa-solid fa-chevron-right"></i>
                </div>
              )}
              {step.completed && (
                <div className="text-green-400">
                  <i className="fa-solid fa-check"></i>
                </div>
              )}
            </div>
          ))}

          <div className="p-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">Pedido #PED-2023-0458</h3>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">Mercado São José</span>
                </div>
                <div className="flex justify-between">
                  <span>Data prevista:</span>
                  <span className="font-medium">28/07/2023</span>
                </div>
                <div className="flex justify-between">
                  <span>Itens:</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operador:</span>
                  <span className="font-medium">João da Silva</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    currentStep === 1 ? 'text-yellow-400' :
                    currentStep === 2 ? 'text-blue-400' :
                    finalVerificationStatus === 'approved' ? 'text-green-400' :
                    finalVerificationStatus === 'rejected' ? 'text-red-400' :
                    'text-orange-400'
                  }`}>
                    {currentStep === 1 ? 'Em Montagem' :
                     currentStep === 2 ? 'Em Embalagem' :
                     finalVerificationStatus === 'approved' ? 'Aprovado' :
                     finalVerificationStatus === 'rejected' ? 'Reprovado' :
                     'Verificação Final'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Journey Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              {progressSteps.find(s => s.id === currentStep)?.name}
            </h2>
            <div className="flex space-x-3">
              <button 
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : null}
                disabled={currentStep === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center disabled:opacity-50"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Etapa Anterior
              </button>
              {finalVerificationStatus === 'approved' && (
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center">
                  Enviar para Expedição
                  <i className="fa-solid fa-truck ml-2"></i>
                </button>
              )}
            </div>
          </div>

          {renderCurrentStep()}
        </div>
      </div>
    </DashboardLayout>
  );
}