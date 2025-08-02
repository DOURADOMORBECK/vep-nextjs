import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { DataInitializationService } from '@/services/dataInitializationService';

interface UseSmartDataOptions {
  endpoint: string;
  fallbackData?: unknown[];
  showToasts?: boolean;
  autoSync?: boolean;
}

interface UseSmartDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  isDemo: boolean;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
}

export function useSmartData<T = unknown>({
  endpoint,
  fallbackData = [],
  showToasts = true,
  autoSync = false
}: UseSmartDataOptions): UseSmartDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Primeiro, tenta obter dados do cache
      const entityName = endpoint.split('/').pop() || '';
      const cachedData = DataInitializationService.getCachedData<T>(entityName);
      
      if (cachedData && cachedData.length > 0) {
        setData(cachedData);
        setIsDemo(false);
        setLoading(false);
        
        // Faz uma atualização silenciosa em background
        fetch(endpoint)
          .then(response => response.json())
          .then(result => {
            const extractedData = result.data || result.items || result.results || result;
            if (Array.isArray(extractedData) && extractedData.length > 0) {
              setData(extractedData);
            }
          })
          .catch(() => {}); // Ignora erros na atualização silenciosa
        
        return;
      }

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const result = await response.json();
      
      // Extrair dados do resultado (pode vir em diferentes formatos)
      const extractedData = result.data || result.items || result.results || result;
      
      if (Array.isArray(extractedData) && extractedData.length > 0) {
        setData(extractedData);
        setIsDemo(false);
      } else {
        // Sem dados reais, usar fallback
        setData(fallbackData as T[]);
        setIsDemo(fallbackData.length > 0);
        
        if (showToasts && fallbackData.length > 0) {
          toast('Nenhum dado encontrado. Configure o banco de dados para visualizar dados reais.', {
            icon: '⚠️',
            duration: 4000
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setData(fallbackData as T[]);
      setIsDemo(fallbackData.length > 0);
      
      if (showToasts) {
        const errorMessage = err instanceof Error && err.message.includes('fetch') 
          ? 'Erro de conexão. Verifique sua internet.'
          : 'Erro ao carregar dados do servidor.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, fallbackData, showToasts]);

  // Função para sincronizar dados
  const sync = useCallback(async () => {
    const toastId = toast.loading('Sincronizando dados...');
    
    try {
      const response = await fetch('/api/sync/smart', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Dados sincronizados com sucesso!', { id: toastId });
        // Recarregar dados após sincronização
        await fetchData();
      } else {
        throw new Error(result.error || 'Erro na sincronização');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar', { id: toastId });
    }
  }, [fetchData]);

  // Carregar dados ao montar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto sincronizar se necessário
  useEffect(() => {
    if (autoSync && isDemo && !loading) {
      sync();
    }
  }, [autoSync, isDemo, loading, sync]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    isDemo,
    refresh: fetchData,
    sync
  };
}