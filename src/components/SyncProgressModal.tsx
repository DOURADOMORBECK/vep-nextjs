'use client';

import { useEffect, useState } from 'react';
import { IncrementalSyncClient, type SyncProgress } from '@/services/sync/IncrementalSyncClient';

interface SyncProgressModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function SyncProgressModal({ isOpen, onClose }: SyncProgressModalProps) {
  const [progress, setProgress] = useState<SyncProgress[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Registra callback para acompanhar progresso
    const unsubscribe = IncrementalSyncClient.onProgress((newProgress) => {
      setProgress(newProgress);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const allCompleted = progress.length > 0 && 
    progress.every(p => p.status === 'completed' || p.status === 'error');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">
          <i className="fa-solid fa-sync fa-spin mr-2"></i>
          Sincronizando com FinancesWeb
        </h2>
        
        <div className="space-y-3">
          {progress.map((item) => (
            <div key={item.entity} className="bg-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium capitalize">
                  {item.entity}
                </span>
                <span className="text-sm">
                  {item.status === 'pending' && (
                    <span className="text-gray-400">
                      <i className="fa-solid fa-clock mr-1"></i>
                      Aguardando
                    </span>
                  )}
                  {item.status === 'syncing' && (
                    <span className="text-blue-400">
                      <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                      Sincronizando
                    </span>
                  )}
                  {item.status === 'completed' && (
                    <span className="text-green-400">
                      <i className="fa-solid fa-check mr-1"></i>
                      Concluído
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-400">
                      <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                      Erro
                    </span>
                  )}
                </span>
              </div>
              
              {item.message && (
                <p className="text-sm text-gray-300 mb-2">{item.message}</p>
              )}
              
              {item.status === 'syncing' && item.progress !== undefined && (
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {allCompleted && onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}