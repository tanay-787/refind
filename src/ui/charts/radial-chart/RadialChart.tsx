import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedProps,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  angleForPoint,
  colorAt,
  distanceFromCenter,
  formatShare,
  isWithinSweep,
  lerp,
  maxValueOf,
  ringIndexForDistance,
  ringPath,
  staggeredProgress,
  toBands,
  toRadians,
  toRings,
} from './helper';
import {
  BAR_COLORS,
  BAR_WIDTH,
  BOTTOM_INSET,
  CIRCLE_SWEEP,
  GROW_DURATION,
  MORPH_DURATION,
  RADIUS_INSET,
  RING_GAP,
  SEMICIRCLE_START,
  SEMICIRCLE_SWEEP,
  SPRING_CONFIG,
  STAGGER,
  START_ANGLE,
  TRACK_COLOR,
} from './const';
import { RadialChartContext, useRadialChart } from './context';
import type {
  IRadialChartBars,
  IRadialChartContext,
  IRadialChartLabel,
  IRadialChartLegend,
  IRadialChartRoot,
  IRadialChartTracks,
} from './types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const OVERLAY_LAYER = '__radialChartOverlay';

const isOverlayChild = (child: React.ReactNode): boolean =>
  React.isValidElement(child) &&
  (child.type as unknown as Record<string, unknown>)[OVERLAY_LAYER] === true;

const useSelectedIndex = (
  selectedIndex: IRadialChartContext['selectedIndex'],
): number => {
  const [index, setIndex] = useState<number>(-1);
  useAnimatedReaction(
    () => selectedIndex.value,
    (current, previous) => {
      if (current !== previous) runOnJS(setIndex)(current);
    },
    [],
  );
  return index;
};

const RadialChartRoot: React.FC<IRadialChartRoot> = ({
  children,
  data,
  variant = 'circle',
  maxValue,
  radius: radiusProp,
  barWidth = BAR_WIDTH,
  gap = RING_GAP,
  startAngle: startAngleProp,
  sweepAngle: sweepAngleProp,
  bottomInset = BOTTOM_INSET,
  animate = true,
  growDuration = GROW_DURATION,
  morphDuration = MORPH_DURATION,
  enableGesture = true,
  onRingChange,
  onGestureStart,
  onGestureEnd,
  style,
}) => {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const originFractions = useSharedValue<number[]>([]);
  const targetFractions = useSharedValue<number[]>([]);
  const morph = useSharedValue<number>(1);
  const grow = useSharedValue<number>(0);
  const isActive = useSharedValue<number>(0);
  const selectedIndex = useSharedValue<number>(-1);
  const hasEntered = useRef<boolean>(false);

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }, []);

  const isSemicircle = variant === 'semicircle';

  const resolvedMax = useMemo(
    () => (maxValue != null ? maxValue : maxValueOf(data)),
    [data, maxValue],
  );
  const rings = useMemo(() => toRings(data, resolvedMax), [data, resolvedMax]);

  const plotHeight = Math.max(size.height - bottomInset, 0);

  const radius = Math.max(
    radiusProp ??
      (isSemicircle
        ? Math.min(size.width / 2, plotHeight) - RADIUS_INSET
        : Math.min(size.width, plotHeight) / 2 - RADIUS_INSET),
    0,
  );
  const centerX = size.width / 2;
  const centerY = isSemicircle ? plotHeight / 2 + radius / 2 : plotHeight / 2;

  const bands = useMemo(
    () => toBands(radius, barWidth, gap, data.length),
    [radius, barWidth, gap, data.length],
  );

  const startRadians = useMemo(
    () =>
      toRadians(
        startAngleProp ?? (isSemicircle ? SEMICIRCLE_START : START_ANGLE),
      ),
    [isSemicircle, startAngleProp],
  );
  const sweepRadians = useMemo(
    () =>
      toRadians(
        sweepAngleProp ?? (isSemicircle ? SEMICIRCLE_SWEEP : CIRCLE_SWEEP),
      ),
    [isSemicircle, sweepAngleProp],
  );

  const isMeasured = size.width > 0 && size.height > 0;

  useEffect(() => {
    if (!isMeasured || data.length === 0) return;

    const fractions = rings.map((ring) => ring.fraction);
    const isEntrance = !hasEntered.current;
    hasEntered.current = true;

    if (!animate) {
      originFractions.value = fractions;
      targetFractions.value = fractions;
      cancelAnimation(morph);
      morph.value = 1;
      grow.value = 1;
      return;
    }

    if (isEntrance || targetFractions.value.length !== fractions.length) {
      originFractions.value = fractions;
      targetFractions.value = fractions;
      cancelAnimation(morph);
      morph.value = 1;
      cancelAnimation(grow);
      grow.value = 0;
      grow.value = withTiming(1, {
        duration: growDuration,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    const from = originFractions.value;
    const to = targetFractions.value;
    const progress = morph.value;
    originFractions.value = fractions.map((_, i) =>
      lerp(from[i] ?? 0, to[i] ?? 0, progress),
    );
    targetFractions.value = fractions;

    cancelAnimation(morph);
    morph.value = 0;
    morph.value = withTiming(1, {
      duration: morphDuration,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [
    animate,
    data,
    grow,
    growDuration,
    isMeasured,
    morph,
    morphDuration,
    originFractions,
    rings,
    targetFractions,
  ]);

  const fractions = useDerivedValue<number[]>(() => {
    const origin = originFractions.value;
    const target = targetFractions.value;
    const count = Math.max(origin.length, target.length);

    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      const fraction = lerp(origin[i] ?? 0, target[i] ?? 0, morph.value);
      out.push(fraction * staggeredProgress(grow.value, i, STAGGER));
    }
    return out;
  }, []);

  const reportRing = useCallback(
    (idx: number) => {
      const point = data[idx];
      if (point != null) onRingChange?.(point, idx);
    },
    [data, onRingChange],
  );

  const handleGestureStart = useCallback(() => {
    onGestureStart?.();
  }, [onGestureStart]);

  const handleGestureEnd = useCallback(() => {
    onGestureEnd?.();
  }, [onGestureEnd]);

  const ringCount = data.length;

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(enableGesture)
      .minDistance(0)
      .onBegin((event) => {
        'worklet';
        const distance = distanceFromCenter(event.x, event.y, centerX, centerY);
        const angle = angleForPoint(event.x, event.y, centerX, centerY);
        const idx = isWithinSweep(angle, startRadians, sweepRadians)
          ? ringIndexForDistance(distance, radius, barWidth, gap, ringCount)
          : -1;

        if (idx !== selectedIndex.value) {
          selectedIndex.value = idx;
          if (idx >= 0) runOnJS(reportRing)(idx);
        }
        isActive.value = withTiming(idx >= 0 ? 1 : 0, { duration: 140 });
        runOnJS(handleGestureStart)();
      })
      .onUpdate((event) => {
        'worklet';
        const distance = distanceFromCenter(event.x, event.y, centerX, centerY);
        const angle = angleForPoint(event.x, event.y, centerX, centerY);
        const idx = isWithinSweep(angle, startRadians, sweepRadians)
          ? ringIndexForDistance(distance, radius, barWidth, gap, ringCount)
          : -1;

        if (idx !== selectedIndex.value) {
          selectedIndex.value = idx;
          if (idx >= 0) runOnJS(reportRing)(idx);
          isActive.value = withTiming(idx >= 0 ? 1 : 0, { duration: 140 });
        }
      })
      .onFinalize(() => {
        'worklet';
        isActive.value = withTiming(0, { duration: 220 });
        selectedIndex.value = -1;
        runOnJS(handleGestureEnd)();
      });
  }, [
    barWidth,
    centerX,
    centerY,
    enableGesture,
    gap,
    handleGestureEnd,
    handleGestureStart,
    isActive,
    radius,
    reportRing,
    ringCount,
    selectedIndex,
    startRadians,
    sweepRadians,
  ]);

  const context = useMemo<IRadialChartContext>(
    () => ({
      data,
      rings,
      variant,
      width: size.width,
      height: size.height,
      centerX,
      centerY,
      radius,
      barWidth,
      gap,
      bands,
      startAngle: startRadians,
      sweepAngle: sweepRadians,
      bottomInset,
      fractions,
      grow,
      isActive,
      selectedIndex,
    }),
    [
      data,
      rings,
      variant,
      size.width,
      size.height,
      centerX,
      centerY,
      radius,
      barWidth,
      gap,
      bands,
      startRadians,
      sweepRadians,
      bottomInset,
      fractions,
      grow,
      isActive,
      selectedIndex,
    ],
  );

  const [svgChildren, overlayChildren] = useMemo(() => {
    const svg: React.ReactNode[] = [];
    const overlay: React.ReactNode[] = [];
    React.Children.forEach(children, (child) => {
      (isOverlayChild(child) ? overlay : svg).push(child);
    });
    return [svg, overlay];
  }, [children]);

  const isReady = isMeasured && data.length > 0 && radius > 0;

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>
          {isReady ? (
            <Svg width={size.width} height={size.height} style={styles.fill}>
              <RadialChartContext.Provider value={context}>
                {svgChildren}
              </RadialChartContext.Provider>
            </Svg>
          ) : null}
          {isReady ? (
            <RadialChartContext.Provider value={context}>
              {overlayChildren}
            </RadialChartContext.Provider>
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
};

const RadialChartTracks: React.FC<IRadialChartTracks> = ({
  color = TRACK_COLOR,
  opacity = 1,
  width,
  cap = 'round',
}) => {
  const { bands, centerX, centerY, startAngle, sweepAngle, barWidth } =
    useRadialChart('Tracks');

  return (
    <>
      {bands.map((band, idx) => (
        <Path
          key={idx}
          d={ringPath(
            centerX,
            centerY,
            band.radius,
            startAngle,
            startAngle + sweepAngle,
          )}
          stroke={typeof color === 'string' ? color : colorAt(color, idx)}
          opacity={opacity}
          strokeWidth={width ?? barWidth}
          strokeLinecap={cap}
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </>
  );
};

const RadialChartBar: React.FC<{
  readonly index: number;
  readonly color: string;
  readonly activeColor?: string;
  readonly inactiveOpacity: number;
  readonly width: number;
  readonly cap: 'round' | 'butt' | 'square';
}> = memo(({ index, color, activeColor, inactiveOpacity, width, cap }) => {
  const {
    bands,
    centerX,
    centerY,
    fractions,
    startAngle,
    sweepAngle,
    selectedIndex,
    isActive,
  } = useRadialChart('Bars');

  const band = bands[index];
  const bandRadius = band?.radius ?? 0;

  const selection = useDerivedValue<number>(
    () => withSpring(selectedIndex.value === index ? 1 : 0, SPRING_CONFIG),
    [index],
  );

  const d = useDerivedValue<string>(() => {
    const fraction = fractions.value[index] ?? 0;
    return ringPath(
      centerX,
      centerY,
      bandRadius,
      startAngle,
      startAngle + fraction * sweepAngle,
    );
  }, [index, centerX, centerY, bandRadius, startAngle, sweepAngle]);

  const strokeWidth = useDerivedValue<number>(
    () => width + selection.value * isActive.value * 2,
    [width],
  );

  const opacity = useDerivedValue<number>(() => {
    const dim = 1 - inactiveOpacity;
    return 1 - isActive.value * dim * (1 - selection.value);
  }, [inactiveOpacity]);

  const fill = useDerivedValue<string>(() => {
    if (activeColor == null) return color;
    return interpolateColor(
      selection.value * isActive.value,
      [0, 1],
      [color, activeColor],
    ) as string;
  }, [color, activeColor]);

  const animatedProps = useAnimatedProps(() => {
    return {
      d: d.value,
      stroke: fill.value,
      strokeWidth: strokeWidth.value,
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps as any}
      strokeLinecap={cap}
      strokeLinejoin="round"
      fill="none"
    />
  );
});

RadialChartBar.displayName = 'RadialChart.Bar';

const RadialChartBars: React.FC<IRadialChartBars> = ({
  colors = BAR_COLORS,
  activeColor,
  inactiveOpacity = 1,
  width,
  cap = 'round',
}) => {
  const { data, barWidth } = useRadialChart('Bars');

  return (
    <>
      {data.map((point, idx) => (
        <RadialChartBar
          key={`${point.label}-${idx}`}
          index={idx}
          color={point.color ?? colorAt(colors, idx)}
          activeColor={activeColor}
          inactiveOpacity={inactiveOpacity}
          width={width ?? barWidth}
          cap={cap}
        />
      ))}
    </>
  );
};

const RadialChartLabel: React.FC<IRadialChartLabel> = ({
  children,
  format,
  formatValue,
  placeholder,
  placeholderValue,
  style,
  labelStyle,
  valueStyle,
}) => {
  const {
    data,
    rings,
    bands,
    barWidth,
    variant,
    centerX,
    centerY,
    radius,
    selectedIndex,
  } = useRadialChart('Label');
  const index = useSelectedIndex(selectedIndex);
  const point = index >= 0 ? data[index] : undefined;
  const ring = index >= 0 ? rings[index] : undefined;

  const label =
    point != null
      ? format
        ? format(point, index)
        : point.label
      : (placeholder ?? '');
  const value =
    point != null && ring != null
      ? formatValue
        ? formatValue(point, index)
        : formatShare(ring.fraction)
      : (placeholderValue ?? '');

  const hole = Math.max(
    (bands[bands.length - 1]?.radius ?? radius) - barWidth / 2,
    0,
  );
  const maxWidth = Math.max(hole * 1.6, 88);
  const offsetY = variant === 'semicircle' ? -hole * 0.45 : -20;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.label,
        {
          left: centerX - maxWidth / 2,
          top: centerY,
          width: maxWidth,
          transform: [{ translateY: offsetY }],
        },
        style,
      ]}
    >
      {children ?? (
        <>
          {value !== '' && (
            <Text numberOfLines={1} style={[styles.valueText, valueStyle]}>
              {value}
            </Text>
          )}
          {label !== '' && (
            <Text numberOfLines={1} style={[styles.labelText, labelStyle]}>
              {label}
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const RadialChartLegend: React.FC<IRadialChartLegend> = ({
  colors = BAR_COLORS,
  format,
  formatValue,
  direction = 'column',
  style,
  itemStyle,
  labelStyle,
  valueStyle,
}) => {
  const { data, rings, bottomInset, selectedIndex } = useRadialChart('Legend');
  const index = useSelectedIndex(selectedIndex);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.legend,
        { height: bottomInset },
        direction === 'column' && styles.legendColumn,
        style,
      ]}
    >
      {data.map((point, i) => (
        <View
          key={`${point.label}-${i}`}
          style={[
            styles.legendItem,
            direction === 'column' && styles.legendItemColumn,
            itemStyle,
          ]}
        >
          <View
            style={[
              styles.legendSwatch,
              { backgroundColor: point.color ?? colorAt(colors, i) },
            ]}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.legendLabel,
              labelStyle,
              index === i && styles.legendLabelActive,
            ]}
          >
            {format ? format(point, i) : point.label}
          </Text>
          <Text numberOfLines={1} style={[styles.legendValue, valueStyle]}>
            {formatValue
              ? formatValue(point, i)
              : formatShare(rings[i]?.fraction ?? 0)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: 11,
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  legendColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendItemColumn: {
    justifyContent: 'space-between',
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  legendLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 'auto',
  },
});

Object.assign(RadialChartLabel, { [OVERLAY_LAYER]: true });
Object.assign(RadialChartLegend, { [OVERLAY_LAYER]: true });

export const RadialChart = Object.assign(memo(RadialChartRoot), {
  Root: memo(RadialChartRoot),
  Tracks: memo(RadialChartTracks),
  Bars: memo(RadialChartBars),
  Label: memo(RadialChartLabel),
  Legend: memo(RadialChartLegend),
});
