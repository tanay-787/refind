import React from 'react';
import { Text } from '@expo/ui';
import { Column, Row, Box } from '@expo/ui/jetpack-compose';
import { background, clip, Shapes, padding as paddingModifier, padding } from '@expo/ui/jetpack-compose/modifiers';
import { IconView } from '@/ui/IconView';
import { useMaterialColors } from '@expo/ui/jetpack-compose';
import { useJobJournalStore } from '@/hooks';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { jobJournalJobs } from '@/core/jobjournal/storage/drizzle-schema';

export const NoResultsState = React.memo(() => {
  const colors = useMaterialColors();
  const db = useJobJournalStore(state => state.db);

  const query = React.useMemo(() => {
    if (!db) return null;
    return db
      .select({
        status: jobJournalJobs.status,
        count: count(jobJournalJobs.id),
      })
      .from(jobJournalJobs)
      .groupBy(jobJournalJobs.status);
  }, [db]);

  const { data } = useLiveQuery(query as any);
  
  let pendingCount = 0;
  if (data) {
    for (const row of data) {
      if (row.status === 'pending' || row.status === 'running') {
        pendingCount += row.count;
      }
    }
  }

  return (
    <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 16 }}>
      <IconView 
        name="search" 
        size={56} 
        tintColor={colors.outline} 
        inNative={true}
      />
      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
        <Text textStyle={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 20 }}>No exact matches</Text>
        <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
            Try more general terms:
        </Text>
        <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(8, 0, 8, 0)]}>
          <Row horizontalArrangement={{ spacedBy: 8 }}>
            <Box modifiers={[paddingModifier(8, 4, 8, 4), background(colors.surfaceVariant), clip(Shapes.RoundedCorner(4))]}>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurface, fontSize: 13 }}>"receipt"</Text>
            </Box>
            <Box modifiers={[paddingModifier(8, 4, 8, 4), background(colors.surfaceVariant), clip(Shapes.RoundedCorner(4))]}>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurface, fontSize: 13 }}>"booking"</Text>
            </Box>
          </Row>
          <Box modifiers={[paddingModifier(8, 4, 8, 4), background(colors.surfaceVariant), clip(Shapes.RoundedCorner(4))]}>
             <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurface, fontSize: 13 }}>"code"</Text>
          </Box>
        </Column>
      </Column>
      
      {pendingCount > 0 && (
        <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 4 }} modifiers={[paddingModifier(0, 32, 0, 0)]}>
          <Box modifiers={[paddingModifier(0, 0, 0, 8)]}>
             <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.outline, fontSize: 12 }}>─────</Text>
          </Box>
          <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.onSurfaceVariant, fontSize: 13, textAlign: 'center' }}>
            {`${pendingCount.toLocaleString()} screenshots haven't been processed yet.`}
          </Text>
          <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.onSurfaceVariant, fontSize: 13, textAlign: 'center' }}>
            Results will improve as your library builds.
          </Text>
        </Column>
      )}
    </Column>
  );
});
