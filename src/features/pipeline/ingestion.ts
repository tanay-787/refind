import { File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getPipelineDatabase } from './storage/database';

export interface ScreenshotMetadata {
  uri: string;
  filename: string;
  width: number;
  height: number;
  duration?: number;
}

type AssetInfo = Awaited<ReturnType<typeof MediaLibrary.getAssetInfoAsync>>;

async function computeContentHash(
  asset: MediaLibrary.Asset,
  assetInfo: AssetInfo,
  uri: string,
): Promise<string> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('File not found');
  }

  const modTime =
    file.modificationTime || (assetInfo as { modificationTime?: number }).modificationTime || 0;
  const size = file.size || (assetInfo as { size?: number }).size || 0;
  return `${size}_${modTime}`;
}

export async function ingestScreenshots(): Promise<number> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission denied');
  }

  const db = await getPipelineDatabase();
  let ingestedCount = 0;
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      first: 100,
      after,
    });

    if (!page.assets.length) {
      break;
    }

    for (const asset of page.assets) {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      const uri = assetInfo.localUri || asset.uri || asset.id;
      const hash = await computeContentHash(asset, assetInfo, uri);

    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM screenshots WHERE content_hash = ?`,
      [hash],
    );

    if (existing) {
      continue;
    }

      const now = Date.now();
      const screenshotId = `${now}_${Math.random().toString(36).slice(2, 9)}`;

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
          asset.creationTime || now,
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

    hasNextPage = page.hasNextPage;
    after = page.endCursor ?? undefined;
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
