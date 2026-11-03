import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '@/theme';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';

function LoadingState() {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.monoText, { color: colors.onSurfaceVariant }]}>
        Initializing...
      </Text>
      <ActivityIndicator size={14} color={colors.primary} />
    </View>
  );
}

function DiscoveryStatus() {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.monoText, { color: colors.onSurfaceVariant }]}>
        Finding screenshots...
      </Text>
      <ActivityIndicator size={14} color={colors.primary} />
    </View>
  );
}

export function LiveStatusText() {
  const db = useJobJournalStore(state => state.db);
  const phase = useJobJournalStore(state => state.phase);
  const hasCompletedInitialIntake = useJobJournalStore(state => state.hasCompletedInitialIntake);

  // During discovery and bulk ingestion on fresh install, render DiscoveryStatus with zero LiveQueries attached
  if (!hasCompletedInitialIntake && (phase === 'source' || phase === 'intake')) {
    return <DiscoveryStatus />;
  }
  
  if (!db) {
    return <LoadingState />;
  }

  return <LiveStatusTracker db={db} />;
}

function LiveStatusTracker({ db }: { db: any }) {
  const colors = useThemeColors();
  const storeIsProcessing = useJobJournalStore(state => state.isProcessing);
  
  const query = useMemo(() => {
    return db
      .select({
        status: jobJournalJobs.status,
        count: count(jobJournalJobs.id),
      })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db]);

  const { data } = useLiveQuery(query);
  
  if (!data) return <LoadingState />;

  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;
  let totalJobs = 0;

  for (const row of data) {
    if (row.status === 'pending') pending = row.count;
    else if (row.status === 'running') running = row.count;
    else if (row.status === 'completed') completed = row.count;
    else if (row.status === 'failed') failed = row.count;
    totalJobs += row.count;
  }

  const isProcessing = storeIsProcessing || pending > 0 || running > 0;
  const processedCount = completed + failed;
  
  if (isProcessing && processedCount === 0) {
    return (
      <View style={styles.row}>
        <Text style={[styles.monoText, { color: colors.onSurfaceVariant }]}>
          Reading your screenshots...
        </Text>
        <ActivityIndicator size={14} color={colors.primary} />
      </View>
    );
  }

  if (totalJobs === 0) {
    // True empty state, don't show a loader
    return null;
  }

  if (!isProcessing) {
    return <DefaultText count={totalJobs} />;
  }

  return (
    <View style={styles.rowInline}>
      <Text style={[styles.monoText, { color: colors.primary }]}>
        {processedCount.toLocaleString()}
      </Text>
      <Text style={[styles.monoText, { color: colors.onSurfaceVariant }]}>
        {` searchable · ${(pending + running).toLocaleString()} remaining`}
      </Text>
    </View>
  );
}

function DefaultText({ count }: { count?: number }) {
  const colors = useThemeColors();
  return (
    <View style={styles.rowInline}>
      <Text style={[styles.monoText, { color: colors.onSurfaceVariant }]}>
        {count !== undefined ? `${count.toLocaleString()} screenshots · all searchable` : 'Your library is ready'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monoText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
  },
});
