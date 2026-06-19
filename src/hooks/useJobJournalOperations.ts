import { useMemo } from 'react';
import { useJobJournalContext } from './providers/JobJournalProvider';

export function useJobJournalOperations() {
  const { 
    sync, 
    process, 
    retryFailed,
    isSyncing, 
    isProcessing, 
    lastError,
    lastErrorCode 
  } = useJobJournalContext();

  return useMemo(() => ({
    sync,
    process,
    retryFailed,
    isSyncing,
    isProcessing,
    lastError,
    lastErrorCode
  }), [sync, process, retryFailed, isSyncing, isProcessing, lastError, lastErrorCode]);
}
