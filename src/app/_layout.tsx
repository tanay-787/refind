import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Host } from '@expo/ui'; // Added Host
import { JobJournalProvider } from '@/hooks';
import { ThemeProvider } from '@/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Host style={{ flex: 1}} colorScheme={colorScheme}>
          <JobJournalProvider>
            <ThemeProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="home" />
              </Stack>
            </ThemeProvider>
          </JobJournalProvider>
        </Host>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

