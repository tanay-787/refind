import React, { createContext, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme, View, ViewProps } from 'react-native';
import {
  getMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';

export const DEFAULT_SEED_COLOR = '#208AEF';

export type ThemeContextValue = {
  seedColor: string;
  colors: MaterialColors;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemedHostProps extends ViewProps {
  children?: React.ReactNode;
  seedColor?: string;
}

export function ThemedHost({
  children,
  seedColor = DEFAULT_SEED_COLOR,
  style,
  ...props
}: ThemedHostProps) {
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme === 'dark' ? 'dark' : 'light';

  const colors = useMemo(() => {
    return getMaterialColors({
      scheme: resolvedScheme,
      seedColor,
    });
  }, [resolvedScheme, seedColor]);

  const contextValue = useMemo(
    () => ({
      seedColor,
      colors,
    }),
    [seedColor, colors]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <View style={style} {...props}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export type ThemeColorsOptions = {
  seedColor?: string;
  colorScheme?: ColorSchemeName;
};

export const useThemeColors = (options?: string | ThemeColorsOptions): MaterialColors => {
  const context = useContext(ThemeContext);
  const systemScheme = useColorScheme();

  const customSeedColor = typeof options === 'string' ? options : options?.seedColor;
  const customColorScheme = typeof options === 'object' ? options?.colorScheme : undefined;

  const seedColor = customSeedColor ?? context?.seedColor ?? DEFAULT_SEED_COLOR;
  const resolvedScheme =
    customColorScheme === 'light' || customColorScheme === 'dark'
      ? customColorScheme
      : systemScheme === 'dark'
        ? 'dark'
        : 'light';

  if (!customSeedColor && !customColorScheme && context?.colors) {
    return context.colors;
  }

  return getMaterialColors({
    scheme: resolvedScheme,
    seedColor,
  });
};
