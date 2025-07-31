'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ApiDebugPanel } from '@/lib/api-interceptor';

interface ApiTestResult {
  endpoint: string;
  method: string;
  timestamp: string;
  success: boolean;
  status?: number;
  statusText?: string;
  data?: any;
  error?: any;
}

export default function ApiTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ApiTestResult | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  
  // Mock de credenciais para login
  const testCredentials = {
    email: 'admin@veplim.com',
    password: 'admin123',
    role: 'admin'
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Importar o test runner dinamicamente
      const { apiTestRunner } = await import('@/lib/api-test-runner');
      
      // Executar testes
      const testSuite = await apiTestRunner.runAllTests();
      setResults(testSuite.results);
      
      // Salvar resultados no localStorage também
      localStorage.setItem('api-test-results', JSON.stringify(testSuite));
      
      alert(`Testes concluídos! ${testSuite.summary.success}/${testSuite.summary.total} sucesso`);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
      alert('Erro ao executar testes. Verifique o console.');
    } finally {
      setIsRunning(false);
    }
  };

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResponse = (result: ApiTestResult) => {
    const data = {
      endpoint: result.endpoint,
      method: result.method,
      timestamp: result.timestamp,
      status: result.status,
      statusText: result.statusText,
      response: result.data
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}-response.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-900 text-blue-300';
      case 'POST': return 'bg-green-900 text-green-300';
      case 'PUT': return 'bg-yellow-900 text-yellow-300';
      case 'DELETE': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <DashboardLayout title="Teste de APIs Railway" subtitle="Executar testes automatizados em todas as APIs">
      <div className="p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white">Teste Automatizado de APIs</h2>
              <p className="text-sm text-gray-400 mt-1">
                Execute testes em todos os endpoints das APIs Railway para validar e salvar as respostas
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                <i className="fa-solid fa-bug mr-2"></i>
                {showDebugPanel ? 'Ocultar' : 'Mostrar'} Debug
              </button>
              {results.length > 0 && (
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <i className="fa-solid fa-download mr-2"></i>
                  Baixar Resultados
                </button>
              )}
              <button
                onClick={runTests}
                disabled={isRunning}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Executando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play mr-2"></i>
                    Executar Testes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Credenciais de Teste */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Credenciais de Teste</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Email:</span>
                <span className="ml-2 text-white font-mono">{testCredentials.email}</span>
              </div>
              <div>
                <span className="text-gray-400">Senha:</span>
                <span className="ml-2 text-white font-mono">{testCredentials.password}</span>
              </div>
              <div>
                <span className="text-gray-400">Cargo:</span>
                <span className="ml-2 text-white font-mono">{testCredentials.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Testes */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Resultados dos Testes</h3>
              {results.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  {results.filter(r => r.success).length} sucesso, {results.filter(r => !r.success).length} falha
                </p>
              )}
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {results.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <i className="fa-solid fa-flask text-4xl mb-4"></i>
                  <p>Nenhum teste executado ainda</p>
                  <p className="text-sm mt-2">Clique em "Executar Testes" para começar</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 hover:bg-gray-700/50 cursor-pointer ${
                        selectedResult === result ? 'bg-gray-700' : ''
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getMethodColor(result.method)}`}>
                            {result.method}
                          </span>
                          <span className="text-sm text-white font-medium">{result.endpoint}</span>
                        </div>
                        {result.success ? (
                          <i className="fa-solid fa-check-circle text-green-400"></i>
                        ) : (
                          <i className="fa-solid fa-times-circle text-red-400"></i>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={getStatusColor(result.status)}>
                          {result.status} {result.statusText}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes do Teste Selecionado */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Detalhes da Resposta</h3>
              {selectedResult && (
                <button
                  onClick={() => downloadResponse(selectedResult)}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                >
                  <i className="fa-solid fa-download mr-1"></i>
                  Baixar JSON
                </button>
              )}
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {selectedResult ? (
                <div>
                  <div className="mb-4 space-y-2">
                    <div>
                      <span className="text-gray-400 text-sm">Endpoint:</span>
                      <p className="text-white font-mono">{selectedResult.endpoint}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Status:</span>
                      <p className={`font-mono ${getStatusColor(selectedResult.status)}`}>
                        {selectedResult.status} {selectedResult.statusText}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Timestamp:</span>
                      <p className="text-white font-mono">{selectedResult.timestamp}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm">Resposta:</span>
                    <pre className="mt-2 p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs text-gray-300">
                      {selectedResult.error 
                        ? JSON.stringify(selectedResult.error, null, 2)
                        : JSON.stringify(selectedResult.data, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <i className="fa-solid fa-hand-pointer text-4xl mb-4"></i>
                  <p>Selecione um teste para ver os detalhes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && <ApiDebugPanel />}
      </div>
    </DashboardLayout>
  );
}