import { create } from 'zustand';
import { AppState } from 'react-native';
import { 
  getExecutorStats, 
  ingestJobJournalScreenshots,
  resetFailedExecutions,
} from '@/core/jobjournal';
import { processUntilEmpty } from '@/core/jobjournal/background-tasks';
import { JobJournalErrorCode } from '@/core/jobjournal/types';
import { getDrizzleDb } from '@/core/jobjournal/storage/database';

export interface JobJournalState {
  isSyncing: boolean;
  isProcessing: boolean;
  lastError: string | null;
  lastErrorCode: JobJournalErrorCode | null;
  db: any | null;
  
  sync: () => Promise<any | null>;
  process: (iterations?: number) => Promise<number>;
  retryFailed: () => Promise<number>;
  init: () => void;
}

let engineLock = false;
let syncLock = false;
let isInitialized = false;

export const useJobJournalStore = create<JobJournalState>((set, get) => ({
  isSyncing: false,
  isProcessing: false,
  lastError: null,
  lastErrorCode: null,
  db: null,

  init: () => {
    if (isInitialized) return;
    isInitialized = true;

    getDrizzleDb().then(db => {
      set({ db });
      void runEngine(set);
    });

    AppState.addEventListener('change', (nextStatus) => {
      if (nextStatus === 'active') {
        void runEngine(set);
      }
    });
  },

  sync: async () => {
    if (syncLock) return null;
    syncLock = true;
    set({ isSyncing: true, lastError: null, lastErrorCode: null });
    
    try {
      const result = await ingestJobJournalScreenshots();
      void runEngine(set);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      set({ lastError: message, lastErrorCode: 'IO_ERROR' });
      console.error('[JobJournalStore] Sync error:', error);
      return null;
    } finally {
      syncLock = false;
      set({ isSyncing: false });
    }
  },

  process: async (iterations = 8) => {
    if (engineLock) return 0;
    engineLock = true;
    set({ isProcessing: true });
    try {
      return await processUntilEmpty(iterations, 10);
    } finally {
      engineLock = false;
      set({ isProcessing: false });
    }
  },

  retryFailed: async () => {
    set({ lastError: null, lastErrorCode: null });
    try {
      const resetCount = await resetFailedExecutions();
      void runEngine(set);
      return resetCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Retry failed';
      set({ lastError: message, lastErrorCode: 'IO_ERROR' });
      console.error('[JobJournalStore] Retry error:', error);
      return 0;
    }
  }
}));

async function runEngine(set: any) {
  if (engineLock || AppState.currentState !== 'active') return;
  
  const stats = await getExecutorStats();
  if (stats.pending === 0) return;

  engineLock = true;
  set({ isProcessing: true });
  
  try {
    console.log(`[JobJournalEngine] Waking up. Found ${stats.pending} pending tasks.`);
    await processUntilEmpty(1000, 10); 
  } catch (err) {
    console.error('[JobJournalEngine] Loop error:', err);
  } finally {
    engineLock = false;
    set({ isProcessing: false });
  }
}
