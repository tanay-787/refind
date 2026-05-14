import type { TimeFilterKey } from './types';

export const SCREENSHOT_NAME_RE = /screenshot|screen shot|capture/i;

export const TIME_FILTERS: { key: TimeFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];
