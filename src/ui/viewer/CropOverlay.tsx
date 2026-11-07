import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export interface CropBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface CropOverlayProps {
  isActive: boolean;
  boxX: SharedValue<number>;
  boxY: SharedValue<number>;
  boxW: SharedValue<number>;
  boxH: SharedValue<number>;
  bounds: CropBounds;
}

const MIN_SIZE = 60;
const CORNER_HIT_SLOP = 40;
const EDGE_HIT_SLOP = 28;

type DragMode = 'none' | 'center' | 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right';

export function CropOverlay({ isActive, boxX, boxY, boxW, boxH, bounds }: CropOverlayProps) {
  const opacity = useSharedValue(0);
  const gridOpacity = useSharedValue(0);
  const dragMode = useSharedValue<DragMode>('none');

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0, { duration: 250 });
  }, [isActive, opacity]);

  const { minX, minY, maxX, maxY } = bounds;

  const panCrop = useMemo(() => {
    return Gesture.Pan()
      .onStart((e) => {
        'worklet';
        startX.value = boxX.value;
        startY.value = boxY.value;
        startW.value = boxW.value;
        startH.value = boxH.value;

        const x = e.x;
        const y = e.y;

        const curX = boxX.value;
        const curY = boxY.value;
        const curW = boxW.value;
        const curH = boxH.value;

        // 1. Direct Corner Proximity Checks (44px square hit target at each corner)
        const isNearTL = Math.abs(x - curX) <= CORNER_HIT_SLOP && Math.abs(y - curY) <= CORNER_HIT_SLOP;
        const isNearTR = Math.abs(x - (curX + curW)) <= CORNER_HIT_SLOP && Math.abs(y - curY) <= CORNER_HIT_SLOP;
        const isNearBL = Math.abs(x - curX) <= CORNER_HIT_SLOP && Math.abs(y - (curY + curH)) <= CORNER_HIT_SLOP;
        const isNearBR = Math.abs(x - (curX + curW)) <= CORNER_HIT_SLOP && Math.abs(y - (curY + curH)) <= CORNER_HIT_SLOP;

        // 2. Direct Edge Proximity Checks (28px band along each edge)
        const isNearTop = Math.abs(y - curY) <= EDGE_HIT_SLOP && x >= curX && x <= curX + curW;
        const isNearBottom = Math.abs(y - (curY + curH)) <= EDGE_HIT_SLOP && x >= curX && x <= curX + curW;
        const isNearLeft = Math.abs(x - curX) <= EDGE_HIT_SLOP && y >= curY && y <= curY + curH;
        const isNearRight = Math.abs(x - (curX + curW)) <= EDGE_HIT_SLOP && y >= curY && y <= curY + curH;

        if (isNearTL) dragMode.value = 'tl';
        else if (isNearTR) dragMode.value = 'tr';
        else if (isNearBL) dragMode.value = 'bl';
        else if (isNearBR) dragMode.value = 'br';
        else if (isNearTop) dragMode.value = 'top';
        else if (isNearBottom) dragMode.value = 'bottom';
        else if (isNearLeft) dragMode.value = 'left';
        else if (isNearRight) dragMode.value = 'right';
        else if (x >= curX && x <= curX + curW && y >= curY && y <= curY + curH) {
          dragMode.value = 'center';
        } else {
          dragMode.value = 'none';
        }

        if (dragMode.value !== 'none') {
          gridOpacity.value = withTiming(1, { duration: 150 });
        }
      })
      .onUpdate((e) => {
        'worklet';
        const mode = dragMode.value;
        if (mode === 'none') return;

        if (mode === 'center') {
          boxX.value = Math.max(minX, Math.min(startX.value + e.translationX, maxX - boxW.value));
          boxY.value = Math.max(minY, Math.min(startY.value + e.translationY, maxY - boxH.value));
        } else if (mode === 'br') {
          boxW.value = Math.max(MIN_SIZE, Math.min(startW.value + e.translationX, maxX - boxX.value));
          boxH.value = Math.max(MIN_SIZE, Math.min(startH.value + e.translationY, maxY - boxY.value));
        } else if (mode === 'tl') {
          const newX = Math.max(minX, Math.min(startX.value + e.translationX, startX.value + startW.value - MIN_SIZE));
          const newY = Math.max(minY, Math.min(startY.value + e.translationY, startY.value + startH.value - MIN_SIZE));
          boxW.value = startW.value + (startX.value - newX);
          boxH.value = startH.value + (startY.value - newY);
          boxX.value = newX;
          boxY.value = newY;
        } else if (mode === 'tr') {
          boxW.value = Math.max(MIN_SIZE, Math.min(startW.value + e.translationX, maxX - boxX.value));
          const newY = Math.max(minY, Math.min(startY.value + e.translationY, startY.value + startH.value - MIN_SIZE));
          boxH.value = startH.value + (startY.value - newY);
          boxY.value = newY;
        } else if (mode === 'bl') {
          boxH.value = Math.max(MIN_SIZE, Math.min(startH.value + e.translationY, maxY - boxY.value));
          const newX = Math.max(minX, Math.min(startX.value + e.translationX, startX.value + startW.value - MIN_SIZE));
          boxW.value = startW.value + (startX.value - newX);
          boxX.value = newX;
        } else if (mode === 'top') {
          const newY = Math.max(minY, Math.min(startY.value + e.translationY, startY.value + startH.value - MIN_SIZE));
          boxH.value = startH.value + (startY.value - newY);
          boxY.value = newY;
        } else if (mode === 'bottom') {
          boxH.value = Math.max(MIN_SIZE, Math.min(startH.value + e.translationY, maxY - boxY.value));
        } else if (mode === 'left') {
          const newX = Math.max(minX, Math.min(startX.value + e.translationX, startX.value + startW.value - MIN_SIZE));
          boxW.value = startW.value + (startX.value - newX);
          boxX.value = newX;
        } else if (mode === 'right') {
          boxW.value = Math.max(MIN_SIZE, Math.min(startW.value + e.translationX, maxX - boxX.value));
        }
      })
      .onFinalize(() => {
        'worklet';
        dragMode.value = 'none';
        gridOpacity.value = withTiming(0, { duration: 200 });
      });
  }, [minX, minY, maxX, maxY, boxX, boxY, boxW, boxH, startX, startY, startW, startH, dragMode, gridOpacity]);

  // ─── Container fades in/out ───────────────────────────────────────────────
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // ─── Four dark dimming panels ─────────────────────────────────────────────
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

  const gridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  return (
    <Animated.View 
      style={[StyleSheet.absoluteFill, containerStyle, { zIndex: 10 }]} 
      pointerEvents={isActive ? 'box-none' : 'none'}
    >
      <GestureDetector gesture={panCrop}>
        <Animated.View style={StyleSheet.absoluteFill}>
          {/* ─── Dimming Masks ─── */}
          <Animated.View style={[styles.dimTop, topDimStyle]} pointerEvents="none" />
          <Animated.View style={[styles.dimBottom, bottomDimStyle]} pointerEvents="none" />
          <Animated.View style={[styles.dimLeft, leftDimStyle]} pointerEvents="none" />
          <Animated.View style={[styles.dimRight, rightDimStyle]} pointerEvents="none" />

          {/* ─── Crop Box Frame ─── */}
          <Animated.View style={[styles.box, boxStyle]} pointerEvents="none">
            {/* Rule-of-Thirds Grid */}
            <Animated.View style={[StyleSheet.absoluteFill, gridStyle]} pointerEvents="none">
              <View style={[styles.gridLineV, { left: '33.333%' }]} />
              <View style={[styles.gridLineV, { left: '66.666%' }]} />
              <View style={[styles.gridLineH, { top: '33.333%' }]} />
              <View style={[styles.gridLineH, { top: '66.666%' }]} />
            </Animated.View>

            {/* Corner Brackets */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />

            {/* Edge Midpoint Notches */}
            <View style={[styles.edgeNotchH, styles.edgeTop]} />
            <View style={[styles.edgeNotchH, styles.edgeBottom]} />
            <View style={[styles.edgeNotchV, styles.edgeLeft]} />
            <View style={[styles.edgeNotchV, styles.edgeRight]} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const DIM_COLOR = 'rgba(0,0,0,0.62)';

const styles = StyleSheet.create({
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
    width: 24,
    height: 24,
    borderColor: '#ffffff',
    borderWidth: 0,
  },
  tl: { top: -2, left: -2, borderTopWidth: 3.5, borderLeftWidth: 3.5 },
  tr: { top: -2, right: -2, borderTopWidth: 3.5, borderRightWidth: 3.5 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 3.5, borderLeftWidth: 3.5 },
  br: { bottom: -2, right: -2, borderBottomWidth: 3.5, borderRightWidth: 3.5 },
  edgeNotchH: {
    position: 'absolute',
    width: 24,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    left: '50%',
    marginLeft: -12,
  },
  edgeTop: { top: -2 },
  edgeBottom: { bottom: -2 },
  edgeNotchV: {
    position: 'absolute',
    width: 3.5,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    top: '50%',
    marginTop: -12,
  },
  edgeLeft: { left: -2 },
  edgeRight: { right: -2 },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
