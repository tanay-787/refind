import * as MediaLibrary from 'expo-media-library/legacy';

import { loadScreenshotAssets, watchScreenshotAssets } from '@/core/screenshots/utils';

export type JobJournalScreenshotSource = MediaLibrary.Asset;

export async function loadJobJournalScreenshotSource() {
  return loadScreenshotAssets();
}

export async function watchJobJournalScreenshotSource(
  onChange: (assets: JobJournalScreenshotSource[]) => void | Promise<void>,
  onError: (cause: unknown) => void,
) {
  return watchScreenshotAssets(onChange, onError);
}
