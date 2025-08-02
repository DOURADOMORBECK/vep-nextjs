'use client';

import { useState } from 'react';
import { RealTimeSyncModal } from '@/components/RealTimeSyncModal';

export default function SyncTestPage() {
  const [showSync, setShowSync] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Teste de Sincronização FinancesWeb</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Sincronização Manual</h2>
          <p className="text-gray-300 mb-6">
            Clique no botão abaixo para iniciar uma sincronização completa com o FinancesWeb ERP.
            Isso irá buscar todos os dados e salvar no banco de dados local.
          </p>
          
          <button
            onClick={() => setShowSync(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-sync mr-2"></i>
            Iniciar Sincronização Completa
          </button>
          
          {lastResult && (
            <div className={`mt-6 p-4 rounded-lg ${lastResult.success ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'} border`}>
              <p className={`${lastResult.success ? 'text-green-300' : 'text-red-300'}`}>
                <i className={`fa-solid ${lastResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                {lastResult.message}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Informações da API</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-400">Endpoint:</dt>
              <dd className="text-gray-300 font-mono text-sm">https://flow.financesweb.com.br/webhook/financeserp</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Método:</dt>
              <dd className="text-gray-300">GET</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">API Key:</dt>
              <dd className="text-gray-300 font-mono text-sm">18028EFB...****</dd>
            </div>
          </dl>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Entidades Disponíveis</h3>
            <ul className="space-y-2 text-gray-300">
              <li><i className="fa-solid fa-box text-blue-400 mr-2"></i>Produtos (fnc_produtos_e_servicos)</li>
              <li><i className="fa-solid fa-users text-green-400 mr-2"></i>Pessoas (fnc_pessoas)</li>
              <li><i className="fa-solid fa-user-tie text-yellow-400 mr-2"></i>Operadores (fnc_operadores)</li>
              <li><i className="fa-solid fa-shopping-cart text-purple-400 mr-2"></i>Pedidos (vw_pedidos_venda_produtos)</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Status do Sistema</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <i className="fa-solid fa-circle text-green-400 text-xs mr-2"></i>
                API FinancesWeb: Online
              </li>
              <li className="flex items-center">
                <i className="fa-solid fa-circle text-green-400 text-xs mr-2"></i>
                Banco de Dados: Conectado
              </li>
              <li className="flex items-center">
                <i className="fa-solid fa-circle text-yellow-400 text-xs mr-2"></i>
                Última Sincronização: Nunca
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <RealTimeSyncModal
        isOpen={showSync}
        onClose={() => setShowSync(false)}
        onComplete={(success) => {
          setLastResult({
            success,
            message: success 
              ? 'Sincronização concluída com sucesso!' 
              : 'Alguns erros ocorreram durante a sincronização. Verifique os logs.'
          });
        }}
      />
    </div>
  );
}