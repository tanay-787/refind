import React from 'react';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count, eq, desc } from 'drizzle-orm';
import { jobJournalJobs, metadataStageResults } from '@/core/jobjournal/storage/drizzle-schema';
import { Column, Row, Text as ComposeText, LoadingIndicator, Box, LinearProgressIndicator, LinearWavyProgressIndicator, AnimatedVisibility, EnterTransition, ExitTransition } from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, height, size, padding, clip, Shapes, background, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useThemeColors } from '@/theme';
import { ResultsList } from './ResultsList';
import { ResultItem } from './ResultItem';
import { WelcomeState } from './WelcomeState';
import { SearchResult } from '@/core/jobjournal/search/hybrid';
import { IconView } from '@/ui/IconView';

interface IdleDashboardProps {
  recentItems: SearchResult[];
  itemSize: number;
  spacing: number;
  columnCount: number;
}

export function IdleDashboard({ recentItems, itemSize, spacing, columnCount }: IdleDashboardProps) {
  const db = useJobJournalStore(state => state.db);
  const isSyncing = useJobJournalStore(state => state.isSyncing);
  const storeIsProcessing = useJobJournalStore(state => state.isProcessing);
  const colors = useThemeColors();
  
  const [showCelebration, setShowCelebration] = React.useState(false);
  const wasProcessing = React.useRef(false);

  if (!db) return <WelcomeState />;

  const query = React.useMemo(() => {
    return db
      .select({
        status: jobJournalJobs.status,
        count: count(jobJournalJobs.id),
      })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db, isSyncing]); // Depend on isSyncing so it forcefully refetches after sync completes

  const { data } = useLiveQuery(query);

  const recentItemsQuery = React.useMemo(() => {
    return db
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
  }, [db, isSyncing]);

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

  const isProcessing = isSyncing || storeIsProcessing || pending > 0 || running > 0;
  const totalProcessed = completed + failed;
  const totalJobs = pending + running + completed + failed;

  React.useEffect(() => {
    if (wasProcessing.current && !isProcessing && totalProcessed > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    wasProcessing.current = isProcessing;
  }, [isProcessing, totalProcessed]);

  // Phase 1: Heavy Lifting (Processing)
  if ((isProcessing && totalProcessed < 12) || showCelebration) {
    const progress = totalJobs > 0 ? totalProcessed / totalJobs : 0;

    return (
      <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
        {showCelebration ? (
          <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 24 }} modifiers={[padding(32, 0, 32, 0)]}>

            {/* Thumbnail row — carried over from the processing view for visual continuity */}
            <AnimatedVisibility
              visible={showCelebration}
              enterTransition={EnterTransition.fadeIn({ initialAlpha: 0 }).plus(EnterTransition.slideInVertically({ initialOffsetY: 0.15 }))}
            >
              <Row horizontalArrangement={{ spacedBy: 8 }}>
                {liveRecentItems.slice(0, 3).map((item, idx) => (
                  <Box key={idx} modifiers={[size(72, 108), clip(Shapes.RoundedCorner(4)), background(colors.surfaceVariant)]}>
                    <ResultItem item={item} />
                  </Box>
                ))}
              </Row>
            </AnimatedVisibility>

            {/* Badge + headline */}
            <AnimatedVisibility
              visible={showCelebration}
              enterTransition={EnterTransition.scaleIn({ initialScale: 0.7 }).plus(EnterTransition.fadeIn({ initialAlpha: 0 }))}
            >
              <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 12 }}>
                {/* Bordered check badge — borders over shadows per design system */}
                <Box
                  modifiers={[size(56, 56), clip(Shapes.RoundedCorner(4)), background(colors.primaryContainer)]}
                  contentAlignment="center"
                >
                  <IconView name="check" size={28} tintColor={colors.onPrimaryContainer} inNative={true} />
                </Box>

                <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 6 }}>
                  <ComposeText
                    color={colors.onSurface}
                    style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 28, textAlign: 'center' }}
                  >
                    All done.
                  </ComposeText>
                  {/* JetBrainsMono for data — per design system "Technical Meta" */}
                  <ComposeText
                    color={colors.onSurfaceVariant}
                    style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, textAlign: 'center' }}
                  >
                    {`${totalProcessed.toLocaleString()} screenshots indexed`}
                  </ComposeText>
                </Column>
              </Column>
            </AnimatedVisibility>

            {/* Action prompt — fades in last, uses primary blue */}
            <AnimatedVisibility
              visible={showCelebration}
              enterTransition={EnterTransition.fadeIn({ initialAlpha: 0 })}
            >
              <ComposeText
                color={colors.primary}
                style={{ fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center' }}
              >
                Start searching above ↑
              </ComposeText>
            </AnimatedVisibility>

          </Column>
        ) : (
          <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 24 }}>
            <ComposeText color={colors.onSurface} style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 24, textAlign: 'center' }}>
              {isSyncing && totalJobs === 0 ? "Finding screenshots..." : `Found ${totalJobs.toLocaleString()} screenshots`}
            </ComposeText>

            <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 12 }} modifiers={[fillMaxWidth(), padding(32, 0, 32, 0)]}>
              <LinearWavyProgressIndicator 
                progress={progress} 
                color={colors.primary} 
                trackColor={colors.surfaceVariant}
                modifiers={[fillMaxWidth()]} 
              />
              
              <ComposeText color={colors.onSurfaceVariant} style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, textAlign: 'center' }}>
                {totalProcessed.toLocaleString()} of {totalJobs.toLocaleString()} processed
              </ComposeText>
            </Column>

            {liveRecentItems.length > 0 ? (
              <Row horizontalArrangement={{ spacedBy: 8 }}>
                {liveRecentItems.slice(0, 3).map((item, idx) => (
                  <Box key={idx} modifiers={[size(64, 96), clip(Shapes.RoundedCorner(8)), background(colors.surfaceVariant)]}>
                    <ResultItem item={item} />
                  </Box>
                ))}
              </Row>
            ) : (
              <Box modifiers={[size(64, 96)]} />
            )}

            <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(12, 0, 0, 0)]}>
              <ComposeText color={colors.onSurfaceVariant} style={{ fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center' }}>
                Extracting text and making them searchable...
              </ComposeText>
            </Column>
          </Column>
        )}
      </Column>
    );
  }

  // Phase 2: Populated Feed (Recent Activity)
  const displayItems = liveRecentItems.length > 0 ? liveRecentItems : recentItems;

  if (displayItems.length > 0) {
    return (
      <Column modifiers={[fillMaxSize()]}>
        <Box modifiers={[weight(1)]}>
          <ResultsList 
            results={displayItems}
            itemSize={itemSize}
            spacing={spacing}
            columnCount={columnCount}
            isRAF={true}
          />
        </Box>
      </Column>
    );
  }

  // Phase 3: True Empty State (No processing, no items found)
  return (
    <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
      <WelcomeState />
    </Column>
  );
}
