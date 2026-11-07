import React, { useState, useEffect, useCallback } from 'react';
import { 
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';

import { useSearch, useJobJournalStore, usePermissionContext } from '@/hooks';
import { useThemeColors } from '@/theme';
import { 
  registerJobJournalBackgroundTask, 
  scheduleJobJournalBackgroundTask 
} from '@/core/jobjournal';
import { 
  Header, 
  SearchBar, 
  ResultsList, 
  NoResultsState,
  GrantPermissionScreen,
  IdleDashboard,
  AboutCommunitySheet,
} from '@/ui/home';
import { NotificationPromptDialog } from '@/ui/NotificationPromptDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2; 
const SPACING = 12;
const ITEM_SIZE = (SCREEN_WIDTH - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [query, setQuery] = useState('');
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      SystemBars.setHidden({ statusBar: false, navigationBar: true });
    }, [])
  );

  const { results, search, loading } = useSearch();
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [prevLoading, setPrevLoading] = useState(loading);

  if (prevLoading !== loading) {
    setPrevLoading(loading);
    if (!loading) {
      setDelayedLoading(false);
    }
  }

  const sync = useJobJournalStore(state => state.sync);
  const { hasMediaPermission, hasNotificationPermission, requestPermissions } = usePermissionContext();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  useEffect(() => {
    // Hide splash screen only when this screen mounts
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setDelayedLoading(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [loading]);

  // Trigger search on query change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, search]);

  // Sync screenshots on mount (only when permission is granted)
  useEffect(() => {
    if (hasMediaPermission) {
      sync().then(async (result) => {
        // Only prompt for notifications if we got new jobs AND permission isn't already granted
        if (result && result.createdJobs > 0 && !hasNotificationPermission) {
          const hasSeenPrompt = await SecureStore.getItemAsync('has_seen_notif_prompt');
          if (hasSeenPrompt !== 'true') {
            setShowNotifPrompt(true);
          }
        }
      }).catch((err) => console.error('Error during background sync on home mount:', err));
    }
  }, [sync, hasMediaPermission, hasNotificationPermission]);

  const showToast = useCallback((msg: string) => {
    setSnackbarMessage(msg);
    setTimeout(() => {
      setSnackbarMessage(null);
    }, 3500);
  }, []);

  const handleGrantPermission = async () => {
    const { media } = await requestPermissions();
    if (media === 'granted') {
      await registerJobJournalBackgroundTask();
      await scheduleJobJournalBackgroundTask();
      sync();
    } else if (media === 'denied') {
      showToast('Refind requires "Allow All" access to search your library');
    }
  };

  // Permission gate: render permission screen until the user grants full access
  if (!hasMediaPermission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surface }]}>
        <GrantPermissionScreen
          onGrantPermission={handleGrantPermission}
        />
        {snackbarMessage && (
          <View 
            style={[
              styles.snackbar, 
              { 
                backgroundColor: colors.inverseSurface,
                bottom: insets.bottom + 16,
              }
            ]}
          >
            <Text style={[styles.snackbarText, { color: colors.inverseOnSurface }]}>
              {snackbarMessage}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SystemBars 
        style={colorScheme === 'dark' ? 'light' : 'dark'} 
        hidden={{ statusBar: false, navigationBar: true }} 
      />
      
      <Header 
        insets={insets} 
        onOpenAbout={() => setShowAbout(true)}
      />
      
      <SearchBar 
        onQueryChange={setQuery} 
      />

      <View style={styles.mainContainer}>
        {query ? (
          // ACTIVE SEARCH BRANCH
          delayedLoading ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : results.length > 0 ? (
            <ResultsList 
              results={results}
              itemSize={ITEM_SIZE}
              spacing={SPACING}
              columnCount={COLUMN_COUNT}
            />
          ) : (
            <View style={styles.centeredContainer}>
              <NoResultsState 
                query={query} 
                onSuggestionTap={(suggestion) => {
                  setQuery(suggestion);
                  search(suggestion);
                }} 
              />
            </View>
          )
        ) : (
          // IDLE DASHBOARD BRANCH
          <IdleDashboard 
            recentItems={results}
            itemSize={ITEM_SIZE}
            spacing={SPACING}
            columnCount={COLUMN_COUNT}
          />
        )}
      </View>
      
      <NotificationPromptDialog 
        visible={showNotifPrompt} 
        onDismiss={() => setShowNotifPrompt(false)} 
      />

      <AboutCommunitySheet
        visible={showAbout}
        onDismiss={() => setShowAbout(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackbar: {
    position: 'absolute',
    left: 24,
    right: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  snackbarText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
});
