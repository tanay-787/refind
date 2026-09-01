import React from 'react';
import { Text as ComposeText } from '@expo/ui/jetpack-compose';
import { Column, Row, Box, AnimatedVisibility, EnterTransition, SuggestionChip } from '@expo/ui/jetpack-compose';
import { background, clip, Shapes, padding as paddingModifier, padding, clickable } from '@expo/ui/jetpack-compose/modifiers';
import { IconView } from '@/ui/IconView';
import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
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
  const colors = useMaterialColors();
  const db = useJobJournalStore(state => state.db);

  const statusQuery = React.useMemo(() => {
    if (!db) return null;
    return db
      .select({ status: jobJournalJobs.status, count: count(jobJournalJobs.id) })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db]);

  const { data } = useLiveQuery(statusQuery as any);

  let pendingCount = 0;
  if (data) {
    for (const row of data) {
      if (row.status === 'pending' || row.status === 'running') pendingCount += row.count;
    }
  }

  const chips = deriveChips(query);
  const hasChips = chips.length > 0;

  return (
    <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 32 }} modifiers={[padding(32, 0, 32, 0)]}>

      {/* Primary no-results message */}
      <AnimatedVisibility
        visible={true}
        enterTransition={EnterTransition.fadeIn({ initialAlpha: 0 }).plus(EnterTransition.slideInVertically({ initialOffsetY: -0.1 }))}
      >
        <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
          <ComposeText color={colors.onSurface} style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 24, textAlign: 'center' }}>
            Nothing found.
          </ComposeText>
          <ComposeText color={colors.onSurfaceVariant} style={{
            fontFamily: 'Inter_400Regular',
            textAlign: 'center',
            fontSize: 14,
          }}>
            {hasChips
              ? 'Try one of these simpler terms from your search:'
              : 'Try a shorter or more general search.'}
          </ComposeText>
        </Column>
      </AnimatedVisibility>

      {/* Query-derived chips — only shown when we can extract meaningful tokens */}
      {hasChips && (
        <AnimatedVisibility
          visible={true}
          enterTransition={EnterTransition.scaleIn({ initialScale: 0.85 }).plus(EnterTransition.fadeIn({ initialAlpha: 0 }))}
        >
          <Row horizontalArrangement={{ spacedBy: 8 }}>
            {chips.map((chip) => (
              <SuggestionChip 
                key={chip} 
                onClick={() => onSuggestionTap(chip)}
                colors={{ containerColor: colors.surfaceVariant }}
                border={{ width: 0 }}
                modifiers={[clip(Shapes.RoundedCorner(4))]}
              >
                <SuggestionChip.Label>
                  <ComposeText color={colors.onSurface} style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 13 }}>
                    {chip}
                  </ComposeText>
                </SuggestionChip.Label>
              </SuggestionChip>
            ))}
          </Row>
        </AnimatedVisibility>
      )}

      {/* Pending context — secondary note, only shown when relevant */}
      {pendingCount > 0 && (
        <AnimatedVisibility
          visible={true}
          enterTransition={EnterTransition.fadeIn({ initialAlpha: 0 })}
        >
          <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
            <ComposeText color={colors.outline} style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 11,
              letterSpacing: 3,
              textAlign: 'center',
            }}>
              ─── STILL INDEXING ───
            </ComposeText>
            <ComposeText color={colors.onSurfaceVariant} style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              textAlign: 'center',
            }}>
              {`${pendingCount.toLocaleString()} screenshots are still being processed.`}
            </ComposeText>
            <ComposeText color={colors.onSurfaceVariant} style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              textAlign: 'center',
            }}>
              Your results will improve as indexing completes.
            </ComposeText>
          </Column>
        </AnimatedVisibility>
      )}

    </Column>
  );
});
