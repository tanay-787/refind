import React from 'react';
import { Text } from '@expo/ui';
import { Column } from '@expo/ui/jetpack-compose';
import { IconView } from '@/ui/IconView';
import { useMaterialColors } from '@expo/ui/jetpack-compose';

export const NoResultsState = React.memo(() => {
  const colors = useMaterialColors();
  
  return (
    <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
      <IconView 
        name="search" 
        size={48} 
        tintColor={colors.outline} 
        inNative={true}
      />
      <Text textStyle={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 18 }}>No results</Text>
      <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.onSurfaceVariant, textAlign: 'center' }}>
          Try searching for something else
      </Text>
    </Column>
  );
});
