import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usePermissionContext } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { Image } from 'expo-image';
import { ThemedHost, useBrandColors } from '@/theme';
import { Column, Box, RNHostView, Spacer, Text, Button, LoadingIndicator, ElevatedButton } from '@expo/ui/jetpack-compose';
import { 
  fillMaxSize, 
  fillMaxWidth, 
  background, 
  padding as paddingModifier, 
  weight,
  size
} from '@expo/ui/jetpack-compose/modifiers';
import { IconView } from '../IconView';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestPermissions } = usePermissionContext();
  const colors = useBrandColors();
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // We delay hiding the splash screen until the OnboardingScreen has fully mounted.
    // This prevents the user from seeing any intermediate routing states from index.tsx.
    SplashScreen.hideAsync();
  }, []);

  async function handleContinue() {
    if (loading) return;
    setLoading(true);
    try {
      const { media } = await requestPermissions();
      if (media) {
        await SecureStore.setItemAsync('has_seen_onboarding', 'true');
        router.replace('/home');
      }
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedHost style={{ flex: 1 }}>
      <Box modifiers={[fillMaxSize(), background(colors.background)]}>
        
        {/* Background Image */}
        <Box modifiers={[fillMaxSize()]}>
          <RNHostView matchContents={false}>
            {/* 
              Transition is set to 0 to bypass the default fade-in.
              The image is aggressively preloaded in _layout.tsx, ensuring an instant render.
            */}
            <Image 
              source={require('../../../assets/images/onboarding-bg.jpg')} 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              contentFit="cover"
              transition={0}
              onLoad={() => SplashScreen.hideAsync()}
            />
          </RNHostView>
        </Box>
        
        {/* Overlay to ensure text readability */}
        <Box modifiers={[fillMaxSize(), background('rgba(0, 0, 0, 0.7)')]} />

        {/* Content */}
        <Column 
          modifiers={[
            fillMaxSize(), 
            paddingModifier(32, insets.top + 60, 32, Math.max(insets.bottom + 12, 24))
          ]}
        >
          {/* Text Container centered vertically */}
          <Column modifiers={[weight(1)]} verticalArrangement="center">
            <Text 
              color="#FFFFFF" 
              style={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 56, letterSpacing: -1 }}
            >
              Refind.
            </Text>
            <Spacer modifiers={[size(0, 16)]} />
            <Text 
              color={colors.onSurface}
              style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 18, lineHeight: 28 }}
            >
              Refind meets you at that moment, the one where the memory is clear but the screenshot is buried, and it gives you back the thing you came for. Instantly.
            </Text>
          </Column>

          {/* Button at the bottom */}
          <Box modifiers={[fillMaxWidth()]}>
            <ElevatedButton
              onClick={handleContinue}
              enabled={!loading}
              colors={{ 
                containerColor: colors.background, 
                contentColor: colors.onBackground, 
                disabledContainerColor: colors.surfaceVariant 
              }}
              modifiers={[fillMaxWidth()]}
              contentPadding={{ top: 18, bottom: 18 }}
              
            >
              {loading ? (
                <LoadingIndicator color={colors.onSurface} modifiers={[size(32, 32)]} />
              ) : (
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, letterSpacing: 0.3 }}>
                  Get Started
                </Text>
              )}
            </ElevatedButton>
          </Box>
        </Column>
      </Box>
    </ThemedHost>
  );
}
