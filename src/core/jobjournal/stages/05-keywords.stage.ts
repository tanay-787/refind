import { getJobJournalDatabase } from '../storage/database';
import { canonicalize } from './03-ocr_postprocess.stage';
import type { JobJournalJob } from '../types';

/**
 * Splits a token into sub-tokens based on case changes and symbols.
 * Example: "ARGxInfyy" -> ["ARGx", "Infyy", "Infy", "ARG"]
 */
function expandToken(token: string): string[] {
  if (token.length <= 3) return [];
  
  const results = new Set<string>();
  
  // 1. Split by case changes and non-alphanumeric
  const parts = token.split(/([A-Z][a-z]+|(?=[A-Z][A-Z])|[^a-zA-Z0-9]+)/).filter(Boolean);
  
  if (parts.length > 1) {
    parts.forEach(p => {
      const clean = p.replace(/[^a-zA-Z0-9]/g, '');
      if (clean.length >= 3) results.add(clean);
    });
  }

  // 2. Add common prefixes/suffixes for very long strings
  if (token.length > 6) {
    results.add(token.slice(0, Math.floor(token.length / 2)));
    results.add(token.slice(Math.floor(token.length / 2)));
  }

  return Array.from(results);
}

export async function runKeywordsStage(job: JobJournalJob): Promise<{ status: 'completed' | 'failed'; error?: string }> {
  try {
    const db = await getJobJournalDatabase();

    const row = await db.getFirstAsync<{ text: string }>(
      `SELECT text FROM ocr_postprocess_stage_results WHERE job_id = ?`,
      [job.id],
    );

    if (!row || !row.text) {
      return { status: 'completed' };
    }

    // Exhaustive Tokenization
    const rawTokens = row.text.split(/[\s,!;?|()\[\]{}]+/).filter(t => t.length >= 2);
    const uniqueSearchableUnits = new Set<string>();

    for (const token of rawTokens) {
      // 1. Add Raw Token
      uniqueSearchableUnits.add(token);
      
      // 2. Add Canonical Form (absorbs OCR noise like I/l/1)
      const canon = canonicalize(token);
      if (canon.length >= 2) uniqueSearchableUnits.add(canon);
      
      // 3. Expand complex tokens (ARGxInfyy -> Infy)
      const expansions = expandToken(token);
      expansions.forEach(e => {
        uniqueSearchableUnits.add(e);
        const canonE = canonicalize(e);
        if (canonE.length >= 2) uniqueSearchableUnits.add(canonE);
      });
    }

    const now = Date.now();
    await db.runAsync(`DELETE FROM keyword_stage_results WHERE job_id = ?`, [job.id]);

    // Index EVERY unit. FTS5 handles this efficiently.
    const keywordsList = Array.from(uniqueSearchableUnits);
    if (keywordsList.length > 0) {
      // Wrap in explicit transaction to avoid per-statement auto-commit (reduces fsync overhead)
      await db.execAsync('BEGIN');
      try {
        const CHUNK_SIZE = 100;
        for (let i = 0; i < keywordsList.length; i += CHUNK_SIZE) {
          const chunk = keywordsList.slice(i, i + CHUNK_SIZE);
          const placeholdersList = chunk.map(() => `(?, ?, ?, ?, ?, ?, ?, ?)`).join(', ');
          const sql = `INSERT INTO keyword_stage_results (id, job_id, keyword, type, score, positions_json, created_at, updated_at) VALUES ${placeholdersList}`;
          
          const params: any[] = [];
          chunk.forEach((unit, idx) => {
            const counter = i + idx;
            const safeKw = unit.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
            const id = `${job.id}_k${counter}_${safeKw}`;
            params.push(
              id,
              job.id,
              unit,
              'expanded',
              100,
              '[]',
              now,
              now
            );
          });

          await db.runAsync(sql, params);
        }
        await db.execAsync('COMMIT');
      } catch (err) {
        await db.execAsync('ROLLBACK');
        throw err;
      }
    }

    return { status: 'completed' };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : 'Exhaustive Keywords error' };
  }
}

