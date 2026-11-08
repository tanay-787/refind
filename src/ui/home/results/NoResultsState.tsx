import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip } from 'heroui-native';
import { useThemeColors } from '@/theme';
import { useJobJournalStore } from '@/hooks';
import { count } from 'drizzle-orm';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';

// Common English stopwords that add no search value
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'i', 'me', 'my', 'you', 'your', 'it', 'its',
  'that', 'this', 'what', 'which', 'who', 'how', 'when', 'where', 'some',
]);

function deriveChips(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // strip punctuation
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t))
    .slice(0, 3); // at most 3 chips
}

interface NoResultsStateProps {
  query: string;
  onSuggestionTap: (suggestion: string) => void;
}

export const NoResultsState = React.memo(({ query, onSuggestionTap }: NoResultsStateProps) => {
  const colors = useThemeColors();
  const db = useJobJournalStore(state => state.db);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!db) return;
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const rows = await db
          .select({ status: jobJournalJobs.status, count: count(jobJournalJobs.id) })
          .from(jobJournalJobs)
          .groupBy(jobJournalJobs.status);
        if (!isMounted) return;
        let pending = 0;
        for (const row of rows) {
          if (row.status === 'pending' || row.status === 'running') pending += row.count;
        }
        setPendingCount(pending);
      } catch (e) {
        console.warn('[NoResultsState] fetch error:', e);
      }
    };
    void fetchPending();
    return () => {
      isMounted = false;
    };
  }, [db]);

  const chips = deriveChips(query);
  const hasChips = chips.length > 0;

  return (
    <View style={styles.container}>
      {/* Primary no-results message */}
      <View style={styles.messageContainer}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Nothing found.
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          {hasChips
            ? 'Try one of these simpler terms from your search:'
            : 'Try a shorter or more general search.'}
        </Text>
      </View>

      {/* Query-derived chips */}
      {hasChips && (
        <View style={styles.chipsRow}>
          {chips.map((chip) => (
            <Chip
              key={chip}
              size="sm"
              variant="secondary"
              onPress={() => onSuggestionTap(chip)}
            >
              <Chip.Label style={styles.chipText}>
                {chip}
              </Chip.Label>
            </Chip>
          ))}
        </View>
      )}

      {/* Pending context (indexing notice) */}
      {pendingCount > 0 && (
        <View style={styles.indexingContainer}>
          <Text style={[styles.indexingDivider, { color: colors.outline }]}>
            ─── STILL INDEXING ───
          </Text>
          <Text style={[styles.indexingText, { color: colors.onSurfaceVariant }]}>
            {`${pendingCount.toLocaleString()} screenshots are still being processed.`}
          </Text>
          <Text style={[styles.indexingText, { color: colors.onSurfaceVariant }]}>
            Your results will improve as indexing completes.
          </Text>
        </View>
      )}
    </View>
  );
});

NoResultsState.displayName = 'NoResultsState';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chipText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
  },
  indexingContainer: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  indexingDivider: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  indexingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
});
