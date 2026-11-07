import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme';
import { LiveStatusText } from './LiveStatusText';
import { EngineStatusTrigger } from './EngineStatusTrigger';

export interface HeaderProps {
  insets: EdgeInsets;
  onOpenAbout?: () => void;
}

export const Header = React.memo(({ insets, onOpenAbout }: HeaderProps) => {
  const colors = useThemeColors();

  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }
      ]}
    >
      <View style={styles.leftColumn}>
        <Text 
          style={[
            styles.title, 
            { color: colors.onSurface }
          ]}
        >
          Refind
        </Text>
        <LiveStatusText />
      </View>

      {onOpenAbout && (
        <EngineStatusTrigger onPress={onOpenAbout} />
      )}
    </View>
  );
});

Header.displayName = 'Header';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
});
