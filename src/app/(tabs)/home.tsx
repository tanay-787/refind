import React, { useState, useEffect } from 'react';
import { 
  Keyboard,
  Dimensions,
  Pressable,
  FlatList,
} from 'react-native';
import { Host, Text } from '@expo/ui'; 
import { Column, Row, Box, DockedSearchBar, RNHostView } from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, paddingAll, padding, size, background } from '@expo/ui/jetpack-compose/modifiers';
import { Image } from 'expo-image';
import { useSearch, useJobJournalStats, useJobJournalOperations } from '@/hooks';
import { useTheme } from '@/theme';
import { View } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const { results, search, loading } = useSearch();
  const theme = useTheme();
  const { pending, running } = useJobJournalStats();
  const { sync, isSyncing } = useJobJournalOperations();

  // Trigger search on query change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query) {
        search(query);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, search]);

  useEffect(() => {
    sync();
  }, []);

  const isIndexing = pending > 0 || running > 0;

  return (
    <Host style={{ flex: 1, backgroundColor: theme.background }}>
      <Column modifiers={[fillMaxSize(), paddingAll(20)]}>
        <Text modifiers={[ padding(0,20,0,0)]} textStyle={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>SS-Search</Text>
        
        <Box modifiers={[padding(0, 16, 0, 0)]}>
            <DockedSearchBar onQueryChange={setQuery}>
                <DockedSearchBar.Placeholder>
                    <Text textStyle={{ color: theme.outline }}>Search your screenshots...</Text>
                </DockedSearchBar.Placeholder>
            </DockedSearchBar>
        </Box>

        <Box modifiers={[fillMaxSize(), padding(0, 20, 0, 0)]}>
          {results.length > 0 ? (
            <RNHostView matchContents={true}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.jobId}
                numColumns={COLUMN_COUNT}
                renderItem={({ item }) => (
                  <Pressable>
                    <View style={{ width: ITEM_SIZE, height: ITEM_SIZE, padding: 1 }}>
                      <Image
                        source={{ uri: item.uri }}
                        style={{ flex: 1 }}
                        contentFit="cover"
                        transition={200}
                      />
                    </View>
                  </Pressable>
                )}
              />
            </RNHostView>
          ) : (
            <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
              <Text textStyle={{ color: theme.outline }}>
                {query && !loading ? `No results found for "${query}"` : "Find anything you've seen."}
              </Text>
            </Column>
          )}
        </Box>

        {(isIndexing || isSyncing) && (
          <Row modifiers={[fillMaxWidth(), paddingAll(12), background(theme.surface)]} verticalAlignment="center">
            <Text textStyle={{ color: theme.text }}>
              {isSyncing ? 'Syncing library...' : `Indexing ${pending + running} screens...`}
            </Text>
          </Row>
        )}
      </Column>
    </Host>
  );
}
