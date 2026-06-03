/* Job Journal background task runner
 * - Defines a short-lived background task that claims and executes a small number
 *   of stage executions per invocation to respect OS background time budgets.
 * - Limits work per invocation via processOnce(maxIterations) to avoid overruns.
 * - Use scheduleJobJournalBackgroundTask() to register with the OS, and
 *   processJobJournalNow() for immediate foreground debugging.
 * - Task definition MUST happen at the top level for Expo TaskManager.
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { runNextStageExecution } from './05-runner';

const JOB_JOURNAL_TASK_NAME = 'JOB_JOURNAL_RUNNER_TASK';

/**
 * Process loop for a single background invocation. Limits work to avoid overrunning OS budget.
 */
async function processOnce(maxIterations = 8) {
  let processed = 0;
  for (let i = 0; i < maxIterations; i++) {
    try {
      const didWork = await runNextStageExecution();
      if (!didWork) break;
      processed++;
    } catch (err) {
      // Swallow and continue a small number of times; task invocation will be retried by OS
      console.error('job-journal runner error', err);
      break;
    }
  }
  return processed;
}

// Define task at top level for reliable registration
try {
  TaskManager.defineTask(JOB_JOURNAL_TASK_NAME, async () => {
    try {
      await processOnce();
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
  // This is kept for compatibility with existing initialization flows.
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
 * Run the runner loop immediately in-process (foreground). Useful for debugging.
 */
export async function processJobJournalNow(iterations = 64) {
  let total = 0;
  for (let i = 0; i < iterations; i++) {
    const didWork = await runNextStageExecution();
    if (!didWork) break;
    total++;
  }
  return total;
}

export { JOB_JOURNAL_TASK_NAME };
