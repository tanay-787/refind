import { useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
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

export function useDiscoveryEngineStats(): DiscoveryEngineStats {
  const db = useJobJournalStore(state => state.db);

  const statusQuery = useMemo(() => {
    if (!db) return null;
    return db
      .select({
        status: jobJournalJobs.status,
        count: count(jobJournalJobs.id),
      })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db]);

  const { data } = useLiveQuery(statusQuery as any);

  let completedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;

  if (data) {
    for (const row of data) {
      if (row.status === 'completed') {
        completedCount += row.count;
      } else if (row.status === 'pending' || row.status === 'running') {
        pendingCount += row.count;
      } else if (row.status === 'failed') {
        failedCount += row.count;
      }
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
