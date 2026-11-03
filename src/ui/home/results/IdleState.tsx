import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count, eq, desc } from 'drizzle-orm';
import { jobJournalJobs, metadataStageResults } from '@/core/jobjournal/storage/drizzle-schema';
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

/**
 * Pure React Native view rendered during source and intake phases.
 * Attaches ZERO database LiveQueries to prevent reactive thrashing during initial bulk ingestion.
 */
function DiscoveryView() {
  const colors = useThemeColors();
  return (
    <View style={styles.centeredContainer}>
      <View style={styles.discoveryContent}>
        <Text style={[styles.headline, { color: colors.onSurface }]}>
          Finding screenshots...
        </Text>

        <View style={styles.progressSection}>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.progressBarIndeterminate, { backgroundColor: colors.primary }]} />
          </View>
          
          <Text style={[styles.statusMono, { color: colors.onSurfaceVariant }]}>
            Scanning your library...
          </Text>
        </View>

        <View style={styles.thumbnailSpacer} />

        <Text style={[styles.caption, { color: colors.onSurfaceVariant }]}>
          Searching your gallery for screenshots...
        </Text>
      </View>
    </View>
  );
}

interface LiveDashboardProps {
  db: any;
  recentItems: SearchResult[];
  itemSize: number;
  spacing: number;
  columnCount: number;
}

/**
 * Reactive dashboard mounted ONLY during execution and idle phases after intake has completed.
 */
function LiveDashboard({ db, recentItems, itemSize, spacing, columnCount }: LiveDashboardProps) {
  const storeIsProcessing = useJobJournalStore(state => state.isProcessing);
  const colors = useThemeColors();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const wasProcessing = useRef(false);

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

  const recentItemsQuery = useMemo(() => {
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
  }, [db]);

  const { data: recentItemsData } = useLiveQuery(recentItemsQuery);

  const liveRecentItems: SearchResult[] = useMemo(() => {
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

  const isProcessing = storeIsProcessing || pending > 0 || running > 0;
  const totalProcessed = completed + failed;
  const totalJobs = pending + running + completed + failed;

  useEffect(() => {
    if (wasProcessing.current && !isProcessing && totalProcessed > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    wasProcessing.current = isProcessing;
  }, [isProcessing, totalProcessed]);

  // Phase 1: Heavy Lifting (Processing) or Celebration
  if ((isProcessing && totalProcessed < 12) || showCelebration) {
    const progress = totalJobs > 0 ? Math.min(Math.max(totalProcessed / totalJobs, 0), 1) : 0;

    return (
      <View style={styles.centeredContainer}>
        {showCelebration ? (
          <View style={styles.celebrationContent}>
            {/* Thumbnail row */}
            <View style={styles.thumbnailRow}>
              {liveRecentItems.slice(0, 3).map((item, idx) => (
                <View 
                  key={idx} 
                  style={[styles.thumbnailBox, { backgroundColor: colors.surfaceVariant }]}
                >
                  <ResultItem item={item} />
                </View>
              ))}
            </View>

            {/* Check badge & headline */}
            <View style={styles.celebrationBadgeSection}>
              <View 
                style={[
                  styles.checkBadge, 
                  { backgroundColor: colors.primaryContainer }
                ]}
              >
                <IconView name="check" size={28} tintColor={colors.onPrimaryContainer} />
              </View>

              <View style={styles.headlineGroup}>
                <Text style={[styles.celebrationTitle, { color: colors.onSurface }]}>
                  All done.
                </Text>
                <Text style={[styles.statusMono, { color: colors.onSurfaceVariant }]}>
                  {`${totalProcessed.toLocaleString()} screenshots indexed`}
                </Text>
              </View>
            </View>

            {/* Action prompt */}
            <Text style={[styles.promptText, { color: colors.primary }]}>
              Start searching above ↑
            </Text>
          </View>
        ) : (
          <View style={styles.processingContent}>
            <Text style={[styles.headline, { color: colors.onSurface }]}>
              {totalJobs === 0 ? 'Finding screenshots...' : `Found ${totalJobs.toLocaleString()} screenshots`}
            </Text>

            <View style={styles.progressSection}>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceVariant }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      backgroundColor: colors.primary,
                      width: totalJobs > 0 ? `${progress * 100}%` : '40%',
                    }
                  ]} 
                />
              </View>
              
              <Text style={[styles.statusMono, { color: colors.onSurfaceVariant }]}>
                {totalJobs === 0 
                  ? 'Scanning your library...' 
                  : `${totalProcessed.toLocaleString()} of ${totalJobs.toLocaleString()} processed`}
              </Text>
            </View>

            {liveRecentItems.length > 0 ? (
              <View style={styles.thumbnailRow}>
                {liveRecentItems.slice(0, 3).map((item, idx) => (
                  <View 
                    key={idx} 
                    style={[styles.thumbnailBox, { backgroundColor: colors.surfaceVariant }]}
                  >
                    <ResultItem item={item} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.thumbnailSpacer} />
            )}

            <Text style={[styles.caption, { color: colors.onSurfaceVariant }]}>
              {totalJobs === 0 
                ? 'Searching your gallery for screenshots...' 
                : 'Extracting text and making them searchable...'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Phase 2: Populated Feed (Recent Activity)
  const displayItems = liveRecentItems.length > 0 ? liveRecentItems : recentItems;

  if (displayItems.length > 0) {
    return (
      <View style={styles.flexOne}>
        <ResultsList 
          results={displayItems}
          itemSize={itemSize}
          spacing={spacing}
          columnCount={columnCount}
          isRAF={true}
        />
      </View>
    );
  }

  // Phase 3: True Empty State (No processing, no items found)
  return (
    <View style={styles.centeredContainer}>
      <WelcomeState />
    </View>
  );
}

export function IdleDashboard({ recentItems, itemSize, spacing, columnCount }: IdleDashboardProps) {
  const db = useJobJournalStore(state => state.db);
  const phase = useJobJournalStore(state => state.phase);
  const hasCompletedInitialIntake = useJobJournalStore(state => state.hasCompletedInitialIntake);

  // During discovery and initial bulk ingest on fresh install, render DiscoveryView with ZERO LiveQueries
  if (!hasCompletedInitialIntake && (phase === 'source' || phase === 'intake')) {
    return <DiscoveryView />;
  }

  if (!db) return <WelcomeState />;

  return (
    <LiveDashboard
      db={db}
      recentItems={recentItems}
      itemSize={itemSize}
      spacing={spacing}
      columnCount={columnCount}
    />
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryContent: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
    paddingHorizontal: 32,
  },
  processingContent: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
    paddingHorizontal: 32,
  },
  celebrationContent: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
    paddingHorizontal: 32,
  },
  headline: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 24,
    textAlign: 'center',
  },
  celebrationTitle: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 28,
    textAlign: 'center',
  },
  headlineGroup: {
    alignItems: 'center',
    gap: 6,
  },
  celebrationBadgeSection: {
    alignItems: 'center',
    gap: 12,
  },
  checkBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarIndeterminate: {
    width: '50%',
    height: '100%',
    borderRadius: 3,
  },
  statusMono: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  promptText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailBox: {
    width: 64,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailSpacer: {
    height: 96,
  },
});
