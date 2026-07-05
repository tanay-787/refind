import React from 'react';
import { Text } from '@expo/ui';
import { Box, DockedSearchBar, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding as paddingModifier } from '@expo/ui/jetpack-compose/modifiers';
import { IconView } from '@/ui/IconView';

interface SearchBarProps {
  onQueryChange: (query: string) => void;
}

export const SearchBar = React.memo(({ onQueryChange }: SearchBarProps) => {
  const colors = useMaterialColors();
  
  return (
    <Box modifiers={[fillMaxWidth(), paddingModifier(16, 16, 16, 16)]}>
      <DockedSearchBar onQueryChange={onQueryChange}>
        <DockedSearchBar.LeadingIcon>
          <IconView 
            name="search" 
            size={24} 
            tintColor={colors.onSurfaceVariant} 
            inNative={true}
          />
        </DockedSearchBar.LeadingIcon>
        <DockedSearchBar.Placeholder>
          <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.onSurfaceVariant }}>Search screenshots...</Text>
        </DockedSearchBar.Placeholder>
      </DockedSearchBar>
    </Box>
  );
});
