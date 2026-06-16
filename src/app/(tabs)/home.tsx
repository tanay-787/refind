import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Keyboard,
  Dimensions,
  Pressable,
  FlatList,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Host, Text } from '@expo/ui'; 
import { Column, Row, Box, DockedSearchBar, RNHostView, Icon } from '@expo/ui/jetpack-compose';
import { 
  fillMaxSize, 
  fillMaxWidth, 
  paddingAll, 
  padding as paddingModifier, 
  size, 
  background, 
  clip, 
  Shapes,
  border,
} from '@expo/ui/jetpack-compose/modifiers';
import { Image } from 'expo-image';
import { useSearch, useJobJournalStats, useJobJournalOperations } from '@/hooks';
import { useTheme } from '@/theme';
import { SymbolView } from 'expo-symbols';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2; 
const SPACING = 12;
const ITEM_SIZE = (SCREEN_WIDTH - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;


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
        Keyboard.dismiss();
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, search]);

  useEffect(() => {
    sync();
  }, []);

  const isIndexing = pending > 0 || running > 0;

  const renderItem = useCallback(({ item }: { item: any }) => (
    <RenderItem item={item} surfaceVariant={theme.surfaceVariant} />
  ), [theme.surfaceVariant]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_SIZE + SPACING,
    offset: (ITEM_SIZE + SPACING) * Math.floor(index / COLUMN_COUNT),
    index,
  }), []);

  return (
    <Host style={{ flex: 1, backgroundColor: theme.background }}>
      <Column modifiers={[fillMaxSize()]}>
        {/* Top Header */}
        <Column modifiers={[fillMaxWidth(), paddingModifier(16, 32, 8, 16)]}>
          <Text 
            textStyle={{ 
              color: theme.onSurface, 
              fontSize: 32, 
              fontWeight: 'bold',
              letterSpacing: -0.5
            }}
          >
            Stitch
          </Text>
          <Text 
            textStyle={{ 
              color: theme.onSurfaceVariant, 
              fontSize: 14 
            }}
          >
            Search everything you've seen
          </Text>
        </Column>
        
        {/* Search Bar Container */}
        <Box modifiers={[fillMaxWidth(), paddingModifier(16, 16, 16, 16)]}>
          <DockedSearchBar onQueryChange={setQuery}>
            <DockedSearchBar.LeadingIcon>
              <RNHostView matchContents={true}>
                <SymbolView 
                  name={{ android: 'search' }} 
                  size={24} 
                  tintColor={theme.onSurfaceVariant} 
                />
              </RNHostView>
            </DockedSearchBar.LeadingIcon>
            <DockedSearchBar.Placeholder>
              <Text textStyle={{ color: theme.onSurfaceVariant }}>Search screenshots...</Text>
            </DockedSearchBar.Placeholder>
          </DockedSearchBar>
        </Box>

        {/* Results / Content */}
        <Box modifiers={[fillMaxSize()]}>
          {results.length > 0 ? (
            <RNHostView matchContents={false}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.jobId}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={{ padding: SPACING, paddingBottom: 100 }}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
              />
            </RNHostView>
          ) : (
            <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
              {query && !loading ? (
                 <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
                    <RNHostView matchContents>
                    <SymbolView 
                      name={{ android: 'search'}} 
                      size={48} 
                      tintColor={theme.outline} 
                    />
                    </RNHostView>
                    <Text textStyle={{ color: theme.onSurface, fontSize: 18, fontWeight: '600' }}>No results</Text>
                    <Text textStyle={{ color: theme.onSurfaceVariant, textAlign: 'center' }}>
                        Try searching for something else
                    </Text>
                 </Column>
              ) : (
                <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 24 }} modifiers={[paddingModifier(0, 32, 0, 32)]}>
                  <Box modifiers={[size(120, 120), background(theme.secondaryContainer), clip(Shapes.RoundedCorner(28))]}>
                     <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
                        <RNHostView matchContents={true}>
                        <SymbolView
                          name={{android: 'star'}}  
                          size={40} 
                          tintColor={theme.onSecondaryContainer} 
                        />
                        </RNHostView>
                     </Column>
                  </Box>
                  <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
                    <Text textStyle={{ color: theme.onSurface, fontSize: 20, fontWeight: '600', textAlign: 'center' }}>
                        Your visual memory, searchable
                    </Text>
                    <Text textStyle={{ color: theme.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
                        Search for "receipts", "travel", or text inside any screenshot.
                    </Text>
                  </Column>
                </Column>
              )}
            </Column>
          )}
        </Box>
      </Column>
    </Host>
  );
}

const RenderItem = memo(({ item, surfaceVariant }: { item: any, surfaceVariant: string }) => (
  <Pressable style={styles.itemContainer}>
    <View style={[styles.imageWrapper, { backgroundColor: surfaceVariant }]}>
      <Image
        source={{ uri: item.uri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </View>
  </Pressable>
));

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    padding: 4,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    borderRadius: 20,
  },
});

