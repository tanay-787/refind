import React, { useState, useEffect } from 'react';
import { 
  Keyboard,
  Dimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

import { Column, Box, Surface, SnackbarHost, type SnackbarHostRef, LoadingIndicator, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxSize, align, padding as paddingModifier, size } from '@expo/ui/jetpack-compose/modifiers';
import { useSearch, useJobJournalStore, usePermissionContext } from '@/hooks';
import { ThemedHost } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { 
  registerJobJournalBackgroundTask, 
  scheduleJobJournalBackgroundTask 
} from '@/core/jobjournal';
import { 
  Header, 
  SearchBar, 
  ResultsList, 
  WelcomeState, 
  NoResultsState,
  GrantPermissionScreen,
  IdleDashboard,
} from '@/ui/home';
import { NotificationPromptDialog } from '@/ui/NotificationPromptDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2; 
const SPACING = 12;
const ITEM_SIZE = (SCREEN_WIDTH - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const { results, search, loading } = useSearch();

  const sync = useJobJournalStore(state => state.sync);
  const { hasMediaPermission, hasNotificationPermission, requestPermissions } = usePermissionContext();
  const snackbarRef = React.useRef<SnackbarHostRef>(null);
  const insets = useSafeAreaInsets();
  const colors = useMaterialColors();

  useEffect(() => {
    // Hide splash screen only when this screen mounts
    SplashScreen.hideAsync();
  }, []);

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
      }).catch((err) => console.error("Error during background sync on home mount:", err));
    }
  }, [sync, hasMediaPermission, hasNotificationPermission]);

  const handleGrantPermission = async () => {
    const { media } = await requestPermissions();
    if (media) {
      await registerJobJournalBackgroundTask();
      await scheduleJobJournalBackgroundTask();
      sync();
    } else {
      snackbarRef.current?.showSnackbar({
        message: 'Refind requires "Allow All" access to search your library',
        duration: 'short',
      });
    }
  };

  // Permission gate: render nothing else until the user grants full access.
  if (!hasMediaPermission) {
    return (
      <ThemedHost style={{ flex: 1 }}>
        <Box modifiers={[fillMaxSize()]}>
          <GrantPermissionScreen
            onGrantPermission={handleGrantPermission}
          />
          <SnackbarHost 
            ref={snackbarRef} 
            modifiers={[align('topCenter'), paddingModifier(16, 0, 16, Math.max(insets.bottom, 16) + 16)]} 
          />
        </Box>
      </ThemedHost>
    );
  }

  return (
    <ThemedHost style={{ flex: 1 }}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column modifiers={[fillMaxSize()]}>
        <Header insets={insets} />
        
        <SearchBar 
          onQueryChange={setQuery} 
        />

        <Box modifiers={[fillMaxSize()]}>
          {query ? (
            // ACTIVE SEARCH BRANCH
            loading ? (
              <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
                <LoadingIndicator color={colors.primary} modifiers={[size(40, 40)]} />
              </Column>
            ) : results.length > 0 ? (
              <ResultsList 
                results={results}
                itemSize={ITEM_SIZE}
                spacing={SPACING}
                columnCount={COLUMN_COUNT}
              />
            ) : (
              <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
                <NoResultsState />
              </Column>
            )
          ) : (
            // IDLE DASHBOARD BRANCH (The Catch-all)
            <IdleDashboard 
              recentItems={results}
              itemSize={ITEM_SIZE}
              spacing={SPACING}
              columnCount={COLUMN_COUNT}
            />
          )}
        </Box>
        </Column>
      </Surface>
      
      <NotificationPromptDialog 
        visible={showNotifPrompt} 
        onDismiss={() => setShowNotifPrompt(false)} 
      />
    </ThemedHost>
  );
}
