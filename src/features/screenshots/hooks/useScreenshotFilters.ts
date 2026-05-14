import { useMemo, useState } from 'react';

import { TIME_FILTERS } from '../constants';
import type { ScreenshotAsset, TimeFilterKey } from '../types';
import { isWithinRange } from '../utils';

export function useScreenshotFilters(assets: ScreenshotAsset[]) {
  const [timeFilter, setTimeFilter] = useState<TimeFilterKey>('all');

  const visibleAssets = useMemo(
    () => assets.filter((item) => isWithinRange(item.creationTime, timeFilter)),
    [assets, timeFilter],
  );

  return {
    timeFilter,
    setTimeFilter,
    timeFilters: TIME_FILTERS,
    visibleAssets,
  };
}
