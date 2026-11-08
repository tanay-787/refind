import { useState, useEffect, useMemo } from 'react';
import { count } from 'drizzle-orm';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';
import { useJobJournalStore } from './useJobJournalStore';

export interface DiscoveryEngineStats {
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  totalJobs: number;
  readyPercentage: number;
  chartData: {
    label: string;
    value: number;
    max: number;
    color: string;
  }[];
}

export function useDiscoveryEngineStats(options?: { enabled?: boolean }): DiscoveryEngineStats {
  const enabled = options?.enabled ?? true;
  const db = useJobJournalStore(state => state.db);
  const phase = useJobJournalStore(state => state.phase);
  const hasCompletedInitialIntake = useJobJournalStore(state => state.hasCompletedInitialIntake);

  const [data, setData] = useState<{ status: string; count: number }[]>([]);

  // During discovery and bulk ingestion on fresh install, avoid querying
  const shouldQuery = enabled && Boolean(db) && (hasCompletedInitialIntake || (phase !== 'source' && phase !== 'intake'));

  useEffect(() => {
    if (!shouldQuery || !db) return;

    let isMounted = true;
    const fetchStats = async () => {
      try {
        const rows = await db
          .select({
            status: jobJournalJobs.status,
            count: count(jobJournalJobs.id),
          })
          .from(jobJournalJobs)
          .groupBy(jobJournalJobs.status);

        if (isMounted) {
          setData(rows);
        }
      } catch (err) {
        console.warn('[useDiscoveryEngineStats] query error:', err);
      }
    };

    void fetchStats();
    // Refresh stats periodically while sheet is active/open
    const timer = setInterval(fetchStats, 2000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [shouldQuery, db]);

  let completedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;

  for (const row of data) {
    if (row.status === 'completed') {
      completedCount += row.count;
    } else if (row.status === 'pending' || row.status === 'running') {
      pendingCount += row.count;
    } else if (row.status === 'failed') {
      failedCount += row.count;
    }
  }

  const rawTotal = completedCount + pendingCount + failedCount;
  const totalJobs = Math.max(rawTotal, 1);
  const readyPercentage = Math.round((completedCount / totalJobs) * 100);

  const chartData = useMemo(() => [
    { label: 'Search Ready', value: completedCount, max: totalJobs, color: '#10B981' },
    { label: 'Pending', value: pendingCount, max: totalJobs, color: '#F59E0B' },
    { label: 'Failed', value: failedCount, max: totalJobs, color: '#EF4444' },
  ], [completedCount, pendingCount, failedCount, totalJobs]);

  return {
    completedCount,
    pendingCount,
    failedCount,
    totalJobs,
    readyPercentage,
    chartData,
  };
}
