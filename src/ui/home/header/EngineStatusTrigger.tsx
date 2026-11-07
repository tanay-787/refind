import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableFeedback } from 'heroui-native';
import { useThemeColors } from '@/theme';
import { useDiscoveryEngineStats } from '@/hooks';
import { RadialChart } from '@/ui/charts/radial-chart';

export interface EngineStatusTriggerProps {
  onPress: () => void;
}

export const EngineStatusTrigger = React.memo(({ onPress }: EngineStatusTriggerProps) => {
  const colors = useThemeColors();
  const { chartData } = useDiscoveryEngineStats();
  const trackColor = (colors as any).surfaceContainerHighest ?? colors.surfaceVariant;

  return (
    <PressableFeedback
      onPress={onPress}
      hitSlop={8}
      className="w-10 h-10 rounded-full items-center justify-center"
      style={styles.triggerButton}
      accessibilityRole="button"
      accessibilityLabel="Discovery Engine Status and Community Sheet"
    >
      <PressableFeedback.Highlight />
      <View pointerEvents="none" style={styles.chartWrapper}>
        <RadialChart.Root
          data={chartData}
          variant="circle"
          enableGesture={false}
          animate={true}
          barWidth={2.5}
          gap={1.5}
          style={styles.chart}
        >
          <RadialChart.Tracks color={trackColor} opacity={0.35} />
          <RadialChart.Bars />
        </RadialChart.Root>
      </View>
    </PressableFeedback>
  );
});

EngineStatusTrigger.displayName = 'EngineStatusTrigger';

const styles = StyleSheet.create({
  triggerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    width: 32,
    height: 32,
  },
});
