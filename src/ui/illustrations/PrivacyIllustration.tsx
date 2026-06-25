import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { Theme } from '@/theme';

interface IllustrationProps {
  theme: Theme;
  size?: number;
}

export const PrivacyIllustration = React.memo(({ theme, size = 64 }: IllustrationProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Background abstract shapes */}
      <Circle cx="32" cy="32" r="28" fill={theme.primary} fillOpacity={0.05} />
      
      {/* Device outline */}
      <Rect x="14" y="8" width="36" height="48" rx="6" fill={theme.primary} fillOpacity={0.1} stroke={theme.primary} strokeWidth="2.5" />
      
      {/* Screen inner area */}
      <Rect x="18" y="14" width="28" height="36" rx="2" fill={theme.primary} fillOpacity={0.05} />
      
      {/* Home button / Indicator */}
      <Rect x="28" y="52" width="8" height="2" rx="1" fill={theme.primary} fillOpacity={0.5} />
      
      {/* Shield */}
      <Path 
        d="M32 18 L46 23 V36 C46 45 32 52 32 52 C32 52 18 45 18 36 V23 L32 18 Z" 
        fill={theme.secondaryContainer} 
        stroke={theme.primary} 
        strokeWidth="2.5" 
        strokeLinejoin="round" 
      />
      
      {/* Checkmark inside shield */}
      <Path 
        d="M24 35 L29 40 L40 28" 
        stroke={theme.primary} 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </Svg>
  );
});
