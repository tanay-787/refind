import React from 'react';
import { Text } from '@expo/ui';
import { Column, Box, RNHostView, Row, FlowRow } from '@expo/ui/jetpack-compose';
import { fillMaxSize, size, background, clip, Shapes, padding as paddingModifier, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useMaterialColors } from '@expo/ui/jetpack-compose';
import EmptySearch from '@/ui/illustrations/EmptySearchIllustration';
import { useThemeColors } from '@/theme';

export const WelcomeState = React.memo(() => {
  const colors = useThemeColors();
  
  return (
    <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 16 }} modifiers={[paddingModifier(0, 32, 0, 32)]}>
      <RNHostView matchContents={true}>
        <EmptySearch width={300} height={300} />
      </RNHostView>

      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 12 }} modifiers={[ padding(24, 0, 24, 0)]}>
        <Text textStyle={{ fontFamily: 'Newsreader_600SemiBold', fontSize: 20, textAlign: 'center', lineHeight: 22 }}>
          If the Screenshot exists, we will find it for you.
        </Text>
        
        <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
          You can search for things like:
        </Text>
        <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 4 }}>
            <FlowRow modifiers={[paddingModifier(8, 4, 8, 4)]}>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, fontSize: 13 }}>{`"a `}</Text>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.primary, fontSize: 13 }}>product</Text>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, fontSize: 13 }}>{` you liked on Amazon"`}</Text>
            </FlowRow>
            <FlowRow modifiers={[paddingModifier(8, 4, 8, 4)]}>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, fontSize: 13 }}>{`"a `}</Text>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.primary, fontSize: 13 }}>username</Text>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, fontSize: 13 }}>{` to find Whatsapp chats"`}</Text>
            </FlowRow>
            <FlowRow modifiers={[paddingModifier(8, 4, 8, 4)]}>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, fontSize: 13 }}>{`"some `}</Text>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.primary, fontSize: 13 }}>text</Text>
               <Text textStyle={{ fontFamily: 'Inter_500Medium', color: colors.onSurfaceVariant, fontSize: 13 }}>{` you read in a Medium article"`}</Text>
            </FlowRow>
        </Column>
      </Column>
    </Column>
  );
});