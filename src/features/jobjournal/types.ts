export type JobJournalStatus = 'pending' | 'running' | 'completed' | 'failed';

export type JobJournalStage =
  | 'metadata'
  | 'ocr'
  | 'ocr_postprocess'
  | 'embedding'
  | 'keywords'
  | 'index';

export type JobJournalJob = {
  id: string;
  imageUri: string;
  imageHash: string;
  status: JobJournalStatus;
  createdAt: number;
  updatedAt: number;
};

export type JobJournalStageExecution = {
  id: string;
  jobId: string;
  stage: JobJournalStage;
  attempt: number;
  status: JobJournalStatus;
  leaseUntil: number | null;
  createdAt: number;
  updatedAt: number;
  lastError: string | null;
};

export type JobJournalCheckpoint = {
  jobId: string;
  stage: JobJournalStage;
  outputPath: string | null;
  createdAt: number;
  updatedAt: number;
};
