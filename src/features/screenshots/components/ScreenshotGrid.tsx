import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Chip, Text, useTheme } from 'react-native-paper';

import type { ScreenshotAsset, TimeFilterKey } from '../types';

type Props = {
  assets: ScreenshotAsset[];
  columns: number;
  error: string | null;
  loading: boolean;
  subtitleCount: number;
  timeFilter: TimeFilterKey;
  timeFilters: { key: TimeFilterKey; label: string }[];
  onOpenItem: (index: number) => void;
  onRefresh: () => void;
  onSetTimeFilter: (filter: TimeFilterKey) => void;
};

export function ScreenshotGrid({
  assets,
  columns,
  error,
  loading,
  subtitleCount,
  timeFilter,
  timeFilters,
  onOpenItem,
  onRefresh,
  onSetTimeFilter,
}: Props) {
  const theme = useTheme();

  return (
    <FlatList
      data={assets}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
      contentContainerStyle={styles.gridContent}
      ListHeaderComponent={
        <View style={styles.topMeta}>
          <View style={styles.headerRow}>
            <View>
              <Text variant="headlineSmall">Screenshots</Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {subtitleCount} items
              </Text>
            </View>

            <Chip icon="refresh" onPress={onRefresh} compact>
              Refresh
            </Chip>
          </View>

          <View style={styles.filterRow}>
            {timeFilters.map((filter) => (
              <Chip
                key={filter.key}
                selected={timeFilter === filter.key}
                onPress={() => onSetTimeFilter(filter.key)}>
                {filter.label}
              </Chip>
            ))}
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text variant="bodyMedium">Refreshing screenshots…</Text>
            </View>
          )}

          {error && <Text style={{ color: theme.colors.error, marginTop: 4 }}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.emptyState}>
            <Text variant="titleSmall">No screenshots found</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Try another time filter or check that the screenshot album exists on this device.
            </Text>
          </View>
        )
      }
      renderItem={({ item, index }) => (
        <Pressable style={styles.tilePressable} onPress={() => onOpenItem(index)}>
          <View style={styles.tile}>
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  gridContent: {
    paddingBottom: 24,
  },
  topMeta: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridRow: {
    gap: 1,
  },
  tilePressable: {
    flex: 1,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1c1c1c',
    overflow: 'hidden',
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingTop: 32,
    alignItems: 'center',
    gap: 8,
  },
});
