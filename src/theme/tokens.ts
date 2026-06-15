export const tokens = {
  light: {
    primary: '#0057FF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D8E2FF',
    onPrimaryContainer: '#001A41',
    
    secondary: '#565E71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DAE2F9',
    onSecondaryContainer: '#131C2C',
    
    tertiary: '#705575',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FAD8FD',
    onTertiaryContainer: '#28132E',
    
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    background: '#FDFBFF',
    onBackground: '#1B1B1F',
    
    surface: '#FDFBFF',
    onSurface: '#1B1B1F',
    surfaceVariant: '#E1E2EC',
    onSurfaceVariant: '#44474F',
    
    outline: '#74777F',
    outlineVariant: '#C4C6D0',
    
    inverseSurface: '#303034',
    inverseOnSurface: '#F2F0F4',
    inversePrimary: '#ADC6FF',
    
    shadow: '#000000',
    surfaceTint: '#0057FF',
  },
  dark: {
    primary: '#ADC6FF',
    onPrimary: '#002E69',
    primaryContainer: '#004290',
    onPrimaryContainer: '#D8E2FF',
    
    secondary: '#BFC6DA',
    onSecondary: '#283041',
    secondaryContainer: '#3E4759',
    onSecondaryContainer: '#DAE2F9',
    
    tertiary: '#DDBCE0',
    onTertiary: '#3F2844',
    tertiaryContainer: '#573E5C',
    onTertiaryContainer: '#FAD8FD',
    
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    
    background: '#1B1B1F',
    onBackground: '#E3E2E6',
    
    surface: '#1B1B1F',
    onSurface: '#E3E2E6',
    surfaceVariant: '#44474F',
    onSurfaceVariant: '#C4C6D0',
    
    outline: '#8E9099',
    outlineVariant: '#44474F',
    
    inverseSurface: '#E3E2E6',
    inverseOnSurface: '#303034',
    inversePrimary: '#0057FF',
    
    shadow: '#000000',
    surfaceTint: '#ADC6FF',
  }
};

export type ColorTokens = typeof tokens.light;
