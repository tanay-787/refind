import React from 'react';
import Svg, { Rect, Circle, Path, G } from 'react-native-svg';
import { useBrandColors } from '@/theme';

interface IllustrationProps {
  size?: number;
}

export const SearchIllustration = React.memo(({ size = 64 }: IllustrationProps) => {
  const colors = useBrandColors();

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Background abstract shapes */}
      <Circle cx="32" cy="32" r="28" fill={colors.primary} fillOpacity={0.05} />
      
      {/* Frame representing a screenshot */}
      <Rect x="12" y="8" width="32" height="44" rx="4" fill={colors.primary} fillOpacity={0.15} stroke={colors.primary} strokeWidth="2.5" />
      
      {/* Abstract text lines inside screenshot */}
      <Rect x="18" y="16" width="20" height="2" rx="1" fill={colors.primary} fillOpacity={0.5} />
      <Rect x="18" y="22" width="14" height="2" rx="1" fill={colors.primary} fillOpacity={0.5} />
      
      {/* Abstract image block inside screenshot */}
      <Rect x="18" y="28" width="20" height="16" rx="2" fill={colors.primary} fillOpacity={0.2} />
      
      {/* Magnifying glass */}
      <G transform="translate(4, 4)">
        <Circle cx="36" cy="36" r="14" fill={colors.secondaryContainer} stroke={colors.primary} strokeWidth="2.5" />
        <Path d="M46 46L56 56" stroke={colors.primary} strokeWidth="3.5" strokeLinecap="round" />
        <Circle cx="36" cy="36" r="6" fill={colors.primary} fillOpacity={0.2} />
      </G>
    </Svg>
  );
});
