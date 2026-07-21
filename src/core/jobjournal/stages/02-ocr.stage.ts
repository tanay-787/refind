/* OCR stage
 * - Extracts text from screenshot image using rn-mlkit-ocr
 * - Optimized for Maximalist/Game UIs:
 *   If the image is Landscape, it performs a "Tiled Deep Scan" by splitting 
 *   the image into two halves (Left/Right). This helps ML Kit handle 
 *   small, dense, and multi-colored text in complex layouts.
 *
 * NOTE: rn-mlkit-ocr is intentionally NOT imported at the top level.
 * ML Kit initializes its TFLite model synchronously when the module is first
 * evaluated, which blocks the JS thread for several seconds. By using a
 * dynamic import inside runOcrStage(), initialization is deferred until the
 * OCR stage actually runs — well after the home screen is interactive.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import { getJobJournalDatabase } from '../storage/database';
import { getMetadata } from '../storage/database';
import type { JobJournalJob } from '../types';

// Re-export types so callers can still import them from here without
// pulling in the native module at their own parse time.
export type { OcrBlock, OcrResult } from 'rn-mlkit-ocr';

// Lazily resolved — populated on first runOcrStage() call, then reused.
let recognizeTextFn: ((uri: string, language: string) => Promise<any>) | null = null;

async function getRecognizeText() {
  if (!recognizeTextFn) {
    const mlkit = await import('rn-mlkit-ocr');
    recognizeTextFn = mlkit.recognizeText;
  }
  return recognizeTextFn;
}

type OcrResult = { text: string; blocks: any[] };

/**
 * Merges a tiled OCR result into a base result, adjusting coordinates.
 * @param base The primary OCR result to merge into
 * @param tile Result from a specific tile
 * @param offsetX Horizontal offset of the tile in the original image
 * @param offsetY Vertical offset of the tile in the original image
 * @param scale The upscale factor applied to the tile before OCR
 */
function mergeResults(base: OcrResult, tile: OcrResult, offsetX: number, offsetY: number, scale: number = 1): void {
  if (!tile.blocks) return;
  
  for (const block of tile.blocks) {
    // Adjust block frame: divide by scale to get back to original pixel space
    if (block.frame) {
      block.frame.x = (block.frame.x / scale) + offsetX;
      block.frame.y = (block.frame.y / scale) + offsetY;
      block.frame.width = block.frame.width / scale;
      block.frame.height = block.frame.height / scale;
    }
    
    // Adjust line frames
    if (block.lines) {
      for (const line of block.lines) {
        if (line.frame) {
          line.frame.x = (line.frame.x / scale) + offsetX;
          line.frame.y = (line.frame.y / scale) + offsetY;
          line.frame.width = line.frame.width / scale;
          line.frame.height = line.frame.height / scale;
        }
        // Adjust element frames
        if (line.elements) {
          for (const element of line.elements) {
            if (element.frame) {
              element.frame.x = (element.frame.x / scale) + offsetX;
              element.frame.y = (element.frame.y / scale) + offsetY;
              element.frame.width = element.frame.width / scale;
              element.frame.height = element.frame.height / scale;
            }
          }
        }
      }
    }
    
    base.blocks.push(block);
  }
  
  // Update master text (rudimentary append, post-process will clean up)
  if (tile.text) {
    base.text = (base.text || '') + '\n' + tile.text;
  }
}

export async function runOcrStage(job: JobJournalJob): Promise<{
  status: 'completed' | 'failed';
  error?: string;
}> {
  const tempUris: string[] = [];
  const SCALE_FACTOR = 2.0; // Upscale tiles by 2x for deep scan precision

  try {
    // Lazily load ML Kit — deferred to avoid blocking the JS thread at module
    // evaluation time (see top-of-file note).
    const recognizeText = await getRecognizeText();

    const metadata = await getMetadata(job.id);
    const isLandscape = metadata && metadata.width && metadata.height && metadata.width > metadata.height;

    console.log(`[ocr.stage] Processing ${job.id} (Landscape: ${!!isLandscape})`);

    let finalResult: OcrResult;

    // LANDSCAPE: Tiled-only path — tiles cover full image with overlap, 
    // so the global pass is redundant. Saves 1 ML Kit call per landscape image.
    if (isLandscape && metadata?.width && metadata?.height) {
      finalResult = { text: '', blocks: [] };
      const halfWidth = Math.floor(metadata.width / 2);
      const height = metadata.height;
      
      console.log(`[ocr.stage] Landscape detected. Running Tiled Deep Scan (2 Tiles, ${SCALE_FACTOR}x Scale)...`);

      const tiles = [
        { x: 0, y: 0, width: halfWidth + 50, height }, // Left + slight overlap
        { x: halfWidth - 50, y: 0, width: metadata.width - (halfWidth - 50), height } // Right + slight overlap
      ];

      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        try {
          // Crop and Upscale
          const manipResult = await ImageManipulator.manipulate(job.imageUri)
            .crop({
              originX: Math.max(0, tile.x),
              originY: Math.max(0, tile.y),
              width: Math.min(tile.width, metadata.width - tile.x),
              height: Math.min(tile.height, metadata.height - tile.y)
            })
            .resize({
              width: Math.min(tile.width, metadata.width - tile.x) * SCALE_FACTOR
            })
            .renderAsync();
            
          const savedTile = await manipResult.saveAsync({ 
            format: SaveFormat.JPEG, 
            compress: 0.9 
          });
          tempUris.push(savedTile.uri);

          const tileResult = await recognizeText(savedTile.uri, 'latin');
          if (tileResult) {
            console.log(`[ocr.stage] Tile ${i} processed. Found ${tileResult.blocks?.length || 0} blocks.`);
            mergeResults(finalResult, tileResult, tile.x, tile.y, SCALE_FACTOR);
          }
        } catch (tileErr) {
          console.warn(`[ocr.stage] Failed processing tile ${i}:`, tileErr);
        }
      }

      // If tiles produced nothing, fall back to global pass
      if (!finalResult.text && (!finalResult.blocks || finalResult.blocks.length === 0)) {
        console.log(`[ocr.stage] Tiled scan empty, falling back to global OCR`);
        const globalResult = await recognizeText(job.imageUri, 'latin');
        if (globalResult) finalResult = globalResult;
      }
    } else {
      // PORTRAIT / SQUARE: Single global pass
      console.log(`[ocr.stage] Processing ${job.id} (Portrait/Square)`);
      const globalResult = await recognizeText(job.imageUri, 'latin');
      if (!globalResult) {
        return { status: 'failed', error: 'OCR returned no result' };
      }
      finalResult = globalResult;
    }


    const db = await getJobJournalDatabase();
    const now = Date.now();
    
    // finalResult now contains combined blocks. 
    // Post-process stage will handle deduplication of overlapping areas.
    const text = finalResult.text ?? '';
    const blocks = finalResult.blocks ?? [];

    await db.runAsync(
      `INSERT OR REPLACE INTO ocr_stage_results
       (job_id, text, blocks_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [job.id, text, JSON.stringify(blocks), now, now],
    );

    return { status: 'completed' };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown OCR error',
    };
  } finally {
    // Cleanup temporary tile images
    for (const uri of tempUris) {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (err) {
        console.warn(`[ocr.stage] Failed to cleanup temp file:`, err);
      }
    }
  }
}


export async function getOcrResult(jobId: string): Promise<OcrResult | null> {
  const db = await getJobJournalDatabase();

  const row = await db.getFirstAsync<{
    text: string;
    blocks_json: string;
  }>(`SELECT text, blocks_json FROM ocr_stage_results WHERE job_id = ?`, [jobId]);

  if (!row) return null;

  return {
    text: row.text || '',
    blocks: row.blocks_json ? JSON.parse(row.blocks_json) : [],
  };
}
