import React from 'react';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import androidThin from 'expo-symbols/androidWeights/thin';
import { RNHostView } from '@expo/ui/jetpack-compose';
import { useBrandColors } from '@/theme';

export interface IconViewProps extends Omit<SymbolViewProps, 'name' | 'weight'> {
  name: any; // We use 'any' here since we know it's AndroidSymbol but we avoid deep imports
  inNative?: boolean;
}

export function IconView({ 
  name, 
  size = 28, 
  tintColor, 
  inNative = false,
  ...rest 
}: IconViewProps) {
  const colors = useBrandColors();
  
  const symbol = (
    <SymbolView
      name={{ android: name }}
      size={size}
      tintColor={tintColor ?? colors.onSurface}
      weight={{ android: androidThin } as any}
      {...rest}
    />
  );

  if (inNative) {
    return <RNHostView matchContents={true}>{symbol}</RNHostView>;
  }

  return symbol;
}
