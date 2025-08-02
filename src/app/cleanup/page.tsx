'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CleanupResults {
  success: boolean;
  results?: {
    dropped: string[];
    notFound: string[];
    errors: { table: string; error: string }[];
  };
  remainingTables?: string[];
  summary?: {
    droppedCount: number;
    notFoundCount: number;
    errorCount: number;
  };
  error?: string;
}

interface CheckResults {
  oldTables: {
    exists: string[];
    notFound: string[];
  };
  currentTables: string[];
  summary: {
    oldTablesFound: number;
    oldTablesAlreadyRemoved: number;
  };
}

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [checkResults, setCheckResults] = useState<CheckResults | null>(null);
  const [cleanupResults, setCleanupResults] = useState<CleanupResults | null>(null);

  const checkTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cleanup/drop-old-tables');
      const data = await response.json();
      setCheckResults(data);
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error);
    } finally {
      setLoading(false);
    }
  };

  const dropTables = async () => {
    if (!confirm('Tem certeza que deseja remover as tabelas antigas? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cleanup/drop-old-tables', {
        method: 'POST'
      });
      const data = await response.json();
      setCleanupResults(data);
      
      // Recarregar a verificação após a limpeza
      if (data.success) {
        await checkTables();
      }
    } catch (error) {
      console.error('Erro ao remover tabelas:', error);
      setCleanupResults({
        success: false,
        error: 'Erro ao executar limpeza'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Limpeza de Tabelas Antigas</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Tabelas a serem removidas:</h2>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>operadores_financesweb</li>
          <li>pedidos_detalhe_financesweb</li>
          <li>pessoas_financesweb</li>
          <li>produtos_financesweb</li>
        </ul>
        
        <div className="flex gap-4">
          <Button onClick={checkTables} disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar Tabelas'}
          </Button>
          
          {checkResults?.oldTables.exists.length > 0 && (
            <Button 
              onClick={dropTables} 
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Removendo...' : 'Remover Tabelas Antigas'}
            </Button>
          )}
        </div>
      </Card>

      {checkResults && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Status das Tabelas</h2>
          
          {checkResults.oldTables.exists.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-red-600 mb-2">
                Tabelas antigas encontradas ({checkResults.oldTables.exists.length}):
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {checkResults.oldTables.exists.map(table => (
                  <li key={table} className="text-sm">{table}</li>
                ))}
              </ul>
            </div>
          )}
          
          {checkResults.oldTables.notFound.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-green-600 mb-2">
                Tabelas já removidas ({checkResults.oldTables.notFound.length}):
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {checkResults.oldTables.notFound.map(table => (
                  <li key={table} className="text-sm">{table}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h3 className="font-medium mb-2">
              Todas as tabelas atuais ({checkResults.currentTables.length}):
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {checkResults.currentTables.map(table => (
                <div key={table} className="text-sm bg-gray-100 p-2 rounded">
                  {table}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {cleanupResults && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Resultado da Limpeza</h2>
          
          {cleanupResults.success ? (
            <>
              {cleanupResults.results?.dropped.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-green-600 mb-2">
                    Tabelas removidas com sucesso ({cleanupResults.results.dropped.length}):
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cleanupResults.results.dropped.map(table => (
                      <li key={table} className="text-sm">{table}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cleanupResults.results?.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-red-600 mb-2">
                    Erros ao remover ({cleanupResults.results.errors.length}):
                  </h3>
                  {cleanupResults.results.errors.map((err, idx) => (
                    <div key={idx} className="text-sm mb-2">
                      <strong>{err.table}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 p-4 bg-green-50 rounded">
                <p className="text-green-800">
                  ✅ Limpeza concluída! {cleanupResults.summary?.droppedCount || 0} tabelas removidas.
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-50 rounded">
              <p className="text-red-800">
                ❌ Erro ao executar limpeza: {cleanupResults.error}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}