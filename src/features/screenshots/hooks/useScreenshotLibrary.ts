import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ingestScreenshots } from '@/features/pipeline/ingestion';
import { processNow } from '@/features/pipeline/backgroundTasks';
import { getPipelineDatabase } from '@/features/pipeline/storage/database';
import type { ScreenshotAsset } from '../types';

function normalizePipelineStage(
  value: 'ocr' | 'embedding' | 'enrichment' | 'done' | string | null,
): ScreenshotAsset['pipelineStage'] {
  if (value === 'ocr' || value === 'embedding' || value === 'enrichment' || value === 'done') {
    return value;
  }
  return 'new';
}

function normalizePipelineState(
  value: 'pending' | 'processing' | 'completed' | 'error' | string | null,
): ScreenshotAsset['pipelineState'] {
  if (value === 'processing') return 'working';
  if (value === 'completed') return 'indexed';
  if (value === 'error') return 'error';
  return 'queued';
}

export function useScreenshotLibrary() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<ScreenshotAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadFromPipeline = useCallback(async () => {
    const db = await getPipelineDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      uri: string;
      filename: string | null;
      created_at: number | null;
      width: number | null;
      height: number | null;
      queue_stage: 'ocr' | 'embedding' | 'enrichment' | 'done' | null;
      queue_state: 'pending' | 'processing' | 'completed' | 'error' | null;
      retry_count: number | null;
      last_error: string | null;
    }>(
      `SELECT
         s.id,
         s.uri,
         s.filename,
         s.created_at,
         s.width,
         s.height,
         q.stage as queue_stage,
         q.state as queue_state,
         q.retry_count,
         q.last_error
       FROM screenshots s
       LEFT JOIN ingestion_queue q ON q.screenshot_id = s.id
       ORDER BY s.created_at DESC
       LIMIT 500`,
    );

    return rows.map((row) => {
      const createdAt = row.created_at ?? Date.now();
      const creationTime = createdAt > 1000000000000 ? Math.floor(createdAt / 1000) : createdAt;
      return {
        id: row.id,
        uri: row.uri,
        filename: row.filename ?? 'screenshot',
        creationTime,
        width: row.width ?? 1080,
        height: row.height ?? 1920,
        pipelineStage: normalizePipelineStage(row.queue_stage),
        pipelineState: normalizePipelineState(row.queue_state),
        retryCount: row.retry_count ?? 0,
        lastError: row.last_error,
      };
    });
  }, []);

  const syncPipeline = useCallback(async () => {
    await ingestScreenshots();
    await processNow();
    const items = await loadFromPipeline();
    setAssets(items);
  }, [loadFromPipeline]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await syncPipeline();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load screenshots.');
    } finally {
      setLoading(false);
    }
  }, [syncPipeline]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (permissionResponse?.status === 'granted') {
      void refresh();
    }
    const interval = setInterval(() => {
      if (permissionResponse?.status === 'granted') {
        void refresh();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [permissionResponse?.status, refresh]);

  const requestAccess = useCallback(async () => {
    const response = await requestPermission();
    if (response.status === 'granted') {
      await refresh();
    }
  }, [refresh, requestPermission]);

  return {
    assets,
    error,
    loading,
    permissionResponse,
    granted: permissionResponse?.status === 'granted',
    denied: permissionResponse != null && permissionResponse.status !== 'granted',
    requestAccess,
    refresh,
  };
}
