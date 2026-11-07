import { createContext, useContext } from 'react';
import type { IRadialChartContext } from './types';

export const RadialChartContext = createContext<IRadialChartContext | null>(null);

export const useRadialChart = (part: string): IRadialChartContext => {
  const context = useContext(RadialChartContext);
  if (!context) {
    throw new Error(`RadialChart.${part} must be rendered inside <RadialChart.Root>.`);
  }
  return context;
};
