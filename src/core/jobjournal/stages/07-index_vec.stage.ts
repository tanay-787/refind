import { getJobJournalDatabase, getJobJournalVecStatus } from '../storage/database';
import type { JobJournalJob } from '../types';

export async function runIndexVecStage(job: JobJournalJob): Promise<{ status: 'completed' | 'failed'; error?: string }> {
  try {
    const db = await getJobJournalDatabase();
    const now = Date.now();
    const vecStatus = getJobJournalVecStatus();

    if (!vecStatus.available) {
      return { status: 'failed', error: 'Vector indexing required but vec extension unavailable' };
    }

    // Fetch embeddings
    const embeddingRows = await db.getAllAsync<{ modality: string; vector: ArrayBuffer }>(
      `SELECT modality, vector FROM embedding_stage_results WHERE job_id = ?`,
      [job.id],
    );

    const imageEmbedding = embeddingRows.find((r) => r.modality === 'image');
    if (!imageEmbedding) {
      return { status: 'failed', error: 'Image embedding missing' };
    }

    const float32 = new Float32Array(imageEmbedding.vector);
    const embeddingJson = JSON.stringify(Array.from(float32));

    // 1. Update Vector Index
    await db.runAsync(`DELETE FROM image_embedding_index WHERE job_id = ?`, [job.id]);
    await db.runAsync(
      `INSERT INTO image_embedding_index (embedding, job_id)
       VALUES (?, ?)`,
      [embeddingJson, job.id],
    );

    // 2. Update Search Readiness
    const existing = await db.getFirstAsync<{ job_id: string }>(
      `SELECT job_id FROM search_readiness WHERE job_id = ?`,
      [job.id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE search_readiness 
         SET vector_ready = 1, updated_at = ?
         WHERE job_id = ?`,
        [now, job.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO search_readiness (job_id, fts_ready, vector_ready, keywords_ready, indexed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [job.id, 0, 1, 0, null, now]
      );
    }

    return { status: 'completed' };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Index Vec error',
    };
  }
}
