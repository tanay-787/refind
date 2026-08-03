import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { IconView } from '@/ui/IconView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Host, Row, Column, Text, LoadingIndicator } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, clickable, padding as paddingModifier, size } from '@expo/ui/jetpack-compose/modifiers';
import { useThemeColors, ThemedHost } from '@/theme';

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
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: 'rgba(0, 0, 0, 0.85)'
        }, 
        style
      ]}
      pointerEvents={pointerEvents}
    >
      <ThemedHost>
        <Row modifiers={[fillMaxWidth()]} verticalAlignment="center" horizontalArrangement="spaceEvenly">
          
          <Column modifiers={[paddingModifier(16, 8, 16, 8), clickable(isSharing ? () => {} : onSharePress)]} horizontalAlignment="center" verticalArrangement={{ spacedBy: 2 }}>
              <IconView name="share" size={24} tintColor={colors.onSurface} inNative={true} />
            <Text color={colors.onSurface} style={{ fontFamily: 'Inter_400Regular', fontSize: 12}}>
              {'Share'}
            </Text>
          </Column>
          
          <Column modifiers={[paddingModifier(16, 8, 16, 8), clickable(onOcrPress)]} horizontalAlignment="center" verticalArrangement={{ spacedBy: 2 }}>
            <IconView name="scan" size={28} tintColor={colors.primary} inNative={true} />
            <Text color={colors.primary} style={{ fontFamily: 'Inter_500Medium', fontSize: 12}}>
              {'Extract Text'}
            </Text>
          </Column>
          
          <Column modifiers={[paddingModifier(16, 8, 16, 8), clickable(() => console.log('Info clicked'))]} horizontalAlignment="center" verticalArrangement={{ spacedBy: 2 }}>
            <IconView name="info" size={24} tintColor={colors.onSurface} inNative={true} />
            <Text color={colors.onSurface} style={{ fontFamily: 'Inter_400Regular', fontSize: 12}}>
              {'Info'}
            </Text>
          </Column>

        </Row>
      </ThemedHost>
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
  },
});
