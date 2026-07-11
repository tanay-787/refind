import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { 
  getExecutorStats, 
  getJobJournalDatabase,
  ingestJobJournalScreenshots,
  resetFailedExecutions,
} from '@/core/jobjournal';
import { processUntilEmpty } from '@/core/jobjournal/background-tasks';
import { JobJournalErrorCode } from '@/core/jobjournal/types';
import { getDrizzleDb } from '@/core/jobjournal/storage/database';

interface JobJournalState {
  isSyncing: boolean;
  isProcessing: boolean;
  lastError: string | null;
  lastErrorCode: JobJournalErrorCode | null;
}

interface JobJournalContextValue extends JobJournalState {
  db: any | null;
  sync: () => Promise<any | null>;
  process: (iterations?: number) => Promise<number>;
  retryFailed: () => Promise<number>;
}

const JobJournalContext = createContext<JobJournalContextValue | null>(null);

export function JobJournalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<JobJournalState>({
    isSyncing: false,
    isProcessing: false,
    lastError: null,
    lastErrorCode: null,
  });

  const [drizzleDb, setDrizzleDb] = useState<any | null>(null);
  const isMounted = useRef(true);
  const syncLock = useRef(false);
  const engineLock = useRef(false);
  const appState = useRef(AppState.currentState);

  /**
   * Autonomous Workflow Engine
   * Watches for pending work and triggers high-speed processing in foreground.
   */
  const runEngine = useCallback(async () => {
    if (engineLock.current || appState.current !== 'active') return;
    
    // Only wake up if there is actually pending work
    const stats = await getExecutorStats();
    if (stats.pending === 0) return;

    engineLock.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      console.log(`[JobJournalEngine] Waking up. Found ${stats.pending} pending tasks.`);
      await processUntilEmpty(1000, 10); 
    } catch (err) {
      console.error('[JobJournalEngine] Loop error:', err);
    } finally {
      engineLock.current = false;
      if (isMounted.current) {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncLock.current) return null;
    
    syncLock.current = true;
    setState(prev => ({ ...prev, isSyncing: true, lastError: null, lastErrorCode: null }));
    
    try {
      const result = await ingestJobJournalScreenshots();
      // Inform the engine that new work might be available
      void runEngine();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      setState(prev => ({ ...prev, lastError: message, lastErrorCode: 'IO_ERROR' }));
      console.error('[JobJournalProvider] Sync error:', error);
      return null;
    } finally {
      syncLock.current = false;
      if (isMounted.current) {
        setState(prev => ({ ...prev, isSyncing: false }));
      }
    }
  }, [runEngine]);

  const processManually = useCallback(async (iterations = 8) => {
    // Standard process call for manual UI triggers
    if (engineLock.current) return 0;
    engineLock.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      return await processUntilEmpty(iterations, 10);
    } finally {
      engineLock.current = false;
      if (isMounted.current) {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, []);

  const retryFailed = useCallback(async () => {
    setState(prev => ({ ...prev, lastError: null, lastErrorCode: null }));
    try {
      const resetCount = await resetFailedExecutions();
      // Inform the engine that new work might be available
      void runEngine();
      return resetCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Retry failed';
      setState(prev => ({ ...prev, lastError: message, lastErrorCode: 'IO_ERROR' }));
      console.error('[JobJournalProvider] Retry error:', error);
      return 0;
    }
  }, [runEngine]);

  useEffect(() => {
    isMounted.current = true;
    
    // 1. Initial Load & Engine Start
    getDrizzleDb().then(db => {
      if (isMounted.current) {
        setDrizzleDb(db);
        void runEngine();
      }
    });

    // 2. AppState Awareness: Stop/Start engine on foreground/background
    const appStateSub = AppState.addEventListener('change', (nextStatus) => {
      appState.current = nextStatus;
      if (nextStatus === 'active') {
        void runEngine();
      }
    });

    return () => {
      isMounted.current = false;
      appStateSub.remove();
    };
  }, [runEngine]);

  const value = React.useMemo<JobJournalContextValue>(() => ({
    ...state,
    db: drizzleDb,
    sync,
    process: processManually,
    retryFailed,
  }), [state, drizzleDb, sync, processManually, retryFailed]);

  return (
    <JobJournalContext.Provider value={value}>
      {children}
    </JobJournalContext.Provider>
  );
}

export function useJobJournalContext() {
  const context = useContext(JobJournalContext);
  if (!context) {
    throw new Error('useJobJournalContext must be used within a JobJournalProvider');
  }
  return context;
}
