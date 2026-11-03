import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme';
import { IconView } from '@/ui/IconView';
import { LiveStatusText } from './LiveStatusText';

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
        <Pressable 
          onPress={onOpenAbout}
          android_ripple={{ color: colors.surfaceVariant, borderless: true, radius: 20 }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.aboutButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          accessibilityRole="button"
          accessibilityLabel="About Refind and Community"
        >
          <IconView name="info" size={24} tintColor={colors.onSurfaceVariant} />
        </Pressable>
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
  aboutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
