import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { 
  BottomSheet, 
  Card, 
  Button, 
  Chip, 
  Separator, 
  PressableFeedback 
} from 'heroui-native';

import { useThemeColors } from '@/theme';
import { useJobJournalStore, useDiscoveryEngineStats } from '@/hooks';
import { IconView } from '@/ui/IconView';
import { GitHubIcon } from '@/ui/icons';
import { RadialChart } from '@/ui/charts/radial-chart';

interface AboutCommunitySheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export const AboutCommunitySheet = React.memo(({ visible, onDismiss }: AboutCommunitySheetProps) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const sync = useJobJournalStore(state => state.sync);
  const isSyncing = useJobJournalStore(state => state.isSyncing);

  const appVersion = Constants.expoConfig?.version ?? '1.8.0';

  const {
    completedCount,
    pendingCount,
    failedCount,
    readyPercentage,
    chartData,
  } = useDiscoveryEngineStats();

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
            {/* Header: Title + Rescan Button */}
            <View style={styles.engineHeaderRow}>
              <Text style={[styles.sectionCaption, { color: colors.onSurface }]}>
                DISCOVERY ENGINE
              </Text>

              <Button
                size="sm"
                variant="secondary"
                onPress={handleRescan}
                isDisabled={isSyncing}
                className="rounded-full px-2.5 py-1"
                style={styles.headerRescanBtn}
              >
                <IconView 
                  name="sync" 
                  size={13} 
                  weight="medium"
                  tintColor={colors.onSecondaryContainer} 
                />
                <Button.Label style={[styles.rescanText, { color: colors.onSecondaryContainer }]}>
                  {isSyncing ? 'Scanning...' : 'Rescan'}
                </Button.Label>
              </Button>
            </View>

            {/* Semicircle Radial Chart */}
            <View style={styles.semicircleWrapper}>
              <View style={styles.semicircleChartContainer}>
                <RadialChart.Root
                  data={chartData}
                  variant="semicircle"
                  barWidth={8}
                  gap={4}
                  style={{ width: '100%', height: 112 }}
                >
                  <RadialChart.Tracks color={trackColor} />
                  <RadialChart.Bars />
                  <RadialChart.Label
                    placeholder=""
                    placeholderValue={`${readyPercentage}%`}
                    formatValue={(point) => `${point.value.toLocaleString()}`}
                    valueStyle={[styles.semiCenterValue, { color: colors.onSurface }]}
                  />
                </RadialChart.Root>
              </View>

              {/* Semantic Legend Dots (Centered) */}
              <View style={styles.semiFooterRow}>
                <View style={styles.stageDotsRow}>
                  <View style={styles.stageDotItem}>
                    <View style={[styles.stageDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.stageDotLabel, { color: colors.onSurface }]}>
                      {`${completedCount.toLocaleString()} Ready`}
                    </Text>
                  </View>
                  <View style={styles.stageDotItem}>
                    <View style={[styles.stageDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.stageDotLabel, { color: pendingCount > 0 ? colors.onSurface : colors.onSurfaceVariant }]}>
                      {`${pendingCount.toLocaleString()} Pending`}
                    </Text>
                  </View>
                  <View style={styles.stageDotItem}>
                    <View style={[
                      styles.stageDot, 
                      { backgroundColor: failedCount > 0 ? '#EF4444' : 'rgba(239, 68, 68, 0.35)' }
                    ]} />
                    <Text style={[
                      styles.stageDotLabel, 
                      { color: failedCount > 0 ? '#EF4444' : colors.onSurfaceVariant }
                    ]}>
                      {`${failedCount.toLocaleString()} Failed`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Card 2: Community & Open Source Hub */}
          <Card variant="secondary" className="rounded-2xl p-4 gap-3.5 border border-border">
            {/* Top: Support & Star Copy */}
            <View style={styles.supportHeaderGroup}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                Want to support the project?
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                Star us on GitHub to boost visibility and help the project grow.
              </Text>
            </View>

            {/* Hero Star Button */}
            <Button
              size="md"
              variant="secondary"
              onPress={() => openUrl('https://github.com/tanay-787/refind')}
              className="w-full rounded-xl flex-row items-center justify-center gap-2"
              style={styles.heroStarBtn}
              accessibilityLabel="Star tanay-787/refind on GitHub"
            >
              <GitHubIcon size={18} color={colors.onSecondaryContainer ?? colors.onSurface} />
              <Button.Label style={[styles.heroStarBtnText, { color: colors.onSecondaryContainer ?? colors.onSurface }]}>
                tanay-787/refind
              </Button.Label>
              <IconView 
                name="arrow_outward" 
                size={14} 
                weight="medium" 
                tintColor={colors.onSecondaryContainer ?? colors.onSurface} 
              />
            </Button>

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
  sectionCaption: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  headerRescanBtn: {
    height: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  semicircleWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  semicircleChartContainer: {
    width: '100%',
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semiCenterValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  semiFooterRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
  },
  stageDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  stageDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageDotLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
  },
  rescanText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  supportHeaderGroup: {
    gap: 4,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  itemTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  itemSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
  },
  heroStarBtn: {
    height: 40,
    borderRadius: 12,
  },
  heroStarBtnText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
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
