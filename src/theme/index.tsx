import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { tokens } from './tokens';

// Define the shape of our theme
type Theme = typeof tokens.light & {
  isDark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Memoize the theme object to prevent unnecessary re-renders
  const theme = useMemo(() => {
    const baseTokens = isDark ? tokens.dark : tokens.light;
    return {
      ...baseTokens,
      isDark,
    };
  }, [isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
