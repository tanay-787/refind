export { runMetadataStage, getMetadata, type MetadataResult } from './stages/01-metadata.stage';

export { runOcrStage, getOcrResult, type OcrResult, type OcrBlock } from './stages/02-ocr.stage';

export { runOcrPostprocessStage, getOcrPostprocessed, type OcrPostprocessedResult } from './stages/03-ocr_postprocess.stage';

export { runEmbeddingStage } from './stages/04-embedding.stage';

export { runKeywordsStage } from './stages/05-keywords.stage';

export { runIndexStage } from './stages/06-index.stage';


