import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Dimensions,
  View,
  BackHandler,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { recognizeText } from 'rn-mlkit-ocr';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CropOverlay } from '@/ui/viewer/CropOverlay';
import { ViewerTopBar } from '@/ui/viewer/TopBar';
import { ViewerBottomBar } from '@/ui/viewer/BottomBar';
import { ViewerOcrChrome } from '@/ui/viewer/OcrChrome';
import { ViewerOcrResultPanel } from '@/ui/viewer/OcrResultPanel';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 } as const;
const MAX_SCALE = 5;
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.18;
const DISMISS_VELOCITY = 1200;

export default function ViewerScreen() {
  const { uri, width: imgWStr, height: imgHStr } = useLocalSearchParams<{ uri: string; jobId?: string; width?: string; height?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isSystemBarHidden, setSystemBarHidden] = useState(false);
  const [isOcrMode, setIsOcrMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  // Probed or param image dimensions
  const paramW = Number(imgWStr);
  const paramH = Number(imgHStr);
  const [imgDims, setImgDims] = useState<{ width: number; height: number }>(() => {
    if (paramW > 0 && paramH > 0) return { width: paramW, height: paramH };
    return { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
  });

  useEffect(() => {
    if (!uri) return;
    ImageManipulator.manipulateAsync(uri, [])
      .then((meta) => {
        if (meta.width > 0 && meta.height > 0) {
          setImgDims((prev) => {
            if (prev.width === meta.width && prev.height === meta.height) return prev;
            return { width: meta.width, height: meta.height };
          });
        }
      })
      .catch(() => {});
  }, [uri]);

  // Compute safe viewport geometry for OCR mode
  const geo = useMemo(() => {
    const imgAspect = imgDims.width / imgDims.height;
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    // Resting full-screen contained dimensions
    let fullW: number;
    let fullH: number;
    if (imgAspect <= screenAspect) {
      fullH = SCREEN_HEIGHT;
      fullW = SCREEN_HEIGHT * imgAspect;
    } else {
      fullW = SCREEN_WIDTH;
      fullH = SCREEN_WIDTH / imgAspect;
    }

    // Safe viewport bounded between top and bottom chrome bars with 16px margins
    const TOP_CHROME = Math.max(insets.top, 16) + 60;
    const BOTTOM_CHROME = Math.max(insets.bottom, 24) + 64;
    const PADDING = 16;

    const safeAreaTop = TOP_CHROME + PADDING;
    const safeAreaBottom = SCREEN_HEIGHT - (BOTTOM_CHROME + PADDING);
    const safeAreaLeft = PADDING;
    const safeAreaRight = SCREEN_WIDTH - PADDING;

    const safeAreaWidth = safeAreaRight - safeAreaLeft;
    const safeAreaHeight = safeAreaBottom - safeAreaTop;
    const safeAspect = safeAreaWidth / safeAreaHeight;

    let ocrW: number;
    let ocrH: number;
    let ocrX: number;
    let ocrY: number;

    if (imgAspect <= safeAspect) {
      ocrH = safeAreaHeight;
      ocrW = safeAreaHeight * imgAspect;
      ocrX = safeAreaLeft + (safeAreaWidth - ocrW) / 2;
      ocrY = safeAreaTop;
    } else {
      ocrW = safeAreaWidth;
      ocrH = safeAreaWidth / imgAspect;
      ocrX = safeAreaLeft;
      ocrY = safeAreaTop + (safeAreaHeight - ocrH) / 2;
    }

    const targetScale = ocrH / fullH;
    const ocrCenterY = ocrY + ocrH / 2;
    const targetTranslateY = ocrCenterY - SCREEN_HEIGHT / 2;

    return {
      fullW,
      fullH,
      ocrW,
      ocrH,
      ocrX,
      ocrY,
      targetScale,
      targetTranslateY,
    };
  }, [imgDims.width, imgDims.height, insets.top, insets.bottom]);

  const ocrBounds = useMemo(() => ({
    minX: geo.ocrX,
    minY: geo.ocrY,
    maxX: geo.ocrX + geo.ocrW,
    maxY: geo.ocrY + geo.ocrH,
  }), [geo]);

  // ─── Shared values ────────────────────────────────────────────────────────
  const backdropOpacity = useSharedValue(1);
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

  const isDismissingRef = useRef(false);

  // Ensure system bars are restored when viewer unmounts
  useEffect(() => {
    return () => {
      SystemBars.setHidden({ statusBar: false, navigationBar: true });
    };
  }, []);

  // Direct navigation back, bypassing Reanimated callbacks to prevent freeze bugs
  const navigateBack = useCallback((delayMs?: number) => {
    SystemBars.setHidden({ statusBar: false, navigationBar: true });
    if (typeof delayMs === 'number' && delayMs > 0) {
      setTimeout(() => {
        setSystemBarHidden(false);
        router.back();
      }, delayMs);
    } else {
      setSystemBarHidden(false);
      router.back();
    }
  }, [router]);

  // Dedicated callback for pan dismissal to avoid worklet argument dropping
  const navigateBackPanDismiss = useCallback(() => {
    navigateBack(220);
  }, [navigateBack]);

  // Programmatic dismiss with backdrop fade-out, chrome fade-out, and subtle scale-down
  const dismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    setSystemBarHidden(false);
    SystemBars.setHidden({ statusBar: false, navigationBar: true });
    scale.value = withTiming(0.92, { duration: 180 });
    backdropOpacity.value = withTiming(0, { duration: 180 });
    chromeVisible.value = withTiming(0, { duration: 180 });
    navigateBack(180);
  }, [navigateBack, backdropOpacity, chromeVisible, scale]);

  const toggleOcrMode = useCallback(() => {
    if (!isOcrMode) {
      // Enter OCR mode: cleanly transition image into safe framed viewport
      scale.value = withTiming(geo.targetScale, { duration: 240 });
      translateX.value = withTiming(0, { duration: 240 });
      translateY.value = withTiming(geo.targetTranslateY, { duration: 240 });
      baseScale.value = geo.targetScale;
      baseX.value = 0;
      baseY.value = geo.targetTranslateY;
      
      // Initialize crop box comfortably inside the safe OCR image bounds
      const initW = Math.round(geo.ocrW * 0.85);
      const initH = Math.round(Math.min(geo.ocrH * 0.45, 240));
      boxX.value = Math.round(geo.ocrX + (geo.ocrW - initW) / 2);
      boxY.value = Math.round(geo.ocrY + (geo.ocrH - initH) / 2);
      boxW.value = initW;
      boxH.value = initH;

      setIsOcrMode(true);
      chromeVisible.value = withTiming(0, { duration: 180 });
      setSystemBarHidden(true);
    } else {
      // Exit OCR mode: cleanly return image to full screen
      scale.value = withTiming(1, { duration: 240 });
      translateX.value = withTiming(0, { duration: 240 });
      translateY.value = withTiming(0, { duration: 240 });
      baseScale.value = 1;
      baseX.value = 0;
      baseY.value = 0;

      setIsOcrMode(false);
      setExtractedText(null);
      chromeVisible.value = withTiming(1, { duration: 180 });
      setSystemBarHidden(false);
    }
  }, [isOcrMode, geo, baseScale, baseX, baseY, boxH, boxW, boxX, boxY, chromeVisible, scale, translateX, translateY]);

  // Handle hardware / system back navigation
  useEffect(() => {
    const onBackPress = () => {
      if (extractedText) {
        setExtractedText(null);
        return true;
      }
      if (isOcrMode) {
        toggleOcrMode();
        return true;
      }
      dismiss();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [extractedText, isOcrMode, toggleOcrMode, dismiss]);

  const handleScan = useCallback(async () => {
    if (!uri) return;
    setIsScanning(true);

    try {
      const meta = await ImageManipulator.manipulateAsync(uri, []);
      const physicalW = meta.width;
      const physicalH = meta.height;

      // Scale ratio between physical pixels and OCR screen pixels
      const scaleRatio = physicalW / geo.ocrW;

      // Map box relative to OCR rectangle origin (geo.ocrX, geo.ocrY)
      const cropX = Math.round(Math.max(0, (boxX.value - geo.ocrX) * scaleRatio));
      const cropY = Math.round(Math.max(0, (boxY.value - geo.ocrY) * scaleRatio));
      let cropW = Math.round(Math.min(physicalW - cropX, boxW.value * scaleRatio));
      let cropH = Math.round(Math.min(physicalH - cropY, boxH.value * scaleRatio));

      // Clamping failsafe
      if (cropX + cropW > physicalW) cropW = physicalW - cropX;
      if (cropY + cropH > physicalH) cropH = physicalH - cropY;

      if (cropW <= 0 || cropH <= 0) {
        setIsScanning(false);
        return;
      }

      // Scale cropped region 2x for high OCR precision in MLKit
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
          { resize: { width: cropW * 2 } },
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
  }, [uri, geo, boxX, boxY, boxW, boxH]);

  const handleShare = useCallback(async () => {
    if (!uri || isSharing) return;
    setIsSharing(true);
    let tempShareUri: string | null = null;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Sharing is not available on this device');
        return;
      }

      let shareTargetUri = uri;
      if (!shareTargetUri.startsWith('file://')) {
        const dest = `${FileSystem.cacheDirectory}share_${Date.now()}.jpg`;
        await FileSystem.copyAsync({
          from: shareTargetUri,
          to: dest,
        });
        tempShareUri = dest;
        shareTargetUri = dest;
      }

      await Sharing.shareAsync(shareTargetUri);
    } catch (e) {
      console.error('Failed to share:', e);
    } finally {
      setIsSharing(false);
      if (tempShareUri) {
        try {
          await FileSystem.deleteAsync(tempShareUri, { idempotent: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [uri, isSharing]);

  // ─── Pinch ────────────────────────────────────────────────────────────────
  const pinch = useMemo(() => Gesture.Pinch()
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
    }), [baseScale, scale, translateX, translateY, baseX, baseY]);

  // ─── Pan ─────────────────────────────────────────────────────────────────
  const pan = useMemo(() => Gesture.Pan()
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
          (Math.abs(e.velocityY) > DISMISS_VELOCITY && Math.abs(e.translationY) > 20);

        if (shouldDismiss) {
          const dir = translateY.value >= 0 ? 1 : -1;
          translateY.value = withTiming(dir * SCREEN_HEIGHT * 1.2, { duration: 220 });
          backdropOpacity.value = withTiming(0, { duration: 220 });
          chromeVisible.value = withTiming(0, { duration: 180 });
          scheduleOnRN(navigateBackPanDismiss);
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
    }), [baseX, baseY, translateX, translateY, scale, backdropOpacity, chromeVisible, navigateBackPanDismiss]);

  // ─── Double-tap ───────────────────────────────────────────────────────────
  const doubleTap = useMemo(() => Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(180)
    .onEnd((e) => {
      'worklet';
      if (backdropOpacity.value < 0.99) return;
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
    }), [backdropOpacity, scale, translateX, translateY, baseScale, baseX, baseY]);

  // ─── Single-tap (Toggle Chrome) ───────────────────────────────────────────
  const singleTap = useMemo(() => Gesture.Tap()
    .maxDuration(180)
    .onEnd(() => {
      'worklet';
      if (backdropOpacity.value < 0.99) return;
      if (chromeVisible.value === 1) {
        // Fade out chrome smoothly over 160ms, then hide native system bars without causing animation stutter
        chromeVisible.value = withTiming(0, { duration: 160 }, (finished) => {
          if (finished) {
            scheduleOnRN(setSystemBarHidden, true);
          }
        });
      } else {
        // Show system bars immediately so status bar returns, then fade chrome in
        scheduleOnRN(setSystemBarHidden, false);
        chromeVisible.value = withTiming(1, { duration: 160 });
      }
    }), [backdropOpacity, chromeVisible]);

  // ─── Compose Gestures ─────────────────────────────────────────────────────
  // Exclusive ensures singleTap only fires if doubleTap FAILS.
  const composed = useMemo(() => {
    const taps = Gesture.Exclusive(doubleTap, singleTap);
    return Gesture.Simultaneous(pinch, pan, taps);
  }, [doubleTap, singleTap, pinch, pan]);

  // In OCR mode, disable viewer image gestures so CropOverlay touches don't conflict
  const activeGesture = useMemo(() => {
    if (isOcrMode) {
      return Gesture.Native();
    }
    return composed;
  }, [isOcrMode, composed]);

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
    opacity: backdropOpacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Derive top/bottom translation directly from chromeVisible for smooth 60fps response
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: chromeVisible.value,
    transform: [{ translateY: (1 - chromeVisible.value) * -20 }],
  }));

  const bottomChromeStyle = useAnimatedStyle(() => ({
    opacity: chromeVisible.value,
    transform: [{ translateY: (1 - chromeVisible.value) * 20 }],
  }));

  if (!uri) return null;

  return (
    <View style={styles.root}>
      <SystemBars style='light' hidden={isSystemBarHidden ? true : { statusBar: false, navigationBar: true }} />

      {/* Scrim */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* Gesture surface & Image */}
      <GestureDetector gesture={activeGesture}>
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
        bounds={ocrBounds}
      />

      {/* ─── Standard Chrome ─── */}
      <ViewerTopBar 
        onDismiss={dismiss} 
        style={chromeStyle} 
        pointerEvents={isSystemBarHidden ? 'none' : 'box-none'} 
      />

      <ViewerBottomBar 
        onOcrPress={toggleOcrMode} 
        onSharePress={handleShare}
        isSharing={isSharing}
        style={bottomChromeStyle} 
        pointerEvents={isSystemBarHidden ? 'none' : 'box-none'} 
      />

      {/* ─── OCR Mode Chrome ─── */}
      {isOcrMode && (
        <ViewerOcrChrome 
          onCancel={toggleOcrMode} 
          onScan={handleScan} 
          isScanning={isScanning} 
        />
      )}

      {/* ─── OCR Extracted Text Panel ─── */}
      <ViewerOcrResultPanel 
        text={extractedText} 
        onClose={() => setExtractedText(null)} 
      />
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
});
