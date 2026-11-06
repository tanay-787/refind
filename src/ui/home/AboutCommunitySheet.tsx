import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { BottomSheet, Card, Button, Chip, Separator } from 'heroui-native';

import { useThemeColors } from '@/theme';
import { useJobJournalStore } from '@/hooks';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';
import { IconView } from '@/ui/IconView';
import { GitHubIcon } from '@/ui/icons';

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

          {/* Card 1: On-Device Engine & Library Status */}
          <Card variant="secondary" className="rounded-2xl p-4 gap-3 border border-border">
            {/* Header: Status badge & Tag */}
            <View style={styles.engineHeader}>
              <View style={styles.engineTag}>
                <IconView 
                  name="database" 
                  size={15} 
                  weight="medium" 
                  tintColor={colors.primary} 
                />
                <Text style={[styles.sectionCaption, { color: colors.onSurfaceVariant }]}>
                  ON-DEVICE ENGINE
                </Text>
              </View>
              <Chip size="sm" variant="soft">
                <Chip.Label style={[styles.chipText, { color: colors.onSurfaceVariant }]}>
                  100% Offline
                </Chip.Label>
              </Chip>
            </View>

            {/* Body: Metric Counter + Rescan Button */}
            <View style={styles.engineBody}>
              <View style={styles.metricGroup}>
                <Text style={[styles.metricNumber, { color: colors.onSurface }]}>
                  {completedCount.toLocaleString()}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                  screenshots indexed locally
                </Text>
                {pendingCount > 0 && (
                  <View style={styles.pendingRow}>
                    <View style={[styles.pendingDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.pendingText, { color: colors.primary }]}>
                      {`${pendingCount} pending analysis`}
                    </Text>
                  </View>
                )}
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
          </Card>

          {/* Card 2: Community & Open Source Hub */}
          <Card variant="secondary" className="rounded-2xl p-3 gap-3 border border-border">
            {/* Top: Star on GitHub Spotlight Row */}
            <Pressable
              onPress={() => openUrl('https://github.com/tanay-787/refind')}
              android_ripple={{ color: colors.surfaceVariant }}
              style={({ pressed }) => [
                styles.githubHeroRow,
                { opacity: pressed ? 0.75 : 1 }
              ]}
            >
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

              <Chip size="sm" variant="soft">
                <Chip.Label style={[styles.starChipText, { color: colors.onSurface }]}>
                  ★ Star
                </Chip.Label>
              </Chip>
            </Pressable>

            <Separator variant="thin" />

            {/* Bottom: Dual Side-by-Side Action Tiles */}
            <View style={styles.actionTilesRow}>
              {/* Left Tile: Report Issue */}
              <Pressable
                onPress={() => openUrl('https://github.com/tanay-787/refind/issues')}
                android_ripple={{ color: colors.surfaceVariant }}
                style={({ pressed }) => [
                  styles.actionTile,
                  { 
                    backgroundColor: tileBg,
                    opacity: pressed ? 0.75 : 1 
                  }
                ]}
              >
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
              </Pressable>

              {/* Right Tile: Contribute Code */}
              <Pressable
                onPress={() => openUrl('https://github.com/tanay-787/refind/blob/master/CONTRIBUTING.md')}
                android_ripple={{ color: colors.surfaceVariant }}
                style={({ pressed }) => [
                  styles.actionTile,
                  { 
                    backgroundColor: tileBg,
                    opacity: pressed ? 0.75 : 1 
                  }
                ]}
              >
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
              </Pressable>
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
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  starChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  engineHeader: {
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
  engineBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 6,
    borderRadius: 12,
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
