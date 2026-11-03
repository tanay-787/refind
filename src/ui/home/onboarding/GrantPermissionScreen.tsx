import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoLibraryIllustration } from '@/ui/illustrations';
import { useThemeColors } from '@/theme';

interface GrantPermissionScreenProps {
  onGrantPermission: () => void;
}

export const GrantPermissionScreen = React.memo(({ onGrantPermission }: GrantPermissionScreenProps) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  
  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <View 
        style={[
          styles.container, 
          { 
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 24),
          }
        ]}
      >
        {/* Top Spacer */}
        <View style={styles.spacer} />

        {/* Illustration & Copy */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <PhotoLibraryIllustration size={140} />
          </View>

          <View style={styles.textContainer}>
            <Text 
              style={[
                styles.title, 
                { color: colors.onSurface }
              ]}
            >
              Your screenshots, searchable in seconds
            </Text>
            <Text 
              style={[
                styles.body, 
                { color: colors.onSurfaceVariant }
              ]}
            >
              To automatically find and index your screenshots, Refind needs access to your entire photo library.
            </Text>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.spacer} />

        {/* Footer CTA & Disclaimer */}
        <View style={styles.footer}>
          <Pressable
            onPress={onGrantPermission}
            android_ripple={{ color: colors.secondary }}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.secondaryContainer,
                opacity: pressed ? 0.9 : 1,
              }
            ]}
          >
            <Text 
              style={[
                styles.buttonText, 
                { color: colors.onSecondaryContainer }
              ]}
            >
              Enable Search
            </Text>
          </Pressable>

          <Text 
            style={[
              styles.disclaimer, 
              { color: colors.onSurfaceVariant }
            ]}
          >
            Select &quot;Allow All&quot; to enable search
          </Text>
        </View>
      </View>
    </View>
  );
});

GrantPermissionScreen.displayName = 'GrantPermissionScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
