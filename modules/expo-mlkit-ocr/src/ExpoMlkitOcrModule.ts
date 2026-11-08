import { NativeModule, requireNativeModule } from 'expo';
import type { OcrResult, DetectorType } from './ExpoMlkitOcr.types';

declare class ExpoMlkitOcrNativeModule extends NativeModule {
  recognizeText(imageUri: string, detectorType?: DetectorType): Promise<OcrResult>;
  getAvailableLanguages(): Promise<DetectorType[]>;
}

export default requireNativeModule<ExpoMlkitOcrNativeModule>('ExpoMlkitOcr');
