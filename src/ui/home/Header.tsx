import React from 'react';
import { Text } from '@expo/ui';
import { Column } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding as paddingModifier } from '@expo/ui/jetpack-compose/modifiers';
import { LiveStatusText } from './LiveStatusText';
import { EdgeInsets } from 'react-native-safe-area-context';

export const Header = React.memo(({ insets }: { insets: EdgeInsets }) => {
  return (
    <Column modifiers={[fillMaxWidth(), paddingModifier(16, (insets.top), 16, 16)]}>
      <Text 
        textStyle={{ 
          fontFamily: 'Newsreader_600SemiBold',
          fontSize: 32, 
          letterSpacing: -0.5
        }}
      >
        Refind
      </Text>
      <LiveStatusText />
    </Column>
  );
});
