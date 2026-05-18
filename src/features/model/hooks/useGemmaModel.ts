import { useModelContext } from './useModelContext';

type UseGemmaModelOptions = {
  modelSourceUri?: string | null;
  autoLoad?: boolean;
};

export function useGemmaModel(options: UseGemmaModelOptions = {}) {
  const { model, state, generate, reset, deleteModel, load, memorySummary } = useModelContext(
    options,
  );

  return {
    model,
    state,
    generate,
    reset,
    deleteModel,
    load,
    memorySummary,
  };
}
