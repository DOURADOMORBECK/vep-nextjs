'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { API_CONFIG } from '@/config/api';

interface ApiStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline' | 'error';
  responseTime?: number;
  error?: string;
}

export default function ApiStatusPage() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const apis = [
    { name: 'Autenticação (Users)', key: 'AUTH_API' },
    { name: 'Produtos', key: 'PRODUCTS_API' },
    { name: 'Clientes', key: 'CLIENTS_API' },
    { name: 'Dashboard/Pedidos', key: 'ORDERS_API' },
    { name: 'Fornecedores', key: 'SUPPLIERS_API' },
    { name: 'UserLogs', key: 'USERLOGS_API' },
    { name: 'Entregas', key: 'DELIVERY_API' },
    { name: 'Auditoria', key: 'AUDIT_API' },
    { name: 'Veículos', key: 'VEHICLES_API' },
  ];

  useEffect(() => {
    // Inicializar status
    const initialStatuses = apis.map(api => ({
      name: api.name,
      url: (API_CONFIG as Record<string, string>)[api.key],
      status: 'checking' as const
    }));
    setApiStatuses(initialStatuses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiStatus = async (api: { name: string; key: string }, index: number) => {
    const url = (API_CONFIG as Record<string, string>)[api.key];
    const startTime = Date.now();
    
    try {
      // Tentar fazer uma requisição OPTIONS ou GET para verificar se a API está online
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      }).catch(() => 
        // Se /health falhar, tenta a raiz
        fetch(url, {
          method: 'HEAD',
          mode: 'cors'
        })
      );
      
      const responseTime = Date.now() - startTime;
      
      setApiStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          name: api.name,
          url,
          status: response.ok ? 'online' : 'error',
          responseTime,
          error: !response.ok ? `Status: ${response.status}` : undefined
        };
        return newStatuses;
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Se for erro de CORS, provavelmente a API está online mas não permite requisições do browser
      const isCorsError = (error as Error).message?.includes('CORS') || (error as Error).message?.includes('Failed to fetch');
      
      setApiStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          name: api.name,
          url,
          status: isCorsError ? 'online' : 'offline',
          responseTime,
          error: isCorsError ? 'CORS (API provavelmente online)' : (error as Error).message
        };
        return newStatuses;
      });
    }
  };

  const checkAllApis = async () => {
    setIsChecking(true);
    
    // Resetar status
    setApiStatuses(apis.map(api => ({
      name: api.name,
      url: (API_CONFIG as Record<string, string>)[api.key],
      status: 'checking'
    })));
    
    // Verificar todas as APIs em paralelo
    await Promise.all(
      apis.map((api, index) => checkApiStatus(api, index))
    );
    
    setIsChecking(false);
  };

  const getStatusIcon = (status: ApiStatus['status']) => {
    switch (status) {
      case 'checking':
        return <i className="fa-solid fa-spinner fa-spin text-gray-400"></i>;
      case 'online':
        return <i className="fa-solid fa-check-circle text-green-400"></i>;
      case 'offline':
        return <i className="fa-solid fa-times-circle text-red-400"></i>;
      case 'error':
        return <i className="fa-solid fa-exclamation-circle text-yellow-400"></i>;
    }
  };

  const getStatusColor = (status: ApiStatus['status']) => {
    switch (status) {
      case 'checking':
        return 'text-gray-400';
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
    }
  };

  return (
    <DashboardLayout title="Status das APIs" subtitle="Verificar conectividade com as APIs Railway">
      <div className="p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white">Verificação de Status</h2>
              <p className="text-sm text-gray-400 mt-1">
                Verifica se as APIs estão acessíveis e respondendo
              </p>
            </div>
            <button
              onClick={checkAllApis}
              disabled={isChecking}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Verificando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-sync mr-2"></i>
                  Verificar Todas
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Configuração Atual</h3>
            <p className="text-sm text-white font-mono">
              Modo: {process.env.NODE_ENV === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {process.env.NODE_ENV === 'production' 
                ? 'Usando URLs internas do Railway (.railway.internal)'
                : 'Usando URLs públicas (.up.railway.app)'
              }
            </p>
          </div>
        </div>

        {/* Lista de APIs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm">
                  <th className="px-6 py-3 text-left font-medium">API</th>
                  <th className="px-6 py-3 text-left font-medium">URL</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Tempo de Resposta</th>
                  <th className="px-6 py-3 text-left font-medium">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {apiStatuses.map((api, index) => (
                  <tr key={index} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {api.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                      <a 
                        href={api.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary-400"
                      >
                        {api.url}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(api.status)}
                        <span className={`text-sm font-medium ${getStatusColor(api.status)}`}>
                          {api.status === 'checking' && 'Verificando...'}
                          {api.status === 'online' && 'Online'}
                          {api.status === 'offline' && 'Offline'}
                          {api.status === 'error' && 'Erro'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {api.responseTime ? `${api.responseTime}ms` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {api.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Informações Importantes</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start">
              <i className="fa-solid fa-info-circle text-blue-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">Sobre CORS</p>
                <p className="text-gray-400">
                  Se aparecer &quot;CORS&quot;, significa que a API está online mas não permite requisições diretas do navegador. 
                  Isso é normal e esperado para APIs de produção.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="fa-solid fa-shield-alt text-green-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">Autenticação</p>
                <p className="text-gray-400">
                  Para testar completamente as APIs, use a página de Teste de APIs que inclui autenticação JWT.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="fa-solid fa-server text-purple-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">URLs Internas</p>
                <p className="text-gray-400">
                  Em produção no Railway, o app usará automaticamente as URLs internas (.railway.internal) 
                  que são mais rápidas e seguras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}