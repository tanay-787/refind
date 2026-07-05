import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  useWindowDimensions,
  Animated,
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { usePermissionContext } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import { SearchIllustration, PrivacyIllustration } from '@/ui/illustrations';

const SLIDES = [
  {
    id: '1',
    Illustration: SearchIllustration,
    title: 'Never lose a screenshot',
    description: 'Refind creates a private, intelligent index of your screenshots so you can search them instantly.',
  },
  {
    id: '2',
    Illustration: PrivacyIllustration,
    title: '100% Private & Local',
    description: 'Your data never leaves your device. All processing happens locally for maximum privacy and offline access.',
  }
] as const;

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<ScrollView>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    }
  };

  async function handleContinue() {
    setLoading(true);
    try {
      await SecureStore.setItemAsync('has_seen_onboarding', 'true');
      router.replace('/home');
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    } finally {
      setLoading(false);
    }
  }

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ flex: 3 }}>
        <Animated.FlatList
          ref={slidesRef as any}
          data={SLIDES}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                <item.Illustration theme={theme} size={140} />
              </View>
              
              <Text style={[styles.title, { color: theme.onSurface }]}>
                {item.title}
              </Text>
              
              <Text style={[styles.description, { color: theme.onSurfaceVariant }]}>
                {item.description}
              </Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Paginator />
        
        <Pressable
          onPress={isLastSlide ? handleContinue : scrollToNext}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
              {isLastSlide ? 'Continue' : 'Next'}
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
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 32,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
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
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
