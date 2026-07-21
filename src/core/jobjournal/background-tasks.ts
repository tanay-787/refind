/* Job Journal background task runner
 * - Defines a short-lived background task that claims and executes a small number
 *   of stage executions per invocation to respect OS background time budgets.
 * - Optimized Sequential Flow: Processes one task at a time to minimize memory 
 *   pressure and native resource contention (best for ML Kit & ExecuTorch).
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { runNextStageExecution, runNextJobToCompletion } from './05-runner';
import { recoveryExpiredLeases } from './03-executor';
import { setupNotificationChannel, updateSyncNotification, clearSyncNotification } from './utils/notifications';

const JOB_JOURNAL_TASK_NAME = 'JOB_JOURNAL_RUNNER_TASK';

/**
 * High-speed autonomous loop with hardware "breathing" pauses.
 * Designed for clearing large backlogs (3,000+ screenshots) in the foreground.
 */
export async function processUntilEmpty(maxTotal = 1000, batchSize = 25) {
  let totalProcessed = 0;
  
  // 1. Recover any abandoned leases from crashes/background kills (once, not per-stage)
  await recoveryExpiredLeases();
  // Fire-and-forget: setupNotificationChannel() initializes the Notifee TurboModule
  // lazily on first call. Awaiting it blocks the JS thread for ~30s on first run
  // (especially when notification permission hasn't been granted yet).
  void setupNotificationChannel();
  void updateSyncNotification();

  while (totalProcessed < maxTotal) {
    let batchProcessed = 0;
    
    // Process a sub-batch using fused job execution
    // Each runNextJobToCompletion() drives all stages for one job (~5 stages)
    for (let i = 0; i < batchSize; i++) {
      const didWork = await runNextJobToCompletion();
      if (!didWork) {
        void clearSyncNotification();
        return totalProcessed; // Queue is fully empty
      }
      batchProcessed++;
      totalProcessed++;
    }

    // 2. Hardware "Breath": Pause briefly after each batch 
    // to let Native GC and the JS Event Loop catch up.
    // With batchSize=25 and ~5 stages/job, this pauses every ~25 jobs.
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`[backgroundTasks] Sub-batch complete. Total jobs processed: ${totalProcessed}`);
  }

  void clearSyncNotification();
  return totalProcessed;
}

/**
 * Standard background pass for short-lived OS-invocations.
 * Uses a time-budget instead of a strict iteration count to maximize
 * processing across different device speeds.
 */
async function processOnce() {
  let processed = 0;
  
  // The OS usually gives us ~30 seconds. We play it safe with 24 seconds.
  const MAX_EXECUTION_TIME_MS = 24 * 1000; 
  const startTime = Date.now();

  // Recover expired leases once per background invocation
  await recoveryExpiredLeases();
  // Fire-and-forget: avoid blocking on first-time Notifee native init (see processUntilEmpty)
  void setupNotificationChannel();
  void updateSyncNotification();

  while (true) {
    const elapsedMs = Date.now() - startTime;
    if (elapsedMs >= MAX_EXECUTION_TIME_MS) {
      console.log(`[backgroundTasks] Time budget exhausted (${elapsedMs}ms). Processed ${processed} items safely.`);
      break;
    }

    // Background mode uses per-stage execution for tighter time-budget control
    const didWork = await runNextStageExecution();
    if (!didWork) {
      console.log(`[backgroundTasks] Queue empty! Processed ${processed} items in ${elapsedMs}ms.`);
      break;
    }
    
    processed++;
  }

  void clearSyncNotification();
  return processed;
}

// Define task at top level for reliable registration
try {
  TaskManager.defineTask(JOB_JOURNAL_TASK_NAME, async () => {
    try {
      console.log('[backgroundTasks] Starting background processing cycle...');
      const count = await processOnce(); 
      console.log(`[backgroundTasks] Background cycle finished. Processed ${count} tasks.`);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (err) {
      console.error('JobJournal background task failed:', err);
      void clearSyncNotification();
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

/**
 * Run the runner loop immediately in-process (foreground). 
 */
export async function processJobJournalNow(iterations = 128) {
  return await processUntilEmpty(iterations);
}

export { JOB_JOURNAL_TASK_NAME };
