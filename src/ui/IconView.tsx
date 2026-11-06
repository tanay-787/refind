import React from 'react';
import { SymbolView, SymbolViewProps, AndroidSymbol } from 'expo-symbols';
import androidThin from 'expo-symbols/androidWeights/thin';
import androidLight from 'expo-symbols/androidWeights/light';
import androidRegular from 'expo-symbols/androidWeights/regular';
import androidMedium from 'expo-symbols/androidWeights/medium';
import androidSemiBold from 'expo-symbols/androidWeights/semiBold';
import androidBold from 'expo-symbols/androidWeights/bold';
import { useThemeColors } from '@/theme';

const WEIGHT_MAP = {
  thin: androidThin,
  light: androidLight,
  regular: androidRegular,
  medium: androidMedium,
  semiBold: androidSemiBold,
  bold: androidBold,
} as const;

export type IconWeight = keyof typeof WEIGHT_MAP;

export interface IconViewProps extends Omit<SymbolViewProps, 'name' | 'weight'> {
  name: AndroidSymbol;
  weight?: IconWeight;
  /**
   * @deprecated No longer needed. All components now render directly in pure React Native.
   */
  inNative?: boolean;
}

export function IconView({ 
  name, 
  size = 28, 
  weight = 'thin',
  tintColor, 
  inNative: _inNative,
  ...rest 
}: IconViewProps) {
  const colors = useThemeColors();
  const selectedWeight = WEIGHT_MAP[weight] ?? androidThin;
  
  return (
    <SymbolView
      name={{ android: name }}
      size={size}
      tintColor={tintColor ?? colors.onSurface}
      weight={{ android: selectedWeight } as any}
      {...rest}
    />
  );
}
