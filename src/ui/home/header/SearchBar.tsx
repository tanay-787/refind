import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/theme';
import { IconView } from '@/ui/IconView';

interface SearchBarProps {
  onQueryChange: (query: string) => void;
}

export const SearchBar = React.memo(({ onQueryChange }: SearchBarProps) => {
  const colors = useThemeColors();
  const [text, setText] = useState('');

  const handleChangeText = useCallback((val: string) => {
    setText(val);
    onQueryChange(val);
  }, [onQueryChange]);

  const handleClear = useCallback(() => {
    setText('');
    onQueryChange('');
  }, [onQueryChange]);

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.inputWrapper, 
          { backgroundColor: colors.surfaceContainerHigh }
        ]}
      >
        <IconView 
          name="search" 
          size={22} 
          tintColor={colors.onSurfaceVariant} 
        />
        
        <TextInput
          value={text}
          onChangeText={handleChangeText}
          placeholder="Search screenshots..."
          placeholderTextColor={colors.onSurfaceVariant}
          style={[
            styles.input,
            { color: colors.onSurface }
          ]}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />

        {text.length > 0 && (
          <Pressable 
            onPress={handleClear}
            hitSlop={8}
            android_ripple={{ color: colors.surfaceVariant, borderless: true, radius: 16 }}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <IconView 
              name="close" 
              size={18} 
              tintColor={colors.onSurfaceVariant} 
            />
          </Pressable>
        )}
      </View>
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  inputWrapper: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    paddingVertical: 0,
    marginLeft: 12,
    marginRight: 8,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
