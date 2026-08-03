import React from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
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

export type ThemeColorsOptions = {
  seedColor?: string;
  colorScheme?: ColorSchemeName;
};

export const useThemeColors = (options?: string | ThemeColorsOptions) => {
  if (!options) {
    return useMaterialColors();
  }
  if (typeof options === 'string') {
    return useMaterialColors({ seedColor: options });
  }
  return useMaterialColors({
    seedColor: options.seedColor,
    colorScheme: options.colorScheme,
  });
};