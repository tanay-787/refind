import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { BottomSheet, Card, Button, Chip } from 'heroui-native';

import { useThemeColors } from '@/theme';
import { useJobJournalStore } from '@/hooks';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';
import { IconView } from '@/ui/IconView';

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
          contentContainerClassName="px-5 pt-1 pb-6 gap-4"
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

          {/* Section 1: Library & On-Device Storage */}
          <Card variant="secondary" className="rounded-2xl p-4 border border-border">
            <View style={styles.cardHeader}>
              <View style={styles.libraryStatus}>
                <Card.Title style={[styles.cardTitle, { color: colors.onSurface }]}>
                  On-Device Library
                </Card.Title>
                <Card.Description style={[styles.libraryCount, { color: colors.onSurfaceVariant }]}>
                  {pendingCount > 0
                    ? `${completedCount} indexed \u2022 ${pendingCount} pending`
                    : `${completedCount} screenshots indexed`}
                </Card.Description>
              </View>

              <Button
                size="sm"
                variant="secondary"
                onPress={handleRescan}
                isDisabled={isSyncing}
                className="rounded-full px-3 py-1.5"
              >
                <IconView 
                  name="sync" 
                  size={15} 
                  tintColor={colors.onSecondaryContainer} 
                />
                <Button.Label style={[styles.rescanText, { color: colors.onSecondaryContainer }]}>
                  {isSyncing ? 'Scanning...' : 'Rescan'}
                </Button.Label>
              </Button>
            </View>
          </Card>

          {/* Section 2: Community & Open Source */}
          <Card variant="secondary" className="rounded-2xl p-2 border border-border">
            {/* Star on GitHub */}
            <Pressable
              onPress={() => openUrl('https://github.com/tanay-787/refind')}
              android_ripple={{ color: colors.surfaceVariant }}
              style={({ pressed }) => [
                styles.communityItem,
                { opacity: pressed ? 0.75 : 1 }
              ]}
            >
              <IconView name="star" size={22} tintColor={colors.primary} />
              <View style={styles.itemTextGroup}>
                <Card.Title style={[styles.itemTitle, { color: colors.onSurface }]}>
                  Star on GitHub
                </Card.Title>
                <Card.Description style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                  Support the project &amp; help others discover Refind
                </Card.Description>
              </View>
              <IconView name="chevron_right" size={16} tintColor={colors.outline} />
            </Pressable>

            {/* Report an Issue */}
            <Pressable
              onPress={() => openUrl('https://github.com/tanay-787/refind/issues')}
              android_ripple={{ color: colors.surfaceVariant }}
              style={({ pressed }) => [
                styles.communityItem,
                { opacity: pressed ? 0.75 : 1 }
              ]}
            >
              <IconView name="bug_report" size={22} tintColor={colors.onSurfaceVariant} />
              <View style={styles.itemTextGroup}>
                <Card.Title style={[styles.itemTitle, { color: colors.onSurface }]}>
                  Report an Issue or Suggestion
                </Card.Title>
                <Card.Description style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                  Encountered a bug or have an idea? Let us know
                </Card.Description>
              </View>
              <IconView name="chevron_right" size={16} tintColor={colors.outline} />
            </Pressable>

            {/* Contribute Code */}
            <Pressable
              onPress={() => openUrl('https://github.com/tanay-787/refind/blob/master/CONTRIBUTING.md')}
              android_ripple={{ color: colors.surfaceVariant }}
              style={({ pressed }) => [
                styles.communityItem,
                { opacity: pressed ? 0.75 : 1 }
              ]}
            >
              <IconView name="code" size={22} tintColor={colors.onSurfaceVariant} />
              <View style={styles.itemTextGroup}>
                <Card.Title style={[styles.itemTitle, { color: colors.onSurface }]}>
                  Contribute Code
                </Card.Title>
                <Card.Description style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                  View our roadmap and good first issues
                </Card.Description>
              </View>
              <IconView name="chevron_right" size={16} tintColor={colors.outline} />
            </Pressable>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  libraryStatus: {
    gap: 2,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  libraryCount: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
  },
  rescanText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  itemTextGroup: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  itemSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
