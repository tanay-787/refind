import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SearchField } from 'heroui-native';
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

  return (
    <View style={styles.container}>
      <SearchField value={text} onChange={handleChangeText}>
        <SearchField.Group 
          style={[
            styles.inputWrapper, 
            { backgroundColor: colors.surfaceContainerHigh }
          ]}
        >
          <SearchField.SearchIcon>
            <IconView 
              name="search" 
              size={22} 
              tintColor={colors.onSurfaceVariant} 
            />
          </SearchField.SearchIcon>
          
          <SearchField.Input
            placeholder="Search screenshots..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[
              styles.input,
              { color: colors.onSurface }
            ]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
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
});
