import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { RNHostView } from '@expo/ui/jetpack-compose';
import { ResultItem } from './ResultItem';
import { Link } from 'expo-router';
import type { SearchResult } from '@/core/jobjournal/search/hybrid';

interface ResultsListProps {
  results: SearchResult[];
  itemSize: number;
  spacing: number;
  columnCount: number;
}

export const ResultsList = React.memo(({ results, itemSize, spacing, columnCount }: ResultsListProps) => {

  const renderItem = useCallback(({ item, index }: { item: SearchResult, index: number }) => {
    const isLeftColumn = index % columnCount === 0;
    
    return (
      <View style={{
        paddingLeft: isLeftColumn ? 0 : spacing / 2,
        paddingRight: isLeftColumn ? spacing / 2 : 0,
        paddingBottom: spacing,
      }}>
        <Link 
          href={{ pathname: '/viewer', params: { uri: item.uri, jobId: item.jobId } }} 
          asChild
        >
          <ResultItem
            item={item}
            itemSize={itemSize}
          />
        </Link>
      </View>
    );
  }, [itemSize, spacing, columnCount]);

  return (
    <>
      <RNHostView matchContents={false}>
        <FlashList
          data={results}
          keyExtractor={(item) => item.jobId}
          numColumns={columnCount}
          contentContainerStyle={{ padding: spacing, paddingBottom: 100 }}
          estimatedItemSize={itemSize + spacing}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
        />
      </RNHostView>
    </>
  );
});
