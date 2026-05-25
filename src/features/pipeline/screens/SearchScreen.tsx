import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useScreenshotIngestion, useHybridSearch, useProcessing } from '../hooks';
import type { SearchResult } from '../search/hybrid';

export function SearchScreen() {
  const ingestion = useScreenshotIngestion();
  const search = useHybridSearch();
  const processing = useProcessing();

  const handleSearch = useCallback(async () => {
    await search.search(search.query);
  }, [search]);

  const handleIngest = useCallback(async () => {
    try {
      const count = await ingestion.ingest();
      alert(`Ingested ${count} new screenshots`);
    } catch {
      if (ingestion.error) {
        alert(`Ingestion failed: ${ingestion.error}`);
      }
    }
  }, [ingestion]);

  const handleProcessNow = useCallback(async () => {
    try {
      await processing.process();
      await ingestion.updateStats();
      alert('Processing completed');
    } catch {
      if (processing.error) {
        alert(`Processing failed: ${processing.error}`);
      }
    }
  }, [processing, ingestion]);

  const renderResult = useCallback(
    ({ item }: { item: SearchResult }) => (
      <View style={styles.resultCard}>
        <Image source={{ uri: item.uri }} style={styles.resultImage} />
        <View style={styles.resultContent}>
          <Text style={styles.resultCaption}>{item.caption}</Text>
          <Text style={styles.resultSummary} numberOfLines={2}>
            {item.summary}
          </Text>
          {item.entities.length > 0 && (
            <View style={styles.tagContainer}>
              {item.entities.slice(0, 3).map((entity, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{entity}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.resultScore}>
            {item.searchMethod} · {(item.score * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Screenshot Search</Text>
      </View>

      <ScrollView style={styles.statsPanel} horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ingestion.ingestedCount}</Text>
          <Text style={styles.statLabel}>Ingested</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ingestion.queuedCount}</Text>
          <Text style={styles.statLabel}>Queued</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ingestion.completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ingestion.errorCount}</Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
      </ScrollView>

      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={[styles.button, ingestion.loading && styles.buttonDisabled]}
          onPress={handleIngest}
          disabled={ingestion.loading}
        >
          {ingestion.loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingest Screenshots</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, processing.processing && styles.buttonDisabled]}
          onPress={handleProcessNow}
          disabled={processing.processing}
        >
          {processing.processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Process Now</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search screenshots..."
          value={search.query}
          onChangeText={(text) => {
            search.search(text);
          }}
          onSubmitEditing={handleSearch}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.searchButton, search.loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={search.loading}
        >
          {search.loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={search.results}
        renderItem={renderResult}
        keyExtractor={(item) => item.screenshotId}
        style={styles.resultsList}
        contentContainerStyle={styles.resultsContent}
        ListEmptyComponent={
          !search.loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {search.query ? 'No results found' : 'Enter a search query'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  controlPanel: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#3498db',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#27ae60',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    color: '#000',
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  resultImage: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
  },
  resultContent: {
    flex: 1,
    padding: 12,
  },
  resultCaption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  resultSummary: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#2c3e50',
  },
  resultScore: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
