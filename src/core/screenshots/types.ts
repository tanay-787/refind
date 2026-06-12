export type ScreenshotAsset = {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
  pipelineStage: 'ocr' | 'embedding' | 'enrichment' | 'done' | 'new';
  pipelineState: 'queued' | 'working' | 'indexed' | 'error';
  retryCount: number;
  lastError: string | null;
};

export type ScreenshotStatusFilterKey = 'all' | 'queued' | 'working' | 'indexed' | 'error';
