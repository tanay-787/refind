import { useCallback, useEffect, useState } from 'react';
import { ingestScreenshots, getIngestedCount, getQueuedCount } from '../ingestion';
import { getPipelineDatabase } from '../storage/database';

interface IngestionState {
  ingestedCount: number;
  queuedCount: number;
  completedCount: number;
  errorCount: number;
  loading: boolean;
  error: string | null;
}

export function useScreenshotIngestion() {
  const [state, setState] = useState<IngestionState>({
    ingestedCount: 0,
    queuedCount: 0,
    completedCount: 0,
    errorCount: 0,
    loading: false,
    error: null,
  });

  const updateStats = useCallback(async () => {
    try {
      const db = await getPipelineDatabase();

      const ingestedCount = await getIngestedCount();
      const queuedCount = await getQueuedCount();

      const completedResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ingestion_queue WHERE state = 'completed'`,
      );
      const completedCount = completedResult?.count || 0;

      const errorResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ingestion_queue WHERE state = 'error' OR retry_count > 3`,
      );
      const errorCount = errorResult?.count || 0;

      setState((prev) => ({
        ...prev,
        ingestedCount,
        queuedCount,
        completedCount,
        errorCount,
      }));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }, []);

  const ingest = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const count = await ingestScreenshots();
      await updateStats();
      setState((prev) => ({ ...prev, loading: false }));
      return count;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ingestion failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, [updateStats]);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    ...state,
    ingest,
    updateStats,
  };
}
