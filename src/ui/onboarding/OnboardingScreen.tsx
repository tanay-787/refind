import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePermissionContext } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'expo-image';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestPermissions } = usePermissionContext();
  
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (loading) return;
    setLoading(true);
    try {
      // Step 1: Request Permissions (orchestrated via context)
      const { media } = await requestPermissions();
      
      if (media) {
        // Step 2: Complete onboarding
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
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/images/onboarding-bg.jpg')} 
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      
      {/* Overlay to ensure text readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Refind.</Text>
          <Text style={[styles.description, { marginTop: 16 }]}>
            Refind meets you at that moment, the one where the memory is clear but the file is buried, and it gives you back the thing you came for. Instantly.
          </Text>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: '#FFFFFF' },
            pressed && { opacity: 0.8 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={[styles.buttonText, { color: '#000000' }]}>
              Get Started
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },

  description: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
