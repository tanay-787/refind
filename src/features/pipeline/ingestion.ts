import * as MediaLibrary from 'expo-media-library';
import { getPipelineDatabase } from './storage/database';
import { loadScreenshotAssets } from '@/features/screenshots/utils';

export interface ScreenshotMetadata {
  uri: string;
  filename: string;
  width: number;
  height: number;
  duration?: number;
}

async function computeContentHash(asset: MediaLibrary.Asset): Promise<string> {
  const modTime = (asset as { modificationTime?: number }).modificationTime ?? asset.creationTime ?? 0;
  const size = (asset as { size?: number }).size ?? 0;
  return `${asset.id}_${size}_${modTime}`;
}

export async function ingestScreenshots(): Promise<number> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission denied');
  }

  const db = await getPipelineDatabase();
  let ingestedCount = 0;
  const assets = await loadScreenshotAssets();

  for (const asset of assets) {
    const hash = await computeContentHash(asset);
    const info = await MediaLibrary.getAssetInfoAsync(asset, {
      shouldDownloadFromNetwork: false,
    });
    const uri = info.localUri || asset.uri || asset.id;

    const existing = await db.getFirstAsync<{ id: string; uri: string }>(
      `SELECT id, uri FROM screenshots WHERE content_hash = ?`,
      [hash],
    );

    if (existing) {
      if (existing.uri !== uri) {
        await db.runAsync(
          `UPDATE screenshots SET uri = ?, updated_at = ? WHERE id = ?`,
          [uri, Date.now(), existing.id],
        );
      }

      await db.runAsync(
        `UPDATE ingestion_queue
         SET stage = 'ocr', state = 'pending', retry_count = 0, last_error = NULL, updated_at = ?
         WHERE screenshot_id = ? AND state = 'error'`,
        [Date.now(), existing.id],
      );
      continue;
    }

    const now = Date.now();
    const screenshotId = `${now}_${Math.random().toString(36).slice(2, 9)}`;
    const createdAt = asset.creationTime ? asset.creationTime * 1000 : now;

    await db.runAsync(
      `INSERT INTO screenshots (id, uri, filename, width, height, content_hash, created_at, ingested_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        screenshotId,
        uri,
        asset.filename || 'unknown',
        asset.width || 1080,
        asset.height || 1920,
        hash,
        createdAt,
        now,
        now,
      ],
    );

    await db.runAsync(
      `INSERT INTO ingestion_queue (id, screenshot_id, stage, priority, state, retry_count, created_at, updated_at, last_error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`${screenshotId}_ocr`, screenshotId, 'ocr', 0, 'pending', 0, now, now, null],
    );

    ingestedCount++;
  }

  return ingestedCount;
}

export async function getIngestedCount(): Promise<number> {
  const db = await getPipelineDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM screenshots`,
  );
  return result?.count || 0;
}

export async function getQueuedCount(): Promise<number> {
  const db = await getPipelineDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ingestion_queue WHERE state = 'pending'`,
  );
  return result?.count || 0;
}
