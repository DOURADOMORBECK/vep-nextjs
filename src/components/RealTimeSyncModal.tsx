'use client';

import { useEffect, useState } from 'react';
import { RealTimeSyncService, type SyncProgress } from '@/services/sync/RealTimeSyncService';

interface RealTimeSyncModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: (success: boolean) => void;
}

export function RealTimeSyncModal({ isOpen, onClose, onComplete }: RealTimeSyncModalProps) {
  const [progress, setProgress] = useState<SyncProgress[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState<{
    totalRecords: number;
    totalSaved: number;
    totalErrors: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Registra callback para progresso
    const unsubscribe = RealTimeSyncService.onProgress((newProgress) => {
      setProgress(newProgress);
      
      // Verifica se todos completaram
      const allCompleted = newProgress.length > 0 && 
        newProgress.every(p => p.status === 'completed' || p.status === 'error');
      
      if (allCompleted && !isCompleted) {
        setIsCompleted(true);
        handleSyncComplete(newProgress);
      }
    });

    // Inicia sincronização
    startSync();

    return () => {
      unsubscribe();
      RealTimeSyncService.clearProgress();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSync = async () => {
    try {
      const result = await RealTimeSyncService.syncAll();
      setSummary({
        ...result.summary,
        duration: result.duration
      });
      
      if (onComplete) {
        onComplete(result.success);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      if (onComplete) {
        onComplete(false);
      }
    }
  };

  const handleSyncComplete = (finalProgress: SyncProgress[]) => {
    // Calcula resumo do progresso
    const totalSaved = finalProgress.reduce((acc, p) => 
      acc + (p.details?.saved || 0), 0
    );
    const totalErrors = finalProgress.reduce((acc, p) => 
      acc + (p.details?.errors || 0), 0
    );
    const totalFetched = finalProgress.reduce((acc, p) => 
      acc + (p.details?.fetched || 0), 0
    );

    setSummary({
      totalRecords: totalFetched,
      totalSaved,
      totalErrors,
      duration: 0,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'fa-clock';
      case 'fetching':
        return 'fa-download';
      case 'saving':
        return 'fa-database';
      case 'completed':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      default:
        return 'fa-spinner fa-spin';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'fetching':
      case 'saving':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            <i className="fa-solid fa-sync fa-spin mr-2"></i>
            Sincronizando com FinancesWeb ERP
          </h2>
          {isCompleted && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {progress.map((item) => (
            <div key={item.entity} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <i className={`fa-solid ${getStatusIcon(item.status)} ${getStatusColor(item.status)}`}></i>
                  <span className="text-white font-medium">
                    {item.entity.charAt(0).toUpperCase() + item.entity.slice(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-300">
                  {item.percentage !== undefined && `${item.percentage}%`}
                </span>
              </div>
              
              {item.message && (
                <p className="text-sm text-gray-300 mb-3">{item.message}</p>
              )}
              
              {(item.status === 'fetching' || item.status === 'saving') && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage || 0}%` }}
                    />
                  </div>
                  {item.current !== undefined && item.total !== undefined && (
                    <p className="text-xs text-gray-400 text-right">
                      {item.current.toLocaleString()} / {item.total.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              {item.details && item.status === 'completed' && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-600 rounded p-2 text-center">
                    <p className="text-gray-400">Buscados</p>
                    <p className="text-white font-medium">{item.details.fetched?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-gray-600 rounded p-2 text-center">
                    <p className="text-gray-400">Salvos</p>
                    <p className="text-green-400 font-medium">{item.details.saved?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-gray-600 rounded p-2 text-center">
                    <p className="text-gray-400">Erros</p>
                    <p className={`font-medium ${item.details.errors ? 'text-red-400' : 'text-gray-500'}`}>
                      {item.details.errors || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {isCompleted && summary && (
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white mb-3">Resumo da Sincronização</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-700 rounded p-3 text-center">
                <p className="text-gray-400 text-sm">Total Registros</p>
                <p className="text-white text-xl font-bold">{summary.totalRecords.toLocaleString()}</p>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <p className="text-gray-400 text-sm">Salvos</p>
                <p className="text-green-400 text-xl font-bold">{summary.totalSaved.toLocaleString()}</p>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <p className="text-gray-400 text-sm">Erros</p>
                <p className={`text-xl font-bold ${summary.totalErrors > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {summary.totalErrors}
                </p>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <p className="text-gray-400 text-sm">Taxa Sucesso</p>
                <p className="text-blue-400 text-xl font-bold">
                  {summary.totalRecords > 0 
                    ? Math.round((summary.totalSaved / summary.totalRecords) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg px-4 py-3 transition-colors"
              >
                Continuar para o Sistema
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}