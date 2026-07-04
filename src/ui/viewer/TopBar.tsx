import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ViewerTopBarProps {
  onDismiss: () => void;
  style?: any;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

export function ViewerTopBar({ onDismiss, style, pointerEvents }: ViewerTopBarProps) {
  const insets = useSafeAreaInsets();
  
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
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back' }} size={28} tintColor="#fff" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Refind</Text>
      
      {/* Invisible spacer to perfectly center the title */}
      <View style={styles.iconButton} pointerEvents="none" />
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
    paddingBottom: 16,
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
