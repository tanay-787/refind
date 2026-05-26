import type { ScreenshotStatusFilterKey } from './types';

export const SCREENSHOT_NAME_RE = /screenshot|screen shot|capture/i;

export const SCREENSHOT_STATUS_FILTERS: { key: ScreenshotStatusFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'queued', label: 'Queued' },
  { key: 'working', label: 'Working' },
  { key: 'indexed', label: 'Indexed' },
  { key: 'error', label: 'Error' },
];
