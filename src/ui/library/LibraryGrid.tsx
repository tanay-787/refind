import React, { useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { RNHostView } from '@expo/ui/jetpack-compose';
import { LibraryItem } from './LibraryItem';
import { EmptyState } from './EmptyState';
import { Theme } from '@/theme';

interface LibraryGridProps {
  items: any[];
  theme: Theme;
  itemSize: number;
  spacing: number;
  columnCount: number;
  loading: boolean;
  onRefresh: () => void;
}
// onRefresh is not visible, reconsider the library UI, because why would the user want to see all screenshots at one place?
export const LibraryGrid = React.memo(({ 
  items, 
  theme, 
  itemSize, 
  spacing, 
  columnCount, 
  loading, 
  onRefresh 
}: LibraryGridProps) => {
  const renderItem = useCallback(({ item }: { item: any }) => (
    <LibraryItem item={item} itemSize={itemSize} />
  ), [itemSize]);

  return (
    <RNHostView matchContents={false}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={columnCount}
        contentContainerStyle={{ padding: spacing }}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={!loading ? <EmptyState theme={theme} /> : null}
      />
    </RNHostView>
  );
});
