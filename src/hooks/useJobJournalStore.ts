import { create } from 'zustand';
import { AppState } from 'react-native';
import { count } from 'drizzle-orm';
import { 
  getExecutorStats, 
  loadJobJournalScreenshotSource,
  ingestJobJournalScreenshots,
  resetFailedExecutions,
} from '@/core/jobjournal';
import { processUntilEmpty } from '@/core/jobjournal/background-tasks';
import { JobJournalErrorCode } from '@/core/jobjournal/types';
import { getDrizzleDb } from '@/core/jobjournal/storage/database';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';

export type EnginePhase = 'idle' | 'source' | 'intake' | 'execution';

export interface JobJournalState {
  phase: EnginePhase;
  hasCompletedInitialIntake: boolean;
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
  phase: 'idle',
  hasCompletedInitialIntake: false,
  isSyncing: false,
  isProcessing: false,
  lastError: null,
  lastErrorCode: null,
  db: null,

  init: () => {
    if (isInitialized) return;
    isInitialized = true;

    getDrizzleDb().then(async db => {
      let hasCompletedInitialIntake = false;
      try {
        const countRes = await db.select({ count: count() }).from(jobJournalJobs);
        hasCompletedInitialIntake = (countRes[0]?.count ?? 0) > 0;
      } catch (err) {
        console.warn('[JobJournalStore] Failed to check initial intake status:', err);
      }
      set({ db, hasCompletedInitialIntake });
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

    const isInitial = !get().hasCompletedInitialIntake;
    if (isInitial) {
      set({ isSyncing: true, phase: 'source', lastError: null, lastErrorCode: null });
    } else {
      set({ isSyncing: true, lastError: null, lastErrorCode: null });
    }
    
    try {
      const assets = await loadJobJournalScreenshotSource();
      if (isInitial) {
        set({ phase: 'intake' });
      }
      const result = await ingestJobJournalScreenshots(assets);
      set({ 
        hasCompletedInitialIntake: true, 
        phase: engineLock ? 'execution' : 'idle' 
      });
      void runEngine(set);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      set({ 
        lastError: message, 
        lastErrorCode: 'IO_ERROR', 
        phase: engineLock ? 'execution' : 'idle' 
      });
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
    set({ isProcessing: true, phase: 'execution' });
    try {
      return await processUntilEmpty(iterations, 10);
    } finally {
      engineLock = false;
      set({ isProcessing: false, phase: 'idle' });
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
  if (engineLock) return;
  
  const stats = await getExecutorStats();
  if (stats.pending === 0) {
    set({ phase: 'idle' });
    return;
  }

  engineLock = true;
  set({ isProcessing: true, phase: 'execution' });
  
  try {
    console.log(`[JobJournalEngine] Waking up. Found ${stats.pending} pending tasks.`);
    await processUntilEmpty(1000, 10); 
  } catch (err) {
    console.error('[JobJournalEngine] Loop error:', err);
  } finally {
    engineLock = false;
    set({ isProcessing: false, phase: 'idle' });
  }
}
