/* Job Journal background task runner
 * - Defines a short-lived background task that claims and executes a small number
 *   of stage executions per invocation to respect OS background time budgets.
 * - Optimized Sequential Flow: Processes one task at a time to minimize memory 
 *   pressure and native resource contention (best for ML Kit & ExecuTorch).
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { runNextStageExecution } from './05-runner';
import { recoveryExpiredLeases } from './03-executor';
import { setupNotificationChannel, updateSyncNotification, clearSyncNotification } from './utils/notifications';

const JOB_JOURNAL_TASK_NAME = 'JOB_JOURNAL_RUNNER_TASK';

/**
 * High-speed autonomous loop with hardware "breathing" pauses.
 * Designed for clearing large backlogs (3,000+ screenshots) in the foreground.
 */
export async function processUntilEmpty(maxTotal = 1000, batchSize = 10) {
  let totalProcessed = 0;
  
  // 1. Recover any abandoned leases from crashes/background kills
  await recoveryExpiredLeases();
  await setupNotificationChannel();
  await updateSyncNotification(0, maxTotal);

  while (totalProcessed < maxTotal) {
    let batchProcessed = 0;
    
    // Process a sub-batch at full speed
    for (let i = 0; i < batchSize; i++) {
      const didWork = await runNextStageExecution();
      if (!didWork) {
        await clearSyncNotification();
        return totalProcessed; // Queue is fully empty
      }
      batchProcessed++;
      totalProcessed++;
    }

    // Update notification
    await updateSyncNotification(totalProcessed, maxTotal);

    // 2. Hardware "Breath": Pause briefly after each batch 
    // to let Native GC and the JS Event Loop catch up.
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`[backgroundTasks] Sub-batch complete. Total processed: ${totalProcessed}`);
  }

  await clearSyncNotification();
  return totalProcessed;
}

/**
 * Standard background pass for short-lived OS-invocations.
 */
async function processOnce(maxIterations = 16) {
  let processed = 0;
  await setupNotificationChannel();
  await updateSyncNotification(0, null);

  for (let i = 0; i < maxIterations; i++) {
    const didWork = await runNextStageExecution();
    if (!didWork) break;
    processed++;
    await updateSyncNotification(processed, null);
  }

  await clearSyncNotification();
  return processed;
}

// Define task at top level for reliable registration
try {
  TaskManager.defineTask(JOB_JOURNAL_TASK_NAME, async () => {
    try {
      console.log('[backgroundTasks] Starting background processing cycle...');
      const count = await processOnce(16); 
      console.log(`[backgroundTasks] Background cycle finished. Processed ${count} tasks.`);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (err) {
      console.error('JobJournal background task failed:', err);
      await clearSyncNotification();
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
