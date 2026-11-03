import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EmptySearch from '@/ui/illustrations/EmptySearchIllustration';
import { useThemeColors } from '@/theme';

export const WelcomeState = React.memo(() => {
  const colors = useThemeColors();
  
  return (
    <View style={styles.container}>
      <EmptySearch width={280} height={280} />

      <View style={styles.content}>
        <Text 
          style={[
            styles.title, 
            { color: colors.onSurface }
          ]}
        >
          If the Screenshot exists, we will find it for you.
        </Text>
        
        <Text 
          style={[
            styles.subtitle, 
            { color: colors.onSurfaceVariant }
          ]}
        >
          You can search for things like:
        </Text>

        <View style={styles.suggestions}>
          <Text style={[styles.suggestionText, { color: colors.onSurfaceVariant }]}>
            &quot;a <Text style={{ color: colors.primary }}>product</Text> you liked on Amazon&quot;
          </Text>
          <Text style={[styles.suggestionText, { color: colors.onSurfaceVariant }]}>
            &quot;a <Text style={{ color: colors.primary }}>username</Text> to find Whatsapp chats&quot;
          </Text>
          <Text style={[styles.suggestionText, { color: colors.onSurfaceVariant }]}>
            &quot;some <Text style={{ color: colors.primary }}>text</Text> you read in a Medium article&quot;
          </Text>
        </View>
      </View>
    </View>
  );
});

WelcomeState.displayName = 'WelcomeState';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  suggestions: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  suggestionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
});
