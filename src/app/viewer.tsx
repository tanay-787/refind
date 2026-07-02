import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { recognizeText } from 'rn-mlkit-ocr';
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
import { CropOverlay } from '@/ui/viewer/CropOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 } as const;
const MAX_SCALE = 5;
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.18;
const DISMISS_VELOCITY = 1200;

export default function ViewerScreen() {
  const { uri, jobId, width: imgWStr, height: imgHStr } = useLocalSearchParams<{ uri: string; jobId: string; width?: string; height?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isStatusBarHidden, setStatusBarHidden] = useState(false);
  const [isOcrMode, setIsOcrMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);

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

  // Crop Box state
  const boxX = useSharedValue((SCREEN_WIDTH - 280) / 2);
  const boxY = useSharedValue((SCREEN_HEIGHT - 280) / 2);
  const boxW = useSharedValue(280);
  const boxH = useSharedValue(280);

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

  const toggleOcrMode = useCallback(() => {
    if (!isOcrMode) {
      // Enter OCR mode: reset image transform
      scale.value = withSpring(1, SPRING);
      translateX.value = withSpring(0, SPRING);
      translateY.value = withSpring(0, SPRING);
      baseScale.value = 1;
      baseX.value = 0;
      baseY.value = 0;
      
      setIsOcrMode(true);
      chromeVisible.value = withTiming(0, { duration: 200 });
      setStatusBarHidden(true);
    } else {
      // Exit OCR mode
      setIsOcrMode(false);
      setExtractedText(null);
      chromeVisible.value = withTiming(1, { duration: 200 });
      setStatusBarHidden(false);
    }
  }, [isOcrMode]);

  const handleScan = useCallback(async () => {
    'worklet'
    if (!uri || !imgWStr || !imgHStr) {
      console.warn('[handleScan] Missing params:', { uri: !!uri, imgWStr, imgHStr });
      return;
    }
    setIsScanning(true);

    try {
      // PROBE PHYSICAL DIMENSIONS: React Native's Image.getSize often returns logical pixels (points).
      // ImageManipulator works on physical pixels. We must probe the file directly to get its true size.
      const meta = await ImageManipulator.manipulateAsync(uri, []);
      const physicalW = meta.width;
      const physicalH = meta.height;

      const imgAspect = physicalW / physicalH;
      const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;

      let renderW: number, renderH: number, offsetX = 0, offsetY = 0;

      if (imgAspect > screenAspect) {
        // Landscape image: fills full width, letterboxed top/bottom
        renderW = SCREEN_WIDTH;
        renderH = SCREEN_WIDTH / imgAspect;
        offsetY = (SCREEN_HEIGHT - renderH) / 2;
      } else {
        // Portrait image: fills full height, pillarboxed left/right
        renderH = SCREEN_HEIGHT;
        renderW = SCREEN_HEIGHT * imgAspect;
        offsetX = (SCREEN_WIDTH - renderW) / 2;
      }

      // How many physical pixels per 1 screen pixel
      const scaleRatio = physicalW / renderW;

      // Ensure exact integers for ImageManipulator, and clamp to image bounds
      const cropX = Math.round(Math.max(0, (boxX.value - offsetX) * scaleRatio));
      const cropY = Math.round(Math.max(0, (boxY.value - offsetY) * scaleRatio));
      let cropW = Math.round(Math.min(physicalW - cropX, boxW.value * scaleRatio));
      let cropH = Math.round(Math.min(physicalH - cropY, boxH.value * scaleRatio));

      // Failsafe if rounding pushes width/height slightly out of bounds
      if (cropX + cropW > physicalW) cropW = physicalW - cropX;
      if (cropY + cropH > physicalH) cropH = physicalH - cropY;

      console.log('[handleScan] Physical dimensions:', { physicalW, physicalH });
      console.log('[handleScan] Logical dims (from DB):', { imgWStr, imgHStr });
      console.log('[handleScan] Screen dimensions:', { SCREEN_WIDTH, SCREEN_HEIGHT });
      console.log('[handleScan] Rendered image rect:', { renderW, renderH, offsetX, offsetY });
      console.log('[handleScan] Box (screen coords):', { x: boxX.value, y: boxY.value, w: boxW.value, h: boxH.value });
      console.log('[handleScan] Crop (pixel coords):', { cropX, cropY, cropW, cropH, scaleRatio });

      if (cropW <= 0 || cropH <= 0) {
        setIsScanning(false);
        return;
      }

      // Scale the cropped region by 2x to give MLKit higher DPI for small fonts
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
          { resize: { width: cropW * 2 } }
        ],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
      );

      const ocrResult = await recognizeText(manipResult.uri, 'latin');
      setExtractedText(ocrResult?.text || 'No text found in selection.');
      
      await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });
    } catch (e) {
      console.error('Crop/OCR failed:', e);
      setExtractedText('Failed to extract text.');
    } finally {
      setIsScanning(false);
    }
  }, [uri, imgWStr, imgHStr]);

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

      <CropOverlay 
        isActive={isOcrMode} 
        boxX={boxX} 
        boxY={boxY} 
        boxW={boxW} 
        boxH={boxH} 
      />

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
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={toggleOcrMode}>
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

      {/* ─── OCR Mode Chrome ─── */}
      {isOcrMode && (
        <>
          <Animated.View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16), zIndex: 200 }]}>
            <TouchableOpacity onPress={toggleOcrMode} style={[styles.iconButton, { width: 80 }]}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Adjust Crop</Text>
            <View style={[styles.iconButton, { width: 80 }]} pointerEvents="none" />
          </Animated.View>
          
          <Animated.View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24), justifyContent: 'center', zIndex: 200 }]}>
             <TouchableOpacity 
               onPress={handleScan}
               disabled={isScanning}
               style={{ backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, opacity: isScanning ? 0.7 : 1 }}
             >
               <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
                 {isScanning ? 'Scanning...' : 'Scan Text'}
               </Text>
             </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* ─── OCR Extracted Text Panel ─── */}
      {extractedText && (
        <View style={[styles.textPanel, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.textPanelHeader}>
            <Text style={styles.textPanelTitle}>Extracted Text</Text>
            <TouchableOpacity onPress={() => setExtractedText(null)} style={styles.closeBtn}>
              <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={24} tintColor="#rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.textScrollView}>
            <Text selectable style={styles.extractedText}>{extractedText}</Text>
          </ScrollView>
        </View>
      )}
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
  textPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  textPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textPanelTitle: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 20,
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  textScrollView: {
    flex: 1,
  },
  extractedText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
  },
});
