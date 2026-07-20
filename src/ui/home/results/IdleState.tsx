import React from 'react';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count, eq, desc } from 'drizzle-orm';
import { jobJournalJobs, metadataStageResults } from '@/core/jobjournal/storage/drizzle-schema';
import { Column, Text as ComposeText, LoadingIndicator, Box } from '@expo/ui/jetpack-compose';
import { fillMaxSize, size, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { useBrandColors } from '@/theme';
import { ResultsList } from './ResultsList';
import { WelcomeState } from './WelcomeState';
import { SearchResult } from '@/core/jobjournal/search/hybrid';

interface IdleDashboardProps {
  recentItems: SearchResult[];
  itemSize: number;
  spacing: number;
  columnCount: number;
}

export function IdleDashboard({ recentItems, itemSize, spacing, columnCount }: IdleDashboardProps) {
  const db = useJobJournalStore(state => state.db);
  const colors = useBrandColors();
  
  if (!db) return <WelcomeState />;

  const query = db
    .select({
      status: jobJournalJobs.status,
      count: count(jobJournalJobs.id),
    })
    .from(jobJournalJobs)
    .groupBy(jobJournalJobs.status);

  const { data } = useLiveQuery(query);

  const recentItemsQuery = db
    .select({
      jobId: jobJournalJobs.id,
      uri: jobJournalJobs.imageUri,
      width: metadataStageResults.width,
      height: metadataStageResults.height,
    })
    .from(jobJournalJobs)
    .leftJoin(metadataStageResults, eq(jobJournalJobs.id, metadataStageResults.jobId))
    .where(eq(jobJournalJobs.status, 'completed'))
    .orderBy(desc(jobJournalJobs.createdAt))
    .limit(12);

  const { data: recentItemsData } = useLiveQuery(recentItemsQuery);

  const liveRecentItems: SearchResult[] = React.useMemo(() => {
    if (!recentItemsData) return [];
    return recentItemsData.map((row: { width: number; height: number; jobId: any; uri: any; }) => {
      const w = row.width || 1;
      const h = row.height || 1;
      const aspect = w / h;
      return {
        jobId: row.jobId,
        uri: row.uri,
        ocrText: '',
        keywords: [],
        score: 1.0,
        searchMethod: 'fts',
        width: w,
        height: h,
        aspectRatio: aspect,
        isLandscape: aspect > 1,
      } as SearchResult;
    });
  }, [recentItemsData]);

  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;

  if (data) {
    for (const row of data) {
      if (row.status === 'pending') pending = row.count;
      else if (row.status === 'running') running = row.count;
      else if (row.status === 'completed') completed = row.count;
      else if (row.status === 'failed') failed = row.count;
    }
  }

  const isProcessing = pending > 0 || running > 0;
  const totalProcessed = completed + failed;

  // Phase 1: Heavy Lifting (Processing)
  // We wait until we have at least 12 items OR syncing is completely done before showing the feed.
  if (isProcessing && totalProcessed < 12) {
    return (
      <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
        <LoadingIndicator color={colors.primary} modifiers={[size(98, 98)]} />
        
        <Box modifiers={[padding(0, 24, 0, 0)]} />
        
        <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(20, 0, 20, 0)]}>
          <ComposeText 
            color={colors.onSurface} 
            style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 20, textAlign: 'center' }}
          >
            Building your memory...
          </ComposeText>
          
          <ComposeText 
            color={colors.onSurfaceVariant} 
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' }}
          >
            {totalProcessed} screenshots processed so far. This might take a minute or two depending on your library size.
          </ComposeText>
        </Column>
      </Column>
    );
  }

  // Phase 2: Populated Feed (Recent Activity)
  const displayItems = liveRecentItems.length > 0 ? liveRecentItems : recentItems;

  if (displayItems.length > 0) {
    return (
      <ResultsList 
        results={displayItems}
        itemSize={itemSize}
        spacing={spacing}
        columnCount={columnCount}
      />
    );
  }

  // Phase 3: True Empty State (No processing, no items found)
  return (
    <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
      <WelcomeState />
    </Column>
  );
}
