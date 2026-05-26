import { useMemo, useState } from 'react';

import { SCREENSHOT_STATUS_FILTERS } from '../constants';
import type { ScreenshotAsset, ScreenshotStatusFilterKey } from '../types';

export function useScreenshotFilters(assets: ScreenshotAsset[]) {
  const [statusFilter, setStatusFilter] = useState<ScreenshotStatusFilterKey>('all');

  const visibleAssets = useMemo(() => {
    if (statusFilter === 'all') return assets;
    return assets.filter((item) => item.pipelineState === statusFilter);
  }, [assets, statusFilter]);

  const statusFilters = useMemo(
    () =>
      SCREENSHOT_STATUS_FILTERS.map((filter) => ({
        ...filter,
        count:
          filter.key === 'all'
            ? assets.length
            : assets.filter((item) => item.pipelineState === filter.key).length,
      })),
    [assets],
  );

  return {
    statusFilter,
    setStatusFilter,
    statusFilters,
    visibleAssets,
  };
}
