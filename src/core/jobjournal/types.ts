export type JobJournalStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_model';

export type JobJournalStage =
  | 'metadata'
  | 'ocr'
  | 'ocr_postprocess'
  | 'keywords'
  | 'index_fts';

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

export type JobJournalErrorCode =
  | 'PRECONDITION_FAILED'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'IO_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export type StageResult = {
  status: 'completed' | 'failed' | 'waiting_for_model';
  error?: string;
  errorCode?: JobJournalErrorCode;
};
