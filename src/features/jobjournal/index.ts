export { JOB_JOURNAL_SCHEMA } from './storage/schema';
export { getJobJournalDatabase, initializeJobJournalDatabase } from './storage/database';
export {
  loadJobJournalScreenshotSource,
  watchJobJournalScreenshotSource,
} from './screenshotSource';

export type {
  JobJournalCheckpoint,
  JobJournalJob,
  JobJournalStage,
  JobJournalStageExecution,
  JobJournalStatus,
} from './types';
