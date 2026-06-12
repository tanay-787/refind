import { getOcrResult, type OcrBlock } from './02-ocr.stage';
import { getJobJournalDatabase } from '../storage/database';
import type { JobJournalJob } from '../types';

export interface OcrPostprocessedResult {
  text: string;
  blocks: OcrBlock[];
  language: string;
  blockCount: number;
}

/**
 * Calculates the overlap ratio between two frames.
 * Returns (Intersection Area) / (Area of smaller frame).
 */
function getOverlapRatio(a: any, b: any): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const intersectionArea = (x2 - x1) * (y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  
  return intersectionArea / Math.min(areaA, areaB);
}

/**
 * Strips OCR artifacts and serial-like UI noise.
 */
function isGibberish(text: string): boolean {
  if (!text) return true;
  const clean = text.trim();
  if (clean.length < 2) return true;
  if (clean.length < 4) return false; // Allow "HP", "LV", etc.

  const symbolCount = (clean.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (symbolCount / clean.length > 0.4) return true;

  const digitCount = (clean.match(/[0-9]/g) || []).length;
  // If it's 70%+ digits and long, it's likely a coordinate or ID string
  if (digitCount / clean.length > 0.7 && clean.length > 6) return true;

  return false;
}

function deduplicateAndFilterBlocks(blocks: OcrBlock[]): OcrBlock[] {
  const result: OcrBlock[] = [];
  // Favor blocks from later passes (tiles) by processing original list in reverse
  const sorted = [...blocks].reverse();

  for (const block of sorted) {
    if (!block.frame || !block.text?.trim()) continue;
    if (isGibberish(block.text)) continue;

    let isDuplicate = false;
    for (const existing of result) {
      const ratio = getOverlapRatio(block.frame, existing.frame);
      if (ratio > 0.7) { 
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(block);
    }
  }

  // Sort by vertical position then horizontal for natural reading order
  return result.sort((a, b) => {
    const yDiff = a.frame.y - b.frame.y;
    // If on roughly the same line (within 12px), sort by X
    if (Math.abs(yDiff) < 12) return a.frame.x - b.frame.x;
    return yDiff;
  });
}

/**
 * Normalizes visually similar characters to a canonical base for OCR stability.
 * Bridges errors like I/l/1, 0/O, etc.
 */
export function canonicalize(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD') // Separate accents/marks
    .replace(/[\u0300-\u036f]/g, '') // Remove marks
    .toLowerCase()
    .replace(/[0oO]/g, 'o') // Normalize zero and O
    .replace(/[1lLiI|]/g, 'i') // Normalize one, l, i, and pipe
    .replace(/[sS5]/g, 's') // Normalize s and 5
    .replace(/[zZ2]/g, 'z') // Normalize z and 2
    .trim();
}

export async function runOcrPostprocessStage(job: JobJournalJob): Promise<OcrPostprocessedResult> {
  const ocrResult = await getOcrResult(job.id);

  if (!ocrResult) {
    throw new Error(`OCR result not found for job ${job.id}`);
  }

  // 1. Spatial Deduplication & Noise Filtering
  const dedupedBlocks = deduplicateAndFilterBlocks(ocrResult.blocks);
  
  // 2. Reconstruct clean text from the best available blocks
  const cleanedText = dedupedBlocks
    .map(b => b.text.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const detectedLanguage = detectLanguage(cleanedText);
  const canonicalText = canonicalize(cleanedText);

  const db = await getJobJournalDatabase();
  const now = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO ocr_postprocess_stage_results
     (job_id, text, canonical_text, blocks_json, language, block_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [job.id, cleanedText, canonicalText, JSON.stringify(dedupedBlocks), detectedLanguage, dedupedBlocks.length, now, now],
  );

  return {
    text: cleanedText,
    blocks: dedupedBlocks,
    language: detectedLanguage,
    blockCount: dedupedBlocks.length,
  };
}


function detectLanguage(text: string): string {
  if (!text || text.length === 0) return 'en';
  const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
  const hasArabicChars = /[\u0600-\u06ff]/.test(text);
  const hasDevanagariChars = /[\u0900-\u097f]/.test(text);
  if (hasChineseChars) return 'zh';
  if (hasArabicChars) return 'ar';
  if (hasDevanagariChars) return 'hi';
  return 'en';
}


export async function getOcrPostprocessed(jobId: string): Promise<OcrPostprocessedResult | null> {
  const db = await getJobJournalDatabase();

  const row = await db.getFirstAsync<{
    text: string;
    blocks_json: string;
    language: string;
    block_count: number;
  }>(`SELECT text, blocks_json, language, block_count FROM ocr_postprocess_stage_results WHERE job_id = ?`, [jobId]);

  if (!row) return null;

  return {
    text: row.text || '',
    blocks: row.blocks_json ? JSON.parse(row.blocks_json) : [],
    language: row.language,
    blockCount: row.block_count,
  };
}
