import { useRouter } from 'expo-router';
import { Card } from 'heroui-native/card';
import { Spinner } from 'heroui-native/spinner';
import { Text } from 'heroui-native/text';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { initializeJobJournalDatabase, initModelMonitor, registerJobJournalBackgroundTask, scheduleJobJournalBackgroundTask } from '@/features/jobjournal';
import { unregisterBackgroundTasks } from '@/features/pipeline/backgroundTasks';

export default function IndexScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    (async () => {
      try {
        await initializeJobJournalDatabase();
        await unregisterBackgroundTasks();
        await registerJobJournalBackgroundTask();
        await scheduleJobJournalBackgroundTask();
        initModelMonitor();
        router.replace('/(tabs)/home')

      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Failed to initialize app');
      }
    })();

    return () => {
    };
  }, [router]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.body}>
          <Card className='w-full'>
            <View style={styles.content}>
              {error ? (
                <>
                  <Text style={styles.errorTitle}>Initialization failed</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </>
              ) : (
                <>
                  <Spinner />
                  <Text style={styles.title}>Preparing your library</Text>
                  <Text style={styles.subtitle}>Loading screens, search data, and background tasks.</Text>
                </>
              )}
            </View>
          </Card>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
  },
  content: {
    alignItems: 'center' as const,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  subtitle: {
    textAlign: 'center' as const,
    opacity: 0.7,
  },
  errorTitle: {
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  errorText: {
    textAlign: 'center' as const,
    opacity: 0.8,
  },
};
