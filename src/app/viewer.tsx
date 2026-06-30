import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 } as const;
const MAX_SCALE = 5;
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.18;
const DISMISS_VELOCITY = 1200;

export default function ViewerScreen() {
  const { uri, jobId } = useLocalSearchParams<{ uri: string; jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isStatusBarHidden, setStatusBarHidden] = useState(false);

  // ─── Shared values ────────────────────────────────────────────────────────
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Chrome visibility (1 = visible, 0 = hidden)
  const chromeVisible = useSharedValue(1);

  // Committed values saved at gesture start
  const baseScale = useSharedValue(1);
  const baseX = useSharedValue(0);
  const baseY = useSharedValue(0);

  // ─── Reset & animate in when mounted ────────────────────────────────────
  useEffect(() => {
    backdropOpacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  // ─── JS-thread dismiss (safe to call from anywhere) ───────────────────────
  const dismiss = useCallback(() => {
    // Show status bar again before dismissing so the layout beneath doesn't jump aggressively
    setStatusBarHidden(false);
    backdropOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(router.back)();
    });
  }, [router]);

  // ─── Pinch ────────────────────────────────────────────────────────────────
  const pinch = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      baseScale.value = scale.value;
    })
    .onUpdate((e) => {
      'worklet';
      const next = baseScale.value * e.scale;
      scale.value = Math.min(Math.max(next, 0.5), MAX_SCALE);
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        baseScale.value = 1;
        baseX.value = 0;
        baseY.value = 0;
      } else {
        baseScale.value = scale.value;
      }
    });

  // ─── Pan ─────────────────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      'worklet';
      baseX.value = translateX.value;
      baseY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (scale.value <= 1.01) {
        // Swipe-to-dismiss mode: follow finger with X resistance
        translateY.value = e.translationY;
        translateX.value = e.translationX * 0.15;
      } else {
        // Bounded pan when zoomed
        const maxX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;
        translateX.value = Math.min(Math.max(baseX.value + e.translationX, -maxX), maxX);
        translateY.value = Math.min(Math.max(baseY.value + e.translationY, -maxY), maxY);
      }
    })
    .onEnd((e) => {
      'worklet';
      if (scale.value <= 1.01) {
        const shouldDismiss =
          Math.abs(translateY.value) > DISMISS_THRESHOLD ||
          Math.abs(e.velocityY) > DISMISS_VELOCITY;

        if (shouldDismiss) {
          const dir = translateY.value >= 0 ? 1 : -1;
          translateY.value = withTiming(dir * SCREEN_HEIGHT * 1.2, { duration: 220 });
          backdropOpacity.value = withTiming(0, { duration: 220 }, () => {
            runOnJS(dismiss)();
          });
        } else {
          translateX.value = withSpring(0, SPRING);
          translateY.value = withSpring(0, SPRING);
          baseX.value = 0;
          baseY.value = 0;
        }
      } else {
        baseX.value = translateX.value;
        baseY.value = translateY.value;
      }
    });

  // ─── Double-tap ───────────────────────────────────────────────────────────
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e) => {
      'worklet';
      if (scale.value > 1) {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        baseScale.value = 1;
        baseX.value = 0;
        baseY.value = 0;
      } else {
        const target = 2.5;
        const offsetX = -(e.x - SCREEN_WIDTH / 2) * (target - 1);
        const offsetY = -(e.y - SCREEN_HEIGHT / 2) * (target - 1);
        scale.value = withSpring(target, SPRING);
        translateX.value = withSpring(offsetX, SPRING);
        translateY.value = withSpring(offsetY, SPRING);
        baseScale.value = target;
        baseX.value = offsetX;
        baseY.value = offsetY;
      }
    });

  // ─── Single-tap (Toggle Chrome) ───────────────────────────────────────────
  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      'worklet';
      if (chromeVisible.value === 1) {
        chromeVisible.value = withTiming(0, { duration: 200 });
        runOnJS(setStatusBarHidden)(true);
      } else {
        chromeVisible.value = withTiming(1, { duration: 200 });
        runOnJS(setStatusBarHidden)(false);
      }
    });

  // ─── Compose Gestures ─────────────────────────────────────────────────────
  // Exclusive ensures singleTap only fires if doubleTap FAILS.
  const taps = Gesture.Exclusive(doubleTap, singleTap);
  const composed = Gesture.Simultaneous(pinch, pan, taps);

  // ─── Animated styles ──────────────────────────────────────────────────────
  const backdropStyle = useAnimatedStyle(() => {
    const dragRatio = scale.value <= 1.01
      ? Math.abs(translateY.value) / (SCREEN_HEIGHT * 0.5)
      : 0;
    return {
      opacity: backdropOpacity.value * Math.max(0.15, 1 - dragRatio),
    };
  });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: chromeVisible.value,
    transform: [
      {
        translateY: withTiming(chromeVisible.value === 1 ? 0 : -20, { duration: 200 })
      }
    ]
  }));

  const bottomChromeStyle = useAnimatedStyle(() => ({
    opacity: chromeVisible.value,
    transform: [
      {
        translateY: withTiming(chromeVisible.value === 1 ? 0 : 20, { duration: 200 })
      }
    ]
  }));

  if (!uri) return null;

  return (
    <View style={styles.root}>
      <StatusBar hidden={isStatusBarHidden} />

      {/* Scrim */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* Gesture surface & Image */}
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.imageContainer, imageStyle]}>
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            transition={0}
          />
        </Animated.View>
      </GestureDetector>

      {/* ─── Top Overlay Chrome ─── */}
      <Animated.View 
        style={[styles.topBar, chromeStyle, { paddingTop: Math.max(insets.top, 16) }]}
        pointerEvents={isStatusBarHidden ? 'none' : 'box-none'}
      >
        <TouchableOpacity
          onPress={dismiss}
          style={styles.iconButton}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back' }} size={28} tintColor="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Refind</Text>
        
        {/* Invisible spacer to perfectly center the title */}
        <View style={styles.iconButton} pointerEvents="none" />
      </Animated.View>

      <Animated.View 
        style={[styles.bottomBar, bottomChromeStyle, { paddingBottom: Math.max(insets.bottom, 24) }]}
        pointerEvents={isStatusBarHidden ? 'none' : 'box-none'}
      >
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <SymbolView name={{ ios: 'text.viewfinder', android: 'text_fields' }} size={24} tintColor="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share' }} size={24} tintColor="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <SymbolView name={{ ios: 'info.circle', android: 'info' }} size={24} tintColor="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <SymbolView name={{ ios: 'trash', android: 'delete' }} size={24} tintColor="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  imageContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  // ─── Chrome Styles ───
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.3,
  },
});
