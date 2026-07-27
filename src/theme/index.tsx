import React from 'react';
import { useColorScheme } from 'react-native';
import { Host, useMaterialColors } from '@expo/ui/jetpack-compose';

export const DEFAULT_SEED_COLOR = '#208AEF';

export type ThemedHostProps = React.ComponentProps<typeof Host> & {
  seedColor?: string;
};

export function ThemedHost({ 
  children, 
  seedColor = DEFAULT_SEED_COLOR, 
  ...props 
}: ThemedHostProps) {
  return (
    <Host seedColor={seedColor} {...props}>
      {children}
    </Host>
  );
}

export const useThemeColors = (seedColor: string = DEFAULT_SEED_COLOR) => {
  return useMaterialColors({ seedColor });
};

export const useTheme = (seedColor: string = DEFAULT_SEED_COLOR) => {
  const colors = useThemeColors(seedColor);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    ...colors,
    isDark,
  };
};