import * as MediaLibrary from 'expo-media-library';

import { loadScreenshotAssets, watchScreenshotAssets } from '@/features/screenshots/utils';

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
