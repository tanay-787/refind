export type PipelineStage =
  | 'ocr'
  | 'embedding'
  | 'enrichment'
  | 'done';

export type PipelineQueueState = 'pending' | 'processing' | 'completed' | 'error';

export type PipelineQueueItem = {
  id: string;
  screenshotId: string;
  stage: PipelineStage;
  priority: number;
  state: PipelineQueueState;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  lastError: string | null;
};

export type PipelineStats = {
  totalScreenshots: number;
  indexedScreenshots: number;
  queueDepth: number;
};

export type SearchResult = {
  id: string;
  uri: string;
  filename: string;
  createdAt: number;
  width: number;
  height: number;
  score: number;
  reason: 'fts' | 'embedding' | 'hybrid';
};

export type SiglipModelConfig = {
  visionUrl: string | null;
  textUrl: string | null;
  tokenizerUrl: string | null;
};

export type SiglipModelState = {
  config: SiglipModelConfig;
  status: 'idle' | 'downloading' | 'ready' | 'error';
  progress: number;
  error: string | null;
  visionPath: string | null;
  textPath: string | null;
  tokenizerPath: string | null;
};
