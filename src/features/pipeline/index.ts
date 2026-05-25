export { getPipelineDatabase, initializePipelineDatabase } from './storage/database';
export { PIPELINE_SCHEMA, VEC_TABLE_SQL } from './storage/schema';

export type {
  PipelineQueueItem,
  PipelineStage,
  PipelineStats,
  SiglipModelState,
  SiglipModelConfig,
} from './types';

export { SiglipTokenizer } from './siglipTokenizer';

export {
  downloadSiglipModels,
  loadSiglipModels,
  loadSiglipTokenizer,
  unloadSiglipModels,
  initializeSiglipModels,
  getSiglipModelState,
  subscribeSiglipModelState,
} from './siglipModelManager';

export { extractOcrFromScreenshot, getOcrResult, type OcrResult, type OcrBlock } from './ocr';

export {
  generateImageEmbedding,
  generateTextEmbedding,
  storeImageEmbedding,
  getImageEmbedding,
  initializeEmbeddings,
  unloadEmbeddings,
} from './embeddings';

export { enrichScreenshot, getEnrichmentResult, type EnrichmentResult } from './enrichment';

export { ingestScreenshots, getIngestedCount, getQueuedCount } from './ingestion';

export { hybridSearch, metadataSearch, type SearchResult } from './search/hybrid';

export {
  registerBackgroundTasks,
  scheduleBackgroundTasks,
  processNow,
} from './backgroundTasks';

export {
  useScreenshotIngestion,
  useHybridSearch,
  useProcessing,
} from './hooks';

export { SearchScreen } from './screens/SearchScreen';

export { PipelineInitializer } from './components/PipelineInitializer';
