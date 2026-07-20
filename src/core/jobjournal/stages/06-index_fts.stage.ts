import { getJobJournalDatabase } from '../storage/database';
import type { JobJournalJob } from '../types';

export async function runIndexFtsStage(job: JobJournalJob): Promise<{ status: 'completed' | 'failed'; error?: string }> {
  try {
    const db = await getJobJournalDatabase();
    const now = Date.now();

    // Fetch Cleaned OCR text (postprocessed)
    const postRow = await db.getFirstAsync<{ text: string }>(
      `SELECT text FROM ocr_postprocess_stage_results WHERE job_id = ?`,
      [job.id],
    );
    const cleanedText = postRow?.text || '';

    // Fetch Raw OCR text (pre-postprocess) for trigram fallback
    const rawRow = await db.getFirstAsync<{ text: string }>(
      `SELECT text FROM ocr_stage_results WHERE job_id = ?`,
      [job.id],
    );
    const rawText = rawRow?.text || '';

    // Fetch All Keywords (No Limit)
    const keywordRows = await db.getAllAsync<{ keyword: string; type: string }>(
      `SELECT keyword FROM keyword_stage_results WHERE job_id = ?`,
      [job.id],
    );
    const keywordsText = keywordRows.map((row) => row.keyword).join(' ');
    
    const ftsReady = cleanedText.trim().length > 0 || keywordsText.trim().length > 0;
    const keywordsReady = keywordsText.trim().length > 0;

    // 1. Update FTS Indices
    await db.runAsync(`DELETE FROM screenshot_search_index WHERE job_id = ?`, [job.id]);
    await db.runAsync(`DELETE FROM screenshot_search_trigram WHERE job_id = ?`, [job.id]);
    
    // Standard Index: Cleaned Text + All Keywords (for high precision)
    await db.runAsync(
      `INSERT INTO screenshot_search_index (job_id, ocr_text, keywords)
       VALUES (?, ?, ?)`,
      [job.id, cleanedText, keywordsText],
    );

    // Trigram Index: Raw Text Only (as a fuzzy fallback for noise/artifacts)
    // Redundant keywords omitted since trigram covers all substrings.
    await db.runAsync(
      `INSERT INTO screenshot_search_trigram (job_id, ocr_text, keywords)
       VALUES (?, ?, ?)`,
      [job.id, rawText, ''],
    );

    // 2. Update Search Readiness (UPSERT to avoid SELECT+conditional branch)
    await db.runAsync(
      `INSERT INTO search_readiness (job_id, fts_ready, keywords_ready, indexed_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(job_id) DO UPDATE SET
         fts_ready = excluded.fts_ready,
         keywords_ready = excluded.keywords_ready,
         indexed_at = excluded.indexed_at,
         updated_at = excluded.updated_at`,
      [job.id, ftsReady ? 1 : 0, keywordsReady ? 1 : 0, now, now]
    );

    return { status: 'completed' };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Index FTS error',
    };
  }
}
