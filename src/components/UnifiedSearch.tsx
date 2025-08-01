'use client';

import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface SearchResult {
  id: string;
  name: string;
  type: 'customer' | 'order' | 'product' | 'supplier';
  [key: string]: unknown;
}

interface SearchResponse {
  query: string;
  totalResults: number;
  results: {
    customers: SearchResult[];
    orders: SearchResult[];
    products: SearchResult[];
    suppliers: SearchResult[];
  };
}

export default function UnifiedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['customers', 'orders', 'products']);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string, types: string[]) => {
      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&types=${types.join(',')}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          console.error('Search failed:', response.status);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    debouncedSearch(value, selectedTypes);
  }, [debouncedSearch, selectedTypes]);

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    
    if (query.trim()) {
      debouncedSearch(query, newTypes);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'customer': return '👥';
      case 'order': return '📦';
      case 'product': return '🏷️';
      case 'supplier': return '🚚';
      default: return '📄';
    }
  };

  const getResultDescription = (result: SearchResult) => {
    switch (result.type) {
      case 'customer':
        return `${result.category || ''} - ${result.document || ''}`;
      case 'order':
        return `${result.customer || ''} - R$ ${Number(result.value || 0).toFixed(2)}`;
      case 'product':
        return `${result.code || ''} - R$ ${Number(result.price || 0).toFixed(2)} (${result.stock || 0} em estoque)`;
      case 'supplier':
        return `${result.category || ''} - ${result.document || ''}`;
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-search text-gray-400"></i>
        </div>
        <input
          type="text"
          placeholder="Buscar clientes, pedidos, produtos..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <i className="fa-solid fa-spinner fa-spin text-gray-400"></i>
          </div>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mt-3">
        {[
          { key: 'customers', label: 'Clientes', icon: '👥' },
          { key: 'orders', label: 'Pedidos', icon: '📦' },
          { key: 'products', label: 'Produtos', icon: '🏷️' },
          { key: 'suppliers', label: 'Fornecedores', icon: '🚚' }
        ].map(type => (
          <button
            key={type.key}
            onClick={() => handleTypeToggle(type.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedTypes.includes(type.key)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="mr-1">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* Results Dropdown */}
      {results && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-700">
            <p className="text-sm text-gray-400">
              {results.totalResults} resultado{results.totalResults !== 1 ? 's' : ''} encontrado{results.totalResults !== 1 ? 's' : ''} para &quot;{results.query}&quot;
            </p>
          </div>

          {Object.entries(results.results).map(([category, items]) => {
            if (items.length === 0) return null;
            
            return (
              <div key={category} className="border-b border-gray-700 last:border-b-0">
                <div className="px-3 py-2 bg-gray-700/50">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    {category === 'customers' && 'Clientes'}
                    {category === 'orders' && 'Pedidos'}
                    {category === 'products' && 'Produtos'}
                    {category === 'suppliers' && 'Fornecedores'}
                    <span className="ml-2 text-gray-500">({items.length})</span>
                  </h4>
                </div>
                
                {items.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full text-left px-3 py-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 last:border-b-0"
                    onClick={() => {
                      // Handle result click - could navigate to detail page
                      console.log('Selected:', result);
                      setQuery('');
                      setResults(null);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getResultIcon(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {result.name}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {getResultDescription(result)}
                        </div>
                      </div>
                      <i className="fa-solid fa-chevron-right text-gray-500 text-xs mt-1"></i>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {results.totalResults === 0 && (
            <div className="p-6 text-center text-gray-400">
              <i className="fa-solid fa-search text-2xl mb-2"></i>
              <p>Nenhum resultado encontrado para &quot;{results.query}&quot;</p>
              <p className="text-sm mt-1">Tente termos diferentes ou verifique a ortografia</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}