'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface DatabaseStatus {
  name: string;
  status: 'checking' | 'connected' | 'error';
  responseTime?: number;
  error?: string;
  details?: {
    tables?: number;
    records?: Record<string, number>;
    version?: string;
  };
}

export default function ApiStatusPage() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    name: 'PostgreSQL Database',
    status: 'checking'
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    setDbStatus({
      name: 'PostgreSQL Database',
      status: 'checking'
    });

    const startTime = Date.now();

    try {
      const response = await fetch('/api/database/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        setDbStatus({
          name: 'PostgreSQL Database',
          status: 'connected',
          responseTime,
          details: data.data
        });
      } else {
        setDbStatus({
          name: 'PostgreSQL Database',
          status: 'error',
          responseTime,
          error: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setDbStatus({
        name: 'PostgreSQL Database',
        status: 'error',
        responseTime,
        error: (error as Error).message
      });
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = (status: DatabaseStatus['status']) => {
    switch (status) {
      case 'checking':
        return <i className="fa-solid fa-spinner fa-spin text-gray-400"></i>;
      case 'connected':
        return <i className="fa-solid fa-check-circle text-green-400"></i>;
      case 'error':
        return <i className="fa-solid fa-times-circle text-red-400"></i>;
    }
  };

  const getStatusColor = (status: DatabaseStatus['status']) => {
    switch (status) {
      case 'checking':
        return 'text-gray-400';
      case 'connected':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
    }
  };

  const getStatusText = (status: DatabaseStatus['status']) => {
    switch (status) {
      case 'checking':
        return 'Verificando...';
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro de Conexão';
    }
  };

  return (
    <DashboardLayout title="Status do Sistema" subtitle="Verificar conectividade com o banco de dados">
      <div className="p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white">Status do Banco de Dados</h2>
              <p className="text-sm text-gray-400 mt-1">
                Conexão direta com PostgreSQL no Railway
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastChecked && (
                <span className="text-sm text-gray-400">
                  Última verificação: {lastChecked.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={checkDatabaseStatus}
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
                    Verificar Novamente
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Configuração Atual</h3>
            <p className="text-sm text-white font-mono">
              Modo: {process.env.NODE_ENV === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Conectando diretamente ao banco de dados PostgreSQL usando DATABASE_URL
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(dbStatus.status)}
              <div>
                <h3 className="text-lg font-medium text-white">{dbStatus.name}</h3>
                <p className={`text-sm ${getStatusColor(dbStatus.status)}`}>
                  {getStatusText(dbStatus.status)}
                </p>
              </div>
            </div>
            {dbStatus.responseTime && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Tempo de Resposta</p>
                <p className="text-xl font-medium text-white">{dbStatus.responseTime}ms</p>
              </div>
            )}
          </div>

          {dbStatus.error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                {dbStatus.error}
              </p>
            </div>
          )}

          {dbStatus.details && dbStatus.status === 'connected' && (
            <div className="mt-4 space-y-4">
              {/* Database Version */}
              {dbStatus.details.version && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Versão do PostgreSQL</p>
                  <p className="text-white font-mono">{dbStatus.details.version}</p>
                </div>
              )}

              {/* Tables Count */}
              {dbStatus.details.tables !== undefined && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Total de Tabelas</p>
                  <p className="text-2xl font-medium text-white">{dbStatus.details.tables}</p>
                </div>
              )}

              {/* Records Count */}
              {dbStatus.details.records && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-3">Registros por Tabela</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(dbStatus.details.records).map(([table, count]) => (
                      <div key={table} className="bg-gray-800 rounded p-3">
                        <p className="text-xs text-gray-400">{table}</p>
                        <p className="text-lg font-medium text-white">{count.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Informações do Sistema</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start">
              <i className="fa-solid fa-database text-blue-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">Banco de Dados PostgreSQL</p>
                <p className="text-gray-400">
                  O sistema agora se conecta diretamente ao banco de dados PostgreSQL hospedado no Railway, 
                  eliminando a necessidade de APIs intermediárias.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="fa-solid fa-bolt text-yellow-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">Performance Melhorada</p>
                <p className="text-gray-400">
                  A conexão direta ao banco de dados oferece melhor performance e menor latência 
                  comparado ao uso de APIs REST intermediárias.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="fa-solid fa-shield-alt text-green-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">Segurança</p>
                <p className="text-gray-400">
                  A conexão é protegida por SSL e usa autenticação segura. As credenciais são 
                  gerenciadas através de variáveis de ambiente.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="fa-solid fa-server text-purple-400 mt-0.5 mr-3"></i>
              <div>
                <p className="font-medium">Conexão Pool</p>
                <p className="text-gray-400">
                  O sistema utiliza um pool de conexões para otimizar o uso de recursos e 
                  garantir melhor performance em múltiplas requisições simultâneas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}