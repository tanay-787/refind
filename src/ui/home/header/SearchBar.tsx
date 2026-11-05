import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SearchField } from 'heroui-native';

interface SearchBarProps {
  onQueryChange: (query: string) => void;
}

export const SearchBar = React.memo(({ onQueryChange }: SearchBarProps) => {
  const [text, setText] = useState('');

  const handleChangeText = useCallback((val: string) => {
    setText(val);
    onQueryChange(val);
  }, [onQueryChange]);

  return (
    <View style={styles.container}>
      <SearchField value={text} onChange={handleChangeText}>
        <SearchField.Group className="w-full">
          <SearchField.SearchIcon />
          <SearchField.Input
            placeholder="Search screenshots..."
            variant="secondary"
            className="rounded-full h-12 text-base"
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
    paddingTop: 4,
    paddingBottom: 10,
  },
});
