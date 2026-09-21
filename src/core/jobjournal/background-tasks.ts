/* Job Journal processing & task runner
 * - Runs foreground processing using Android Foreground Service (dataSync)
 *   via react-native-notify-kit.
 * - Optimized Sequential Flow: Processes one task at a time to minimize memory 
 *   pressure and native resource contention (best for ML Kit).
 */
import notifee from 'react-native-notify-kit';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { runNextStageExecution, runNextJobToCompletion, getJobQueueStats } from './05-runner';
import { recoveryExpiredLeases } from './03-executor';
import { 
  startSyncForegroundService, 
  updateSyncNotificationProgress, 
  stopSyncForegroundService,
  setForegroundServiceResolver,
} from './utils/notifications';

const JOB_JOURNAL_TASK_NAME = 'JOB_JOURNAL_RUNNER_TASK';

export interface ProcessProgressCallback {
  (current: number, total: number): void;
}

let isProcessingActive = false;

/**
 * Pure processing loop with hardware "breathing" pauses.
 * Responsible ONLY for driving stages to completion and emitting progress.
 * Does NOT start or stop the foreground service or notifications.
 */
export async function processUntilEmpty(
  maxTotal = 1000,
  batchSize = 25,
  onProgress?: ProcessProgressCallback,
): Promise<number> {
  let totalProcessed = 0;

  // 1. Recover any abandoned leases from previous crashes/kills
  await recoveryExpiredLeases();

  // 2. Fetch current queue stats to establish progress baseline
  const initialStats = await getJobQueueStats();
  const totalTarget = initialStats.total;
  let currentCompleted = initialStats.completed;

  while (totalProcessed < maxTotal) {
    // Process a sub-batch using fused job execution
    for (let i = 0; i < batchSize; i++) {
      const didWork = await runNextJobToCompletion();
      if (!didWork) {
        // Queue is fully empty
        onProgress?.(currentCompleted, totalTarget);
        return totalProcessed;
      }
      totalProcessed++;
      currentCompleted++;
      onProgress?.(currentCompleted, totalTarget);
    }

    // Hardware "Breath": Pause briefly after each batch 
    // to let Native GC and the JS Event Loop catch up.
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(`[backgroundTasks] Sub-batch complete. Processed: ${totalProcessed} (${currentCompleted}/${totalTarget})`);
  }

  return totalProcessed;
}

/**
 * Orchestrates foreground processing inside an Android Foreground Service.
 * Manages the FGS lifecycle (start, progress updates, stop) around the processing loop.
 */
export async function runForegroundProcessing(
  maxTotal = 1000,
  batchSize = 25,
  onProgress?: ProcessProgressCallback,
): Promise<number> {
  if (isProcessingActive) {
    console.log('[backgroundTasks] Processing already active, skipping duplicate invocation.');
    return 0;
  }
  isProcessingActive = true;

  try {
    const stats = await getJobQueueStats();
    const remaining = stats.pending + stats.running;

    if (remaining === 0) {
      console.log('[backgroundTasks] Queue has 0 pending tasks, no foreground service needed.');
      return 0;
    }

    console.log(`[backgroundTasks] Starting foreground service for ${remaining} tasks (total: ${stats.total}).`);
    await startSyncForegroundService(stats.completed, stats.total);
    onProgress?.(stats.completed, stats.total);

    const processed = await processUntilEmpty(maxTotal, batchSize, (current, total) => {
      void updateSyncNotificationProgress(current, total);
      onProgress?.(current, total);
    });

    // Final forced update to show completion before dismiss
    void updateSyncNotificationProgress(stats.completed + processed, stats.total, true);

    return processed;
  } finally {
    isProcessingActive = false;
    await stopSyncForegroundService();
  }
}

/**
 * Standard background pass for short-lived OS invocations.
 */
async function processOnce() {
  let processed = 0;
  const MAX_EXECUTION_TIME_MS = 24 * 1000; 
  const startTime = Date.now();

  await recoveryExpiredLeases();

  while (true) {
    const elapsedMs = Date.now() - startTime;
    if (elapsedMs >= MAX_EXECUTION_TIME_MS) {
      console.log(`[backgroundTasks] Time budget exhausted (${elapsedMs}ms). Processed ${processed} items safely.`);
      break;
    }

    const didWork = await runNextStageExecution();
    if (!didWork) {
      console.log(`[backgroundTasks] Queue empty! Processed ${processed} items in ${elapsedMs}ms.`);
      break;
    }
    
    processed++;
  }

  return processed;
}

// Register Android Foreground Service headless task runner
try {
  notifee.registerForegroundService(() => {
    return new Promise<void>(async (resolve) => {
      setForegroundServiceResolver(resolve);
      try {
        if (!isProcessingActive) {
          console.log('[backgroundTasks] Headless Foreground Service starting processing loop...');
          await runForegroundProcessing(1000, 25);
        }
      } catch (err) {
        console.error('[backgroundTasks] Headless Foreground Service error:', err);
      } finally {
        resolve();
      }
    });
  });
} catch (err) {
  console.warn('[backgroundTasks] Failed to register foreground service runner:', err);
}

// Register background event handler to handle headless events and suppress warning
try {
  notifee.onBackgroundEvent(async () => {
    // Background notification events (delivery, dismissal, press)
  });
} catch (err) {
  console.warn('[backgroundTasks] Failed to register background event handler:', err);
}

// Background task definition for periodic sync
try {
  TaskManager.defineTask(JOB_JOURNAL_TASK_NAME, async () => {
    try {
      console.log('[backgroundTasks] Starting background processing cycle...');
      const count = await processOnce(); 
      console.log(`[backgroundTasks] Background cycle finished. Processed ${count} tasks.`);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (err) {
      console.error('JobJournal background task failed:', err);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
} catch (err) {
  console.warn('Failed to define JobJournal background task:', err);
}

export async function registerJobJournalBackgroundTask() {
  // defineTask is handled at top level.
}

export async function scheduleJobJournalBackgroundTask(minimumIntervalMinutes = 15) {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(JOB_JOURNAL_TASK_NAME);
    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(JOB_JOURNAL_TASK_NAME, {
        minimumInterval: minimumIntervalMinutes,
      });
    }
  } catch (err) {
    console.error('Failed to schedule JobJournal background task:', err);
  }
}

export async function unregisterJobJournalBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(JOB_JOURNAL_TASK_NAME);
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(JOB_JOURNAL_TASK_NAME);
    }
  } catch (err) {
    console.warn('Failed to unregister JobJournal background task:', err);
  }
}

export async function processJobJournalNow(iterations = 128) {
  return await runForegroundProcessing(iterations);
}

export { JOB_JOURNAL_TASK_NAME };
