import { useCallback, useState } from 'react';
import { hybridSearch, type SearchResult } from '@/core/jobjournal/search/hybrid';

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  lastQuery: string;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    lastQuery: '',
  });

  const search = useCallback(async (query: string, limit: number = 10) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], lastQuery: '' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, lastQuery: query }));

    try {
      const results = await hybridSearch(query, limit);
      
      setState(prev => ({
        ...prev,
        results,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const clear = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      lastQuery: '',
    });
  }, []);

  return {
    ...state,
    search,
    clear,
  };
}
