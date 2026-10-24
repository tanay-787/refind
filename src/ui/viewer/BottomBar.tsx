import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { IconView } from '@/ui/IconView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme';

interface ViewerBottomBarProps {
  onOcrPress: () => void;
  onSharePress: () => void;
  isSharing?: boolean;
  style?: any;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

export function ViewerBottomBar({ onOcrPress, onSharePress, isSharing = false, style, pointerEvents }: ViewerBottomBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors({ colorScheme: 'dark' });

  return (
    <Animated.View 
      style={[
        styles.bottomBar, 
        { 
          paddingBottom: Math.max(insets.bottom, 16),
        }, 
        style
      ]}
      pointerEvents={pointerEvents}
    >
      <View style={styles.row}>
        
        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.7}
          disabled={isSharing}
          onPress={onSharePress}
        >
          <IconView name="share" size={26} tintColor={colors.onSurface} />
          <Text style={[styles.label, { color: colors.onSurface }]}>
            Share
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={onOcrPress}
        >
          <IconView name="scan" size={26} tintColor={colors.primary} />
          <Text style={[styles.activeLabel, { color: colors.primary }]}>
            Extract Text
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={() => console.log('Info clicked')}
        >
          <IconView name="info" size={26} tintColor={colors.onSurface} />
          <Text style={[styles.label, { color: colors.onSurface }]}>
            Info
          </Text>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  activeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
