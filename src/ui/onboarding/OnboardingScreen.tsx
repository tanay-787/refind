import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePermissionContext } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { Image } from 'expo-image';
import { Button, Spinner } from 'heroui-native';
import { useThemeColors } from '@/theme';
import { SystemBars } from 'react-native-edge-to-edge';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestPermissions } = usePermissionContext();
  const colors = useThemeColors({ colorScheme: 'dark' });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Delay hiding the splash screen until OnboardingScreen has fully mounted.
    SplashScreen.hideAsync();
  }, []);

  async function handleContinue() {
    if (loading) return;
    setLoading(true);
    let navigatingAway = false;
    try {
      await requestPermissions();
      
      await SecureStore.setItemAsync('has_seen_onboarding', 'true');
      navigatingAway = true;
      router.replace('/home');
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    } finally {
      if (!navigatingAway) {
        setLoading(false);
      }
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SystemBars style="light" />
      
      {/* Background Image */}
      <Image 
        source={require('../../../assets/images/onboarding-bg.jpg')} 
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={0}
        onLoad={() => SplashScreen.hideAsync()}
      />
      
      {/* Overlay for text readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />

      {/* Content */}
      <View 
        style={[
          styles.container,
          {
            paddingTop: insets.top + 60,
            paddingBottom: Math.max(insets.bottom + 12, 24),
          }
        ]}
      >
        {/* Text Container centered vertically */}
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.title,
              { color: colors.onSurface }
            ]}
          >
            Refind.
          </Text>
          <Text 
            style={[
              styles.body,
              { color: colors.onSurfaceVariant }
            ]}
          >
            Refind meets you at that moment, the one where the memory is clear but the screenshot is buried, and it gives you back the thing you came for. Instantly.
          </Text>
        </View>

        {/* Action Button at the bottom */}
        <View style={styles.actionContainer}>
          <Button
            size="lg"
            variant="primary"
            onPress={handleContinue}
            isDisabled={loading}
            className="w-full rounded-full py-4"
          >
            {loading ? (
              <Spinner size="sm" color="default" />
            ) : (
              <Button.Label style={styles.buttonText}>
                Get Started
              </Button.Label>
            )}
          </Button>
          <Text 
            style={[
              styles.hint,
              { color: colors.outline }
            ]}
          >
            You&apos;ll be asked to allow photo access next
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 56,
    letterSpacing: -1,
  },
  body: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 18,
    lineHeight: 28,
    marginTop: 16,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
