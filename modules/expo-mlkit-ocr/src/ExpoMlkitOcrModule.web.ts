import { registerWebModule, NativeModule } from 'expo';
import type { DetectorType, OcrResult } from './ExpoMlkitOcr.types';

class ExpoMlkitOcrModule extends NativeModule {
  async recognizeText(_imageUri: string, _detectorType?: DetectorType): Promise<OcrResult> {
    throw new Error('ExpoMlkitOcr is not supported on web');
  }

  async getAvailableLanguages(): Promise<DetectorType[]> {
    return [];
  }
}

export default registerWebModule(ExpoMlkitOcrModule, 'ExpoMlkitOcr');
