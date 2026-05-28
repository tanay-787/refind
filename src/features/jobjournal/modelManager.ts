/* Idempotent ModelManager for job-journal
 * - Thin, idempotent wrapper around pipeline/siglipModelManager that exposes:
 *   getStatus(), subscribe(), isReady(), ensureReady(), ensureTextReady(), unload().
 * - ensureReady() is safe to call concurrently; it serializes work via loadingPromise.
 * - Delegates downloads/loads to the pipeline manager and initializes the embeddings
 *   module so downstream callers can use generateImageEmbedding/generateTextEmbedding.
 * - Keeps model lifecycle separate from embedding stage logic; embedding stage will
 *   return WAITING_FOR_MODEL instead of attempting downloads itself.
 */
import type { SiglipModelState } from '../pipeline/types';
import {
  getSiglipModelState,
  subscribeSiglipModelState,
  downloadSiglipVisionAndTokenizer,
  downloadSiglipTextModel,
  loadSiglipModels,
  loadSiglipTextModel,
  loadSiglipTokenizer,
} from '../pipeline/siglipModelManager';
import { initializeEmbeddings } from '../pipeline/embeddings';

let siglipInstance: any | null = null;
let tokenizerInstance: any | null = null;
let loaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Lightweight idempotent ModelManager for job-journal embedding stage.
 * - isReady(): quick check
 * - ensureReady(): idempotent download+load of vision+tokenizer
 * - ensureTextReady(): ensure text model is loaded as well
 * - getStatus()/subscribe() => delegate to pipeline model state
 */
export function getStatus(): SiglipModelState {
  return getSiglipModelState();
}

export function subscribe(listener: (s: SiglipModelState) => void) {
  return subscribeSiglipModelState(listener);
}

export function isReady(): boolean {
  const s = getSiglipModelState();
  return s.status === 'ready' && loaded && siglipInstance !== null && tokenizerInstance !== null;
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

      // Load runtime models
      siglipInstance = await loadSiglipModels();
      tokenizerInstance = await loadSiglipTokenizer();

      // Wire into pipeline embeddings module so other callers can use it
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
  // Ensure vision/tokenizer are loaded first
  await ensureReady();
  if (!siglipInstance) throw new Error('SigLIP instance missing after ensureReady');

  const state = getSiglipModelState();
  if (!state.textPath) {
    await downloadSiglipTextModel();
  }

  // Load text model into the existing SigLIP instance
  await loadSiglipTextModel(siglipInstance);

  // Re-initialize embeddings to ensure text model is available downstream
  try {
    initializeEmbeddings(siglipInstance, tokenizerInstance);
  } catch { /* ignore */ }
}

export function unload(): void {
  try {
    // best-effort unload via pipeline manager
    if (siglipInstance && typeof siglipInstance.unloadModels === 'function') {
      siglipInstance.unloadModels();
    }
  } catch { /* ignore */ }
  siglipInstance = null;
  tokenizerInstance = null;
  loaded = false;
  loadingPromise = null;
}
