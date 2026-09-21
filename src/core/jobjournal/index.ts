export {
  loadJobJournalScreenshotSource,
  watchJobJournalScreenshotSource
} from './01-source';
export {
  ingestJobJournalScreenshots, syncJobJournalScreenshots,
  watchJobJournalIntake, type JobJournalIntakeResult
} from './02-intake';

export {
  resetFailedExecutions
} from './03-executor';
export {
  getExecutorStats, getJobQueueStats, runNextStageExecution, runNextJobToCompletion
} from './05-runner';
export {
  registerJobJournalBackgroundTask,
  scheduleJobJournalBackgroundTask,
  unregisterJobJournalBackgroundTask,
  processUntilEmpty,
  runForegroundProcessing,
  processJobJournalNow,
} from './background-tasks';
export {
  setupNotificationChannel,
  ensureNotificationPermission,
  startSyncForegroundService,
  updateSyncNotificationProgress,
  stopSyncForegroundService,
} from './utils/notifications';
export { runKeywordsStage } from './stages/05-keywords.stage';
export { getJobJournalDatabase, getJobJournalVecStatus, initializeJobJournalDatabase } from './storage/database';
export { JOB_JOURNAL_SCHEMA, JOB_JOURNAL_VEC_SCHEMA } from './storage/schema';

export type {
  JobJournalJob,
  JobJournalStage,
  JobJournalStageExecution,
  JobJournalStatus,
} from './types';

export { parseStageLastError } from './utils/error';
