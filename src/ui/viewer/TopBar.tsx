import React from 'react';
import { StyleSheet, TouchableOpacity, View, Button } from 'react-native';
import Animated from 'react-native-reanimated';
import { IconView } from '@/ui/IconView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrandColors } from '@/theme';

interface ViewerTopBarProps {
  onDismiss: () => void;
  style?: any;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

export function ViewerTopBar({ onDismiss, style, pointerEvents }: ViewerTopBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useBrandColors();
  
  return (
    <Animated.View 
      style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }, style]}
      pointerEvents={pointerEvents}
    >
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.iconButton}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <IconView name="keyboard_backspace" />
      </TouchableOpacity>
      </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
