import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { IconView } from '@/ui/IconView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ViewerBottomBarProps {
  onOcrPress: () => void;
  style?: any;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

export function ViewerBottomBar({ onOcrPress, style, pointerEvents }: ViewerBottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View 
      style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }, style]}
      pointerEvents={pointerEvents}
    >
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={onOcrPress}>
        <IconView name="text_fields" size={24} tintColor="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
        <IconView name="share" size={24} tintColor="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
        <IconView name="info" size={24} tintColor="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
        <IconView name="delete" size={24} tintColor="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
