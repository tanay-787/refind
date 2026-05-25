import { useCallback, useState } from 'react';
import { hybridSearch, type SearchResult } from '../search/hybrid';

interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

export function useHybridSearch() {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
  });

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState((prev) => ({
        ...prev,
        query: '',
        results: [],
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      query,
      loading: true,
      error: null,
    }));

    try {
      const results = await hybridSearch(query, 20, true);
      setState((prev) => ({
        ...prev,
        results,
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({
      query: '',
      results: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    search,
    clearSearch,
  };
}
