import React from 'react';
import { SymbolView, SymbolViewProps, AndroidSymbol } from 'expo-symbols';
import androidThin from 'expo-symbols/androidWeights/thin';
import { useThemeColors } from '@/theme';

export interface IconViewProps extends Omit<SymbolViewProps, 'name' | 'weight'> {
  name: AndroidSymbol;
  /**
   * @deprecated No longer needed. All components now render directly in pure React Native.
   */
  inNative?: boolean;
}

export function IconView({ 
  name, 
  size = 28, 
  tintColor, 
  inNative: _inNative,
  ...rest 
}: IconViewProps) {
  const colors = useThemeColors();
  
  return (
    <SymbolView
      name={{ android: name }}
      size={size}
      tintColor={tintColor ?? colors.onSurface}
      weight={{ android: androidThin } as any}
      {...rest}
    />
  );
}
