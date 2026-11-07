import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { 
  BottomSheet, 
  Card, 
  Button, 
  Chip, 
  Separator, 
  PressableFeedback 
} from 'heroui-native';

import { useThemeColors } from '@/theme';
import { useJobJournalStore } from '@/hooks';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';
import { IconView } from '@/ui/IconView';
import { GitHubIcon } from '@/ui/icons';
import { RadialChart, type TRadialChartVariant } from '@/ui/charts/radial-chart';

interface AboutCommunitySheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export const AboutCommunitySheet = React.memo(({ visible, onDismiss }: AboutCommunitySheetProps) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const db = useJobJournalStore(state => state.db);
  const sync = useJobJournalStore(state => state.sync);
  const isSyncing = useJobJournalStore(state => state.isSyncing);

  const [chartVariant, setChartVariant] = useState<TRadialChartVariant>('circle');

  const appVersion = Constants.expoConfig?.version ?? '1.8.0';

  const statusQuery = useMemo(() => {
    if (!db) return null;
    return db
      .select({ status: jobJournalJobs.status, count: count(jobJournalJobs.id) })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db]);

  const { data } = useLiveQuery(statusQuery as any);

  let completedCount = 0;
  let pendingCount = 0;
  if (data) {
    for (const row of data) {
      if (row.status === 'completed') {
        completedCount += row.count;
      } else if (row.status === 'pending' || row.status === 'running') {
        pendingCount += row.count;
      }
    }
  }

  const totalJobs = Math.max(completedCount + pendingCount, 1);
  const readyPercentage = Math.round((completedCount / totalJobs) * 100);

  const chartData = useMemo(() => [
    { label: 'Intake', value: completedCount + pendingCount, max: totalJobs, color: '#38BDF8' },
    { label: 'OCR Vision', value: completedCount, max: totalJobs, color: '#A78BFA' },
    { label: 'Search Ready', value: completedCount, max: totalJobs, color: '#34D399' },
  ], [completedCount, pendingCount, totalJobs]);

  const handleRescan = useCallback(async () => {
    try {
      await sync();
    } catch (e) {
      console.error('[AboutCommunitySheet] Rescan failed:', e);
    }
  }, [sync]);

  const openUrl = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.warn('[AboutCommunitySheet] Failed to open URL:', e);
    }
  }, []);

  const tileBg = colors.surfaceContainerHighest ?? colors.surfaceVariant;
  const trackColor = colors.surfaceContainerHighest ?? 'rgba(255, 255, 255, 0.08)';

  return (
    <BottomSheet
      isOpen={visible}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          backgroundClassName="rounded-t-[28px]"
          contentContainerClassName="px-5 pt-1 pb-6 gap-3.5"
          contentContainerProps={{
            style: {
              paddingBottom: Math.max(insets.bottom + 16, 28),
            }
          }}
        >
          {/* Header Branding & Version */}
          <View style={styles.headerRow}>
            <View style={styles.brandingGroup}>
              <Text 
                style={[
                  styles.title, 
                  { color: colors.onSurface }
                ]}
              >
                Refind
              </Text>
              <Text 
                style={[
                  styles.tagline, 
                  { color: colors.onSurfaceVariant }
                ]}
              >
                100% on-device &bull; Zero cloud &bull; Private
              </Text>
            </View>

            <Chip size="sm" variant="soft">
              <Chip.Label style={[styles.versionText, { color: colors.onSurfaceVariant }]}>
                {`v${appVersion}`}
              </Chip.Label>
            </Chip>
          </View>

          {/* Card 1: Discovery Engine & Library Status */}
          <Card variant="secondary" className="rounded-2xl p-4 gap-3.5 border border-border">
            {/* Header: Tag + Variant Toggle */}
            <View style={styles.engineHeaderRow}>
              <View style={styles.engineTag}>
                <IconView 
                  name="database" 
                  size={15} 
                  weight="medium" 
                  tintColor={colors.primary} 
                />
                <Text style={[styles.sectionCaption, { color: colors.onSurfaceVariant }]}>
                  DISCOVERY ENGINE
                </Text>
              </View>

              <View style={[styles.toggleContainer, { backgroundColor: tileBg }]}>
                <Pressable
                  onPress={() => setChartVariant('circle')}
                  style={[
                    styles.toggleOption,
                    chartVariant === 'circle' && [styles.toggleOptionActive, { backgroundColor: colors.surface }]
                  ]}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: chartVariant === 'circle' ? colors.onSurface : colors.onSurfaceVariant }
                  ]}>
                    Circle
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setChartVariant('semicircle')}
                  style={[
                    styles.toggleOption,
                    chartVariant === 'semicircle' && [styles.toggleOptionActive, { backgroundColor: colors.surface }]
                  ]}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: chartVariant === 'semicircle' ? colors.onSurface : colors.onSurfaceVariant }
                  ]}>
                    Semicircle
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Dynamic Chart Display based on selected variant */}
            {chartVariant === 'circle' ? (
              <View style={styles.circleChartRow}>
                <View style={styles.circleChartWrapper}>
                  <RadialChart.Root
                    data={chartData}
                    variant="circle"
                    barWidth={7}
                    gap={4}
                    style={{ width: 104, height: 104 }}
                  >
                    <RadialChart.Tracks color={trackColor} />
                    <RadialChart.Bars />
                    <RadialChart.Label
                      placeholder="Ready"
                      placeholderValue={`${readyPercentage}%`}
                      valueStyle={[styles.chartCenterValue, { color: colors.onSurface }]}
                      labelStyle={[styles.chartCenterLabel, { color: colors.onSurfaceVariant }]}
                    />
                  </RadialChart.Root>
                </View>

                <View style={styles.chartDetailsCol}>
                  <View style={styles.metricGroup}>
                    <Text style={[styles.metricNumber, { color: colors.onSurface }]}>
                      {completedCount.toLocaleString()}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                      screenshots indexed locally
                    </Text>
                  </View>

                  {/* Stage legend indicators */}
                  <View style={styles.stageDotsRow}>
                    <View style={styles.stageDotItem}>
                      <View style={[styles.stageDot, { backgroundColor: '#38BDF8' }]} />
                      <Text style={[styles.stageDotLabel, { color: colors.onSurfaceVariant }]}>Intake</Text>
                    </View>
                    <View style={styles.stageDotItem}>
                      <View style={[styles.stageDot, { backgroundColor: '#A78BFA' }]} />
                      <Text style={[styles.stageDotLabel, { color: colors.onSurfaceVariant }]}>OCR</Text>
                    </View>
                    <View style={styles.stageDotItem}>
                      <View style={[styles.stageDot, { backgroundColor: '#34D399' }]} />
                      <Text style={[styles.stageDotLabel, { color: colors.onSurfaceVariant }]}>FTS5</Text>
                    </View>
                  </View>

                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={handleRescan}
                    isDisabled={isSyncing}
                    className="rounded-full px-3.5 py-1.5 self-start mt-1"
                  >
                    <IconView 
                      name="sync" 
                      size={14} 
                      weight="medium"
                      tintColor={colors.onSecondaryContainer} 
                    />
                    <Button.Label style={[styles.rescanText, { color: colors.onSecondaryContainer }]}>
                      {isSyncing ? 'Scanning...' : 'Rescan'}
                    </Button.Label>
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.semicircleWrapper}>
                <View style={styles.semicircleChartContainer}>
                  <RadialChart.Root
                    data={chartData}
                    variant="semicircle"
                    barWidth={9}
                    gap={5}
                    style={{ width: '100%', height: 110 }}
                  >
                    <RadialChart.Tracks color={trackColor} />
                    <RadialChart.Bars />
                    <RadialChart.Label
                      placeholder="Search Ready"
                      placeholderValue={`${readyPercentage}%`}
                      valueStyle={[styles.semiCenterValue, { color: colors.onSurface }]}
                      labelStyle={[styles.semiCenterLabel, { color: colors.onSurfaceVariant }]}
                    />
                  </RadialChart.Root>
                </View>

                <View style={styles.semiFooterRow}>
                  <View style={styles.metricGroup}>
                    <Text style={[styles.metricNumberSmall, { color: colors.onSurface }]}>
                      {completedCount.toLocaleString()} indexed
                    </Text>
                    <View style={styles.stageDotsRow}>
                      <View style={styles.stageDotItem}>
                        <View style={[styles.stageDot, { backgroundColor: '#38BDF8' }]} />
                        <Text style={[styles.stageDotLabel, { color: colors.onSurfaceVariant }]}>Intake</Text>
                      </View>
                      <View style={styles.stageDotItem}>
                        <View style={[styles.stageDot, { backgroundColor: '#A78BFA' }]} />
                        <Text style={[styles.stageDotLabel, { color: colors.onSurfaceVariant }]}>OCR</Text>
                      </View>
                      <View style={styles.stageDotItem}>
                        <View style={[styles.stageDot, { backgroundColor: '#34D399' }]} />
                        <Text style={[styles.stageDotLabel, { color: colors.onSurfaceVariant }]}>FTS5</Text>
                      </View>
                    </View>
                  </View>

                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={handleRescan}
                    isDisabled={isSyncing}
                    className="rounded-full px-3.5 py-1.5 self-center"
                  >
                    <IconView 
                      name="sync" 
                      size={14} 
                      weight="medium"
                      tintColor={colors.onSecondaryContainer} 
                    />
                    <Button.Label style={[styles.rescanText, { color: colors.onSecondaryContainer }]}>
                      {isSyncing ? 'Scanning...' : 'Rescan'}
                    </Button.Label>
                  </Button>
                </View>
              </View>
            )}
          </Card>

          {/* Card 2: Community & Open Source Hub */}
          <Card variant="secondary" className="rounded-2xl p-3 gap-3 border border-border">
            {/* Top: Star on GitHub Spotlight Row */}
            <PressableFeedback
              onPress={() => openUrl('https://github.com/tanay-787/refind')}
              style={styles.githubHeroRow}
            >
              <PressableFeedback.Highlight />
              <View style={[styles.githubLogoBox, { backgroundColor: tileBg }]}>
                <GitHubIcon size={24} color={colors.onSurface} />
              </View>

              <View style={styles.githubTextGroup}>
                <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                  Star on GitHub
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                  Support Refind &amp; help others discover local AI
                </Text>
              </View>
            </PressableFeedback>

            <Separator variant="thin" />

            {/* Bottom: Dual Side-by-Side Action Tiles */}
            <View style={styles.actionTilesRow}>
              {/* Left Tile: Report Issue */}
              <PressableFeedback
                onPress={() => openUrl('https://github.com/tanay-787/refind/issues')}
                style={[styles.actionTile, { backgroundColor: tileBg }]}
              >
                <PressableFeedback.Highlight />
                <View style={styles.tileHeader}>
                  <IconView 
                    name="bug_report" 
                    size={20} 
                    weight="medium" 
                    tintColor={colors.onSurface} 
                  />
                  <IconView 
                    name="arrow_outward" 
                    size={14} 
                    weight="regular" 
                    tintColor={colors.outline} 
                  />
                </View>
                <Text style={[styles.tileTitle, { color: colors.onSurface }]}>
                  Report Issue
                </Text>
                <Text style={[styles.tileSubtitle, { color: colors.onSurfaceVariant }]}>
                  Bugs &amp; feedback
                </Text>
              </PressableFeedback>

              {/* Right Tile: Contribute Code */}
              <PressableFeedback
                onPress={() => openUrl('https://github.com/tanay-787/refind/blob/master/CONTRIBUTING.md')}
                style={[styles.actionTile, { backgroundColor: tileBg }]}
              >
                <PressableFeedback.Highlight />
                <View style={styles.tileHeader}>
                  <IconView 
                    name="code" 
                    size={20} 
                    weight="medium" 
                    tintColor={colors.onSurface} 
                  />
                  <IconView 
                    name="arrow_outward" 
                    size={14} 
                    weight="regular" 
                    tintColor={colors.outline} 
                  />
                </View>
                <Text style={[styles.tileTitle, { color: colors.onSurface }]}>
                  Contribute
                </Text>
                <Text style={[styles.tileSubtitle, { color: colors.onSurfaceVariant }]}>
                  Roadmap &amp; PRs
                </Text>
              </PressableFeedback>
            </View>
          </Card>

          {/* Footer */}
          <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
            Licensed under Apache 2.0 &bull; 100% Local-First
          </Text>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
});

AboutCommunitySheet.displayName = 'AboutCommunitySheet';

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  brandingGroup: {
    gap: 2,
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  versionText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
  },
  engineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionCaption: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 20,
    gap: 2,
  },
  toggleOption: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  toggleOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  circleChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circleChartWrapper: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterValue: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  chartCenterLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    marginTop: 1,
  },
  chartDetailsCol: {
    flex: 1,
    gap: 6,
  },
  stageDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  stageDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageDotLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  semicircleWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  semicircleChartContainer: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semiCenterValue: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  semiCenterLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  semiFooterRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  metricNumberSmall: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  metricGroup: {
    gap: 1,
  },
  metricNumber: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  metricLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pendingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  rescanText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  githubHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  githubLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  githubTextGroup: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  itemSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  actionTilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tileTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  tileSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
