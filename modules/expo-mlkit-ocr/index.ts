import ExpoMlkitOcrModule from './src/ExpoMlkitOcrModule';
import type { DetectorType, OcrResult } from './src/ExpoMlkitOcr.types';

export * from './src/ExpoMlkitOcr.types';

/**
 * Recognizes text from a local image file URI or remote URL.
 *
 * @param imageUri - file URI (file:///path) or remote URL (https://)
 * @param detectorType - 'latin' (default) or 'devanagari'
 */
export async function recognizeText(
  imageUri: string,
  detectorType: DetectorType = 'latin'
): Promise<OcrResult> {
  return ExpoMlkitOcrModule.recognizeText(imageUri, detectorType);
}

/**
 * Returns the list of supported detector types / language scripts.
 */
export async function getAvailableLanguages(): Promise<DetectorType[]> {
  return ExpoMlkitOcrModule.getAvailableLanguages();
}

export default {
  recognizeText,
  getAvailableLanguages,
};
