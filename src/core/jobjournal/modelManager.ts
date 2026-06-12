/* Idempotent ModelManager for job-journal
 * - Thin, idempotent wrapper around jobjournal/siglipModelManager that exposes:
 *   getStatus(), subscribe(), isReady(), ensureReady(), ensureTextReady(), unload().
 * - ensureReady() is safe to call concurrently; it serializes work via loadingPromise.
 * - Delegates downloads/loads to the local siglip manager and initializes the embeddings
 *   module so downstream callers can use generateImageEmbedding/generateTextEmbedding.
 * - Keeps model lifecycle separate from embedding stage logic; embedding stage will
 *   return WAITING_FOR_MODEL instead of attempting downloads itself.
 */
import type { SiglipModelState } from './types';
import {
  initializeSiglipModels,
  getSiglipModelState,
  subscribeSiglipModelState,
  downloadSiglipVisionAndTokenizer,
  downloadSiglipTextModel,
  loadSiglipModels,
  loadSiglipTextModel,
  loadSiglipTokenizer,
} from './siglipModelManager';
import { initializeEmbeddings } from './embeddings';

let siglipInstance: any | null = null;
let tokenizerInstance: any | null = null;
let loaded = false;
let textModelLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function configureModelUrls(visionUrl: string, textUrl: string, tokenizerUrl: string) {
  await initializeSiglipModels(visionUrl, textUrl, tokenizerUrl);
}

/**
 * Lightweight idempotent ModelManager for job-journal embedding stage.
 * - isReady(): quick check for BOTH vision and text models
 * - ensureReady(): idempotent download+load of vision+tokenizer+text
 * - getStatus()/subscribe() => delegate to local model state
 */
export function getStatus(): SiglipModelState {
  return getSiglipModelState();
}

export function subscribe(listener: (s: SiglipModelState) => void) {
  return subscribeSiglipModelState(listener);
}

export function isReady(): boolean {
  const s = getSiglipModelState();
  return s.status === 'ready' && s.isLoaded && s.isTextLoaded && siglipInstance !== null && tokenizerInstance !== null;
}

export async function ensureReady(): Promise<void> {
  if (isReady()) return;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      // Download vision+tokenizer if needed (idempotent)
      await downloadSiglipVisionAndTokenizer();
      const state = getSiglipModelState();
      if (state.status === 'error') {
        throw new Error(state.error || 'SigLIP download failed');
      }

      // Load runtime models (Vision)
      siglipInstance = await loadSiglipModels();
      tokenizerInstance = await loadSiglipTokenizer();

      // Ensure Text model is also loaded for search readiness
      const currentState = getSiglipModelState();
      if (!currentState.textPath) {
        await downloadSiglipTextModel();
      }
      await loadSiglipTextModel(siglipInstance);
      textModelLoaded = true;

      // Wire into job-journal embeddings module so other callers can use it
      try {
        initializeEmbeddings(siglipInstance, tokenizerInstance);
      } catch { /* ignore */ }

      loaded = true;
    })().finally(() => {
      loadingPromise = null;
    });
  }

  return loadingPromise;
}

export async function ensureTextReady(): Promise<void> {
  return ensureReady();
}

export function unload(): void {
  try {
    // best-effort unload via local manager
    if (siglipInstance && typeof siglipInstance.unloadModels === 'function') {
      siglipInstance.unloadModels();
    }
  } catch { /* ignore */ }
  siglipInstance = null;
  tokenizerInstance = null;
  loaded = false;
  textModelLoaded = false;
  loadingPromise = null;
}
