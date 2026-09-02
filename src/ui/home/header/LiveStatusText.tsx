import React from 'react';
import { useThemeColors } from '@/theme';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';
import { Row, LoadingIndicator, Text as ComposeText } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';

function LoadingState() {
  const brandColors = useThemeColors();
  return (
    <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 4 }}>
      <ComposeText 
        color={brandColors.onSurfaceVariant} 
        style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 14 }}
      >
        Initializing...
      </ComposeText>
      <LoadingIndicator color={brandColors.primary} modifiers={[size(17, 17)]} />
    </Row>
  );
}

export function LiveStatusText() {
  const db = useJobJournalStore(state => state.db);
  
  if (!db) {
    return <LoadingState />;
  }

  return <LiveStatusTracker db={db} />;
}

function LiveStatusTracker({ db }: { db: any }) {
  const brandColors = useThemeColors();
  
  const isSyncing = useJobJournalStore(state => state.isSyncing);
  const storeIsProcessing = useJobJournalStore(state => state.isProcessing);
  
  const query = React.useMemo(() => {
    return db
      .select({
        status: jobJournalJobs.status,
        count: count(jobJournalJobs.id),
      })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db, isSyncing]);

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

  const isProcessing = isSyncing || storeIsProcessing || pending > 0 || running > 0;
  const processedCount = completed + failed;
  
  if (isProcessing && processedCount === 0) {
    return (
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 4 }}>
        <ComposeText 
          color={brandColors.onSurfaceVariant} 
          style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 14 }}
        >
          {totalJobs === 0 || isSyncing ? 'Finding screenshots...' : 'Reading your screenshots...'}
        </ComposeText>
        <LoadingIndicator color={brandColors.primary} modifiers={[size(17, 17)]} />
      </Row>
    );
  }

  if (totalJobs === 0 && !isSyncing) {
    // True empty state, don't show a loader
    return null;
  }

  if (!isProcessing) {
    return <DefaultText count={totalJobs} />;
  }

  return (
    <Row verticalAlignment="center">
      <ComposeText 
        color={brandColors.primary}
        style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 14 }}
      >
        {processedCount.toLocaleString()}
      </ComposeText>
      <ComposeText 
        color={brandColors.onSurfaceVariant}
        style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 14 }}
      >
        {` searchable · ${(pending + running).toLocaleString()} remaining`}
      </ComposeText>
    </Row>
  );
}

function DefaultText({ count }: { count?: number }) {
  const brandColors = useThemeColors();
  return (
    <Row verticalAlignment="center">
      <ComposeText 
        color={brandColors.onSurfaceVariant}
        style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 14 }}
      >
        {count !== undefined ? `${count.toLocaleString()} screenshots · all searchable` : 'Your library is ready'}
      </ComposeText>
    </Row>
  );
}
