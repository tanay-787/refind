import { SiglipTokenizer } from './siglipTokenizer';
import { getPipelineDatabase } from './storage/database';
import {
  downloadSiglipTextModel,
  downloadSiglipVisionAndTokenizer,
  getSiglipModelState,
  loadSiglipModels,
  loadSiglipTextModel,
  loadSiglipTokenizer,
} from './siglipModelManager';

// Buffer may not be available at type-check time in React Native TS environment; declare as any
declare const Buffer: any;

export interface EmbeddingResult {
  imageEmbedding?: Float32Array;
  textEmbedding?: Float32Array;
}

let siglipInstance: any = null;
let tokenizer: SiglipTokenizer | null = null;
let loadingPromise: Promise<void> | null = null;

export function initializeEmbeddings(
  siglip: any,
  tokenizerInstance: SiglipTokenizer | null,
) {
  siglipInstance = siglip;
  tokenizer = tokenizerInstance;
}

async function ensureSiglipReady() {
  if (siglipInstance && tokenizer) {
    return;
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      await downloadSiglipVisionAndTokenizer();
      const state = getSiglipModelState();
      if (state.status === 'error') {
        throw new Error(state.error || 'SigLIP download failed');
      }

      siglipInstance = await loadSiglipModels();
      tokenizer = await loadSiglipTokenizer();
    })().finally(() => {
      loadingPromise = null;
    });
  }

  await loadingPromise;
}

async function ensureSiglipTextReady() {
  await ensureSiglipReady();
  if (!siglipInstance) {
    throw new Error('SigLIP not initialized');
  }

  const state = getSiglipModelState();
  if (!state.textPath) {
    await downloadSiglipTextModel();
  }
  await loadSiglipTextModel(siglipInstance);
}

export async function generateImageEmbedding(screenshotUri: string): Promise<Float32Array> {
  await ensureSiglipReady();

  const buffer = await siglipInstance.getImageEmbedding(screenshotUri);
  if (!buffer) {
    throw new Error('Invalid embedding returned from SigLIP');
  }
  return new Float32Array(buffer as ArrayBuffer);
}

export async function generateTextEmbedding(text: string): Promise<Float32Array> {
  await ensureSiglipTextReady();
  if (!tokenizer) {
    throw new Error('SigLIP tokenizer not initialized');
  }

  const tokens = tokenizer.encode(text);
  const tokenBuffer = tokenizer.toNativeBuffer(tokens);
  const embeddingBuffer = await siglipInstance.getTextEmbedding(tokenBuffer);

  if (!embeddingBuffer) {
    throw new Error('Invalid embedding returned from SigLIP');
  }

  return new Float32Array(embeddingBuffer as ArrayBuffer);
}

export async function storeImageEmbedding(
  screenshotId: string,
  embedding: Float32Array,
): Promise<void> {
  const db = await getPipelineDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO embeddings (screenshot_id, embedding, model, created_at)
     VALUES (?, ?, ?, ?)`,
    [
      screenshotId,
      Buffer.from(embedding.buffer).toString('base64'),
      'siglip2',
      Date.now(),
    ],
  );

  await db.runAsync(`DELETE FROM embeddings_vec WHERE screenshot_id = ?`, [screenshotId]);
  await db.runAsync(
    `INSERT INTO embeddings_vec (embedding, screenshot_id)
     VALUES (?, ?)`,
    [JSON.stringify(Array.from(embedding)), screenshotId],
  );

}

export async function getImageEmbedding(screenshotId: string): Promise<Float32Array | null> {
  const db = await getPipelineDatabase();

  const row = await db.getFirstAsync<{ embedding: string }>(
    `SELECT embedding FROM embeddings WHERE screenshot_id = ? AND model = 'siglip2'`,
    [screenshotId],
  );

  if (!row || !row.embedding) {
    return null;
  }

  const buffer = Buffer.from(row.embedding, 'base64');
  const uint8 = new Uint8Array(buffer as any);
  const floatBuf = new Float32Array(uint8.buffer);
  return new Float32Array(floatBuf.buffer, floatBuf.byteOffset, floatBuf.length);
}

export function unloadEmbeddings() {
  if (siglipInstance) {
    siglipInstance.unloadModels?.();
  }
  siglipInstance = null;
  tokenizer = null;
}
