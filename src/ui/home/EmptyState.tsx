import React from 'react';
import { Text } from '@expo/ui';
import { Column, Box, RNHostView } from '@expo/ui/jetpack-compose';
import { fillMaxSize, size, background, clip, Shapes, padding as paddingModifier } from '@expo/ui/jetpack-compose/modifiers';
import { useMaterialColors } from '@expo/ui/jetpack-compose';
import EmptySearch from '../illustrations/EmptySearchIllustration';

export const EmptyState = React.memo(() => {
  const colors = useMaterialColors();
  
  return (
    <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 16 }} modifiers={[paddingModifier(0, 0, 0, 32)]}>
      <RNHostView matchContents={true}>
        <EmptySearch width={300} height={300} />
      </RNHostView>

      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
        <Text textStyle={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 20, textAlign: 'center' }}>
          Your visual memory, searchable
        </Text>
        <Text textStyle={{ fontFamily: 'Inter_400Regular', color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
          Search for "receipts", "travel", or text inside any screenshot.
        </Text>
      </Column>
    </Column>
  );
});