import { recognizeText } from 'rn-mlkit-ocr';
import { getPipelineDatabase } from './storage/database';

export interface OcrBlock {
  text: string;
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
  language: string;
  confidence: number;
}

export async function extractOcrFromScreenshot(
  screenshotUri: string,
  screenshotId: string,
): Promise<OcrResult> {
  const result = await recognizeText(screenshotUri);

  const blocks: OcrBlock[] = (result.blocks || []).map((block: any) => ({
    text: block.text || '',
    frame: {
      x: block.frame?.x || 0,
      y: block.frame?.y || 0,
      width: block.frame?.width || 0,
      height: block.frame?.height || 0,
    },
  }));

  const ocrResult: OcrResult = {
    text: result.text || '',
    blocks,
    language: 'en',
    confidence: 0.9,
  };

  const db = await getPipelineDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO ocr_results (screenshot_id, text, blocks_json, language, confidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      screenshotId,
      ocrResult.text,
      JSON.stringify(ocrResult.blocks),
      ocrResult.language,
      ocrResult.confidence,
      Date.now(),
    ],
  );

  await db.runAsync(`DELETE FROM search_index WHERE screenshot_id = ?`, [screenshotId]);
  await db.runAsync(
    `INSERT INTO search_index (screenshot_id, ocr_text)
     VALUES (?, ?)`,
    [screenshotId, ocrResult.text],
  );

  return ocrResult;
}

export async function getOcrResult(screenshotId: string): Promise<OcrResult | null> {
  const db = await getPipelineDatabase();

  const row = await db.getFirstAsync<{
    text: string;
    blocks_json: string;
    language: string;
    confidence: number;
  }>(`SELECT text, blocks_json, language, confidence FROM ocr_results WHERE screenshot_id = ?`, [
    screenshotId,
  ]);

  if (!row) return null;

  return {
    text: row.text || '',
    blocks: row.blocks_json ? JSON.parse(row.blocks_json) : [],
    language: row.language,
    confidence: row.confidence,
  };
}
