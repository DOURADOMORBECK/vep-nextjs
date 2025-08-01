'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type SyncResult = {
  timestamp: string;
  results: {
    [key: string]: {
      inseridos?: number;
      atualizados?: number;
      erros?: number;
      total?: number;
      status: string;
      error?: string;
    };
  };
  errors: Array<{ entity: string; error: string }>;
  success: boolean;
};

export function FinanceswebSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const syncData = async (entity?: string) => {
    setSyncing(true);
    setSyncingEntity(entity || 'all');
    
    try {
      const url = entity 
        ? `/api/financesweb/sync?entity=${entity}`
        : '/api/financesweb/sync';
      
      const response = await fetch(url, {
        method: 'POST',
      });
      
      const result = await response.json();
      setLastSync(result);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setLastSync({
        timestamp: new Date().toISOString(),
        results: {},
        errors: [{
          entity: entity || 'all',
          error: 'Erro de conexão com o servidor'
        }],
        success: false
      });
    } finally {
      setSyncing(false);
      setSyncingEntity(null);
    }
  };

  const entities = [
    { id: 'produtos', name: 'Produtos', icon: '📦' },
    { id: 'operadores', name: 'Operadores', icon: '👤' },
    { id: 'pessoas', name: 'Pessoas', icon: '🏢' },
    { id: 'pedidos', name: 'Pedidos', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sincronização FinancesWeb</CardTitle>
          <CardDescription>
            Sincronize os dados do FinancesWeb com o banco de dados local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Botão de sincronização geral */}
            <div className="flex justify-center">
              <Button
                onClick={() => syncData()}
                disabled={syncing}
                size="lg"
                className="w-full max-w-sm"
              >
                {syncing && syncingEntity === 'all' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando tudo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar Tudo
                  </>
                )}
              </Button>
            </div>

            {/* Botões individuais */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {entities.map((entity) => (
                <Button
                  key={entity.id}
                  onClick={() => syncData(entity.id)}
                  disabled={syncing}
                  variant="outline"
                  className="h-auto py-4"
                >
                  {syncing && syncingEntity === entity.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl mb-1">{entity.icon}</div>
                      <div className="text-sm">{entity.name}</div>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da última sincronização */}
      {lastSync && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastSync.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Última Sincronização
            </CardTitle>
            <CardDescription>
              {new Date(lastSync.timestamp).toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(lastSync.results).map(([entity, result]) => (
                <div key={entity} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize">{entity}</h4>
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  {result.status === 'success' ? (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Inseridos:</span>{' '}
                        <span className="font-medium">{result.inseridos || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Atualizados:</span>{' '}
                        <span className="font-medium">{result.atualizados || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Erros:</span>{' '}
                        <span className="font-medium">{result.erros || 0}</span>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}