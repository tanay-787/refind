/* Index stage
 * - Final stage: indexes OCR text into FTS5 and embeddings into vector index.
 * - Fetches OCR text and keywords from job_journal tables.
 * - Fetches embeddings (image + text) from job_journal_embeddings.
 * - Inserts into shared pipeline FTS5 (search_index) and vec0 (embeddings_vec).
 * - Uses job_id as the document ID across all indices for cross-reference.
 * - Once indexing completes, the job moves to 'completed' state and is ready for search.
 */
import { getJobJournalDatabase } from '../storage/database';
import type { JobJournalJob } from '../types';

export async function runIndexStage(job: JobJournalJob): Promise<{ status: 'completed' | 'failed'; error?: string }> {
  try {
    const db = await getJobJournalDatabase();

    // Fetch OCR text
    const ocrRow = await db.getFirstAsync<{ text: string }>(
      `SELECT text FROM job_journal_ocr_postprocessed WHERE job_id = ?`,
      [job.id],
    );
    const ocrText = ocrRow?.text || '';

    // Fetch keywords (for future enhancement: could include in FTS5 for better recall)
    // Currently stored but not used in search_index; can be reused for semantic keywords later
    await db.getAllAsync<{ keyword: string; type: string }>(
      `SELECT keyword, type FROM job_journal_keywords WHERE job_id = ? ORDER BY score DESC LIMIT 20`,
      [job.id],
    );

    // Insert into FTS5 search_index
    await db.runAsync(
      `INSERT OR REPLACE INTO search_index (screenshot_id, ocr_text)
       VALUES (?, ?)`,
      [job.id, ocrText],
    );

    // Fetch and register embeddings in vector index
    const embeddingRows = await db.getAllAsync<{ modality: string; vector: ArrayBuffer }>(
      `SELECT modality, vector FROM job_journal_embeddings WHERE job_id = ?`,
      [job.id],
    );

    // Register only the image embedding in vec0 (vec0 expects a single vector per doc)
    const imageEmbedding = embeddingRows.find((r) => r.modality === 'image');
    if (imageEmbedding) {
      const float32 = new Float32Array(imageEmbedding.vector);
      const embeddingJson = JSON.stringify(Array.from(float32));

      // Delete any old entry first
      await db.runAsync(`DELETE FROM embeddings_vec WHERE screenshot_id = ?`, [job.id]);

      // Insert the image embedding into vector index
      await db.runAsync(
        `INSERT INTO embeddings_vec (embedding, screenshot_id)
         VALUES (?, ?)`,
        [embeddingJson, job.id],
      );
    }

    return { status: 'completed' };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Index stage error',
    };
  }
}
