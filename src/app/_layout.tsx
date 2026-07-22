import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedHost } from '@/theme';
import {
  PermissionProvider,
  useJobJournalStore
} from '@/hooks';
import { useFonts, Newsreader_400Regular, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { setupNotificationChannel } from '@/core/jobjournal/utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    useJobJournalStore.getState().init();
    void setupNotificationChannel();
  }, []);

  /**
   * HACK: Aggressive Image Preloading Workaround
   * 
   * We render an invisible `<Image />` component while the native splash screen is 
   * still visible (during font loading). This forces the React Native bridge and 
   * the underlying native image loader (e.g. SDWebImage/Glide via expo-image) to 
   * immediately decode the image into GPU memory on the very first frame.
   * 
   * By the time the `OnboardingScreen` mounts, the native side already has the exact 
   * `require(...)` image mapped in memory, completely eliminating any cache-miss delay
   * or "flashes" where the UI text renders before the background image.
   */
  if (!fontsLoaded) {
    return (
      <Image 
        source={require('../../assets/images/onboarding-bg.jpg')} 
        style={{ width: 1, height: 1, opacity: 0 }} 
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedHost style={{ flex: 1 }} seedColor="#0057FF">
          <PermissionProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="home" />
              <Stack.Screen
                name="viewer"
                options={{
                  presentation: 'transparentModal',
                  animation: 'fade'
                }}
              />
            </Stack>
          </PermissionProvider>
        </ThemedHost>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

