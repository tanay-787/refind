import React from 'react';
import { Text } from '@expo/ui';
import { Column, Box, RNHostView } from '@expo/ui/jetpack-compose';
import { fillMaxSize, size, background, clip, Shapes, padding as paddingModifier, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useMaterialColors } from '@expo/ui/jetpack-compose';
import EmptySearch from '@/ui/illustrations/EmptySearchIllustration';

export const WelcomeState = React.memo(() => {
  const colors = useMaterialColors();
  
  return (
    <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 16 }} modifiers={[paddingModifier(0, 0, 0, 32)]}>
      <RNHostView matchContents={true}>
        <EmptySearch width={300} height={300} />
      </RNHostView>

      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }} modifiers={[ padding(20, 0, 20, 0)]}>
        <Text textStyle={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 20, textAlign: 'center' }}>
          What you capture belongs to you
        </Text>
        <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
          We know screenshots can sometimes contain sensitive information so nothing ever leaves your device.
        </Text>
      </Column>
    </Column>
  );
});