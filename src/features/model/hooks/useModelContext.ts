import { useCallback, useMemo, useState } from 'react';
import { getRecommendedBackend, useModel } from 'react-native-litert-lm';

import { DEFAULT_SYSTEM_PROMPT, GEMMA_MODEL_URL } from '../constants';
import type { GemmaModelState } from '../types';

type UseModelContextOptions = {
  modelSourceUri?: string | null;
  autoLoad?: boolean;
  enableMemoryTracking?: boolean;
};

function normalizeLocalModelPath(pathOrUri: string | null | undefined) {
  if (!pathOrUri) {
    return null;
  }

  return pathOrUri.startsWith('file://') ? pathOrUri.replace('file://', '') : pathOrUri;
}

export function useModelContext(options: UseModelContextOptions = {}) {
  const {
    modelSourceUri = GEMMA_MODEL_URL,
    autoLoad = true,
    enableMemoryTracking = true,
  } = options;
  const backend = useMemo(() => getRecommendedBackend() ?? 'cpu', []);
  const modelPath = normalizeLocalModelPath(modelSourceUri);
  const [isLoading, setIsLoading] = useState(false);

  const {
    model,
    isReady,
    isGenerating,
    downloadProgress,
    error,
    generate,
    reset,
    deleteModel,
    load,
    memorySummary,
  } = useModel(modelPath ?? GEMMA_MODEL_URL, {
    backend,
    autoLoad,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    enableMemoryTracking,
  });

  const loadModel = useCallback(async () => {
    setIsLoading(true);
    try {
      await load();
    } finally {
      setIsLoading(false);
    }
  }, [load]);

  const state: GemmaModelState & { isLoading: boolean } = {
    backend,
    downloadProgress,
    error,
    isGenerating,
    isLoading,
    isReady,
    status:
      error ? 'error' : isReady ? 'ready' : isLoading || downloadProgress > 0 ? 'loading' : 'idle',
  };

  return {
    model,
    state,
    generate,
    reset,
    deleteModel,
    load: loadModel,
    memorySummary,
    modelPath,
  };
}
