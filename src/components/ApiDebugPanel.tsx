'use client';

import apiInterceptor from '@/lib/api-interceptor';

// Componente de Debug para visualizar logs
export function ApiDebugPanel() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md">
        <summary className="cursor-pointer text-white font-medium">
          🔍 API Debug Panel
        </summary>
        <div className="mt-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => apiInterceptor.exportLogs()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              📥 Exportar Logs
            </button>
            <button
              onClick={() => apiInterceptor.clearLogs()}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
            >
              🗑️ Limpar Logs
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            <div className="font-medium mb-2">Endpoints Logados:</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {apiInterceptor.getEndpoints().map(endpoint => (
                <div key={endpoint} className="bg-gray-700 px-2 py-1 rounded">
                  {endpoint}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <div className="font-medium mb-2">Estatísticas:</div>
            <pre className="bg-gray-700 p-2 rounded overflow-x-auto">
              {JSON.stringify(apiInterceptor.getStats(), null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}