import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { usePermissionContext } from '@/hooks';
import * as SecureStore from 'expo-secure-store';
import { 
  initializeJobJournalDatabase, 
  registerJobJournalBackgroundTask, 
  scheduleJobJournalBackgroundTask 
} from '@/core/jobjournal';
import { useBrandColors } from '@/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { hasMediaPermission, isChecking } = usePermissionContext();
  const colors = useBrandColors();

  useEffect(() => {
    if (isChecking || hasMediaPermission === null) return;

    (async () => {
      try {
        // Always initialize SQLite database (safe, local sandboxed storage)
        await initializeJobJournalDatabase();
        
        const hasSeenOnboarding = await SecureStore.getItemAsync('has_seen_onboarding');

        if (hasMediaPermission) {
          // If permission is already granted, set up background tasks and go to home
          await registerJobJournalBackgroundTask();
          await scheduleJobJournalBackgroundTask();
          router.replace('/home');
        } else if (hasSeenOnboarding === 'true') {
          // If onboarding is done but no permission, go to home to show the EmptyState prompt
          router.replace('/home');
        } else {
          // Otherwise, redirect to the onboarding stack screen
          router.replace('/onboarding');
        }
      } catch (err) {
        console.error('[IndexScreen] Failed to initialize:', err);
      }
    })();
  }, [hasMediaPermission, isChecking, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
