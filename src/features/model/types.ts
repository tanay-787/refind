import type { Backend } from 'react-native-litert-lm';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export type GemmaModelState = {
  backend: Backend;
  downloadProgress: number;
  error: string | null;
  isGenerating: boolean;
  isReady: boolean;
  status: ModelStatus;
};
