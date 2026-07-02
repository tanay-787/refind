import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SIZE = 80;

interface CropOverlayProps {
  isActive: boolean;
  boxX: SharedValue<number>;
  boxY: SharedValue<number>;
  boxW: SharedValue<number>;
  boxH: SharedValue<number>;
}

export function CropOverlay({ isActive, boxX, boxY, boxW, boxH }: CropOverlayProps) {
  const opacity = useSharedValue(0);
  const dragMode = useSharedValue<'none' | 'center' | 'tl' | 'tr' | 'bl' | 'br'>('none');

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0, { duration: 250 });
  }, [isActive]);

  const panCrop = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      startX.value = boxX.value;
      startY.value = boxY.value;
      startW.value = boxW.value;
      startH.value = boxH.value;

      const HIT_SLOP = 45;
      const x = e.x;
      const y = e.y;

      const isLeft = x >= boxX.value - HIT_SLOP && x <= boxX.value + HIT_SLOP;
      const isRight = x >= boxX.value + boxW.value - HIT_SLOP && x <= boxX.value + boxW.value + HIT_SLOP;
      const isTop = y >= boxY.value - HIT_SLOP && y <= boxY.value + HIT_SLOP;
      const isBottom = y >= boxY.value + boxH.value - HIT_SLOP && y <= boxY.value + boxH.value + HIT_SLOP;

      if (isTop && isLeft) dragMode.value = 'tl';
      else if (isTop && isRight) dragMode.value = 'tr';
      else if (isBottom && isLeft) dragMode.value = 'bl';
      else if (isBottom && isRight) dragMode.value = 'br';
      else if (
        x >= boxX.value && x <= boxX.value + boxW.value &&
        y >= boxY.value && y <= boxY.value + boxH.value
      ) {
        dragMode.value = 'center';
      } else {
        dragMode.value = 'none';
      }
    })
    .onUpdate((e) => {
      'worklet';
      if (dragMode.value === 'center') {
        boxX.value = Math.max(0, Math.min(startX.value + e.translationX, SCREEN_WIDTH - boxW.value));
        boxY.value = Math.max(0, Math.min(startY.value + e.translationY, SCREEN_HEIGHT - boxH.value));
      } else if (dragMode.value === 'br') {
        boxW.value = Math.max(MIN_SIZE, Math.min(startW.value + e.translationX, SCREEN_WIDTH - boxX.value));
        boxH.value = Math.max(MIN_SIZE, Math.min(startH.value + e.translationY, SCREEN_HEIGHT - boxY.value));
      } else if (dragMode.value === 'tl') {
        const newX = Math.max(0, Math.min(startX.value + e.translationX, startX.value + startW.value - MIN_SIZE));
        const newY = Math.max(0, Math.min(startY.value + e.translationY, startY.value + startH.value - MIN_SIZE));
        boxW.value = startW.value + (startX.value - newX);
        boxH.value = startH.value + (startY.value - newY);
        boxX.value = newX;
        boxY.value = newY;
      } else if (dragMode.value === 'tr') {
        boxW.value = Math.max(MIN_SIZE, Math.min(startW.value + e.translationX, SCREEN_WIDTH - boxX.value));
        const newY = Math.max(0, Math.min(startY.value + e.translationY, startY.value + startH.value - MIN_SIZE));
        boxH.value = startH.value + (startY.value - newY);
        boxY.value = newY;
      } else if (dragMode.value === 'bl') {
        boxH.value = Math.max(MIN_SIZE, Math.min(startH.value + e.translationY, SCREEN_HEIGHT - boxY.value));
        const newX = Math.max(0, Math.min(startX.value + e.translationX, startX.value + startW.value - MIN_SIZE));
        boxW.value = startW.value + (startX.value - newX);
        boxX.value = newX;
      }
    });

  // ─── Container fades in/out, but does NOT consume touches when inactive ───
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // ─── The four dark dimming panels ────────────────────────────────────────
  // Each panel's base style sets `position: 'absolute'` and its FIXED edges.
  // Only the DYNAMIC dimension is driven by useAnimatedStyle.

  const topDimStyle = useAnimatedStyle(() => ({
    height: boxY.value,
  }));

  const bottomDimStyle = useAnimatedStyle(() => ({
    top: boxY.value + boxH.value,
  }));

  const leftDimStyle = useAnimatedStyle(() => ({
    top: boxY.value,
    width: boxX.value,
    height: boxH.value,
  }));

  const rightDimStyle = useAnimatedStyle(() => ({
    top: boxY.value,
    left: boxX.value + boxW.value,
    height: boxH.value,
  }));

  // ─── The crop box frame + corner handles ──────────────────────────────────
  const boxStyle = useAnimatedStyle(() => ({
    left: boxX.value,
    top: boxY.value,
    width: boxW.value,
    height: boxH.value,
  }));

  if (!isActive) return null;

  return (
    // zIndex: 10 keeps us above the image but BELOW the chrome bars (zIndex: 200)
    // box-none on the container so the frame itself doesn't consume touches,
    // only the GestureDetector's inner surface does.
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle, { zIndex: 10 }]} pointerEvents="box-none">
      <GestureDetector gesture={panCrop}>
        {/* This view MUST be pointerEvents auto (default) so GestureDetector receives touches */}
        <Animated.View style={StyleSheet.absoluteFill}>
          {/* ─── Dimming Masks (pointerEvents none so they don't block gestures) ─── */}
          <Animated.View style={[styles.dimTop, topDimStyle]} pointerEvents="none" />
          <Animated.View style={[styles.dimBottom, bottomDimStyle]} pointerEvents="none" />
          <Animated.View style={[styles.dimLeft, leftDimStyle]} pointerEvents="none" />
          <Animated.View style={[styles.dimRight, rightDimStyle]} pointerEvents="none" />

          {/* ─── Crop Box Frame ─── */}
          <Animated.View style={[styles.box, boxStyle]} pointerEvents="none">
            <Animated.View style={[styles.corner, styles.tl]} />
            <Animated.View style={[styles.corner, styles.tr]} />
            <Animated.View style={[styles.corner, styles.bl]} />
            <Animated.View style={[styles.corner, styles.br]} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const DIM_COLOR = 'rgba(0,0,0,0.62)';

const styles = StyleSheet.create({
  // Each panel fixes its non-dynamic edges in the base style
  dimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DIM_COLOR,
  },
  dimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DIM_COLOR,
  },
  dimLeft: {
    position: 'absolute',
    left: 0,
    backgroundColor: DIM_COLOR,
  },
  dimRight: {
    position: 'absolute',
    right: 0,
    backgroundColor: DIM_COLOR,
  },
  box: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#fff',
  },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
});
