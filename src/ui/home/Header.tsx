import React from 'react';
import { Text } from '@expo/ui';
import { Column } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding as paddingModifier } from '@expo/ui/jetpack-compose/modifiers';
import { useMaterialColors } from '@expo/ui/jetpack-compose';

export const Header = React.memo(() => {
  const colors = useMaterialColors();
  return (
    <Column modifiers={[fillMaxWidth(), paddingModifier(16, 32, 16, 16)]}>
      <Text 
        textStyle={{ 
          fontFamily: 'Newsreader_600SemiBold',
          fontSize: 32, 
          letterSpacing: -0.5
        }}
      >
        Refind
      </Text>
      <Text 
        textStyle={{ 
          fontFamily: 'Inter_400Regular',
          color: colors.onSurfaceVariant, 
          fontSize: 14 
        }}
      >
        Search everything you've seen
      </Text>
    </Column>
  );
});
