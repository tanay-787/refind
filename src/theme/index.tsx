import React from 'react';
import { ColorSchemeName } from 'react-native';
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
  const seedColor = typeof options === 'string' ? options : options?.seedColor;
  const colorScheme = typeof options === 'object' ? options?.colorScheme : undefined;

  return useMaterialColors(
    seedColor !== undefined || colorScheme !== undefined
      ? { seedColor, colorScheme }
      : undefined
  );
};