import { Card } from 'heroui-native/card';
import { Spinner } from 'heroui-native/spinner';
import { Text } from 'heroui-native/text';
import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Dimensions,
  RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobJournalLibrary, useJobJournalOperations } from '@/lib/hooks';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

export default function LibraryScreen() {
  const { items, loading, refresh } = useJobJournalLibrary();
  const { process, isProcessing } = useJobJournalOperations();

  const onRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Library</Text>
            <Text style={styles.subtitle}>{items.length} items</Text>
          </View>
          {isProcessing && <Spinner size="sm" />}
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          renderItem={({ item }) => (
            <Pressable style={styles.item}>
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: getStatusColor(item.status) }
              ]} />
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No screenshots found.</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'indexed': return '#22c55e'; // green
    case 'working': return '#3b82f6'; // blue
    case 'error': return '#ef4444'; // red
    default: return '#6b7280'; // gray
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 1,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    padding: 1,
  },
  image: {
    flex: 1,
    backgroundColor: '#111',
  },
  statusIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  empty: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});
