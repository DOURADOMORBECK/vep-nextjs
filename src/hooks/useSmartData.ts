import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

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
        setIsDemo(true);
        
        if (showToasts && fallbackData.length > 0) {
          toast('Usando dados de demonstração. Sincronize para obter dados reais.', {
            icon: '💡',
            duration: 4000
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setData(fallbackData as T[]);
      setIsDemo(true);
      
      if (showToasts) {
        toast.error('Erro ao carregar dados. Usando dados de demonstração.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para sincronizar dados
  const sync = async () => {
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
  };

  // Carregar dados ao montar
  useEffect(() => {
    fetchData();
  }, [endpoint]);

  // Auto sincronizar se necessário
  useEffect(() => {
    if (autoSync && isDemo && !loading) {
      sync();
    }
  }, [autoSync, isDemo, loading]);

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