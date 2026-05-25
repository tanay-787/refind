import { useCallback, useState } from 'react';
import { processNow } from '../backgroundTasks';

interface ProcessingState {
  processing: boolean;
  error: string | null;
}

export function useProcessing() {
  const [state, setState] = useState<ProcessingState>({
    processing: false,
    error: null,
  });

  const process = useCallback(async () => {
    setState({
      processing: true,
      error: null,
    });

    try {
      await processNow();
      setState({
        processing: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Processing failed';
      setState({
        processing: false,
        error: message,
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    process,
  };
}
