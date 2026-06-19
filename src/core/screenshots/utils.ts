import * as MediaLibrary from 'expo-media-library/legacy';

import { SCREENSHOT_NAME_RE } from './constants';

const DEV_SCREENSHOT_LIMIT = 15;

export function isScreenshotAsset(asset: MediaLibrary.Asset) {
  return SCREENSHOT_NAME_RE.test(asset.filename);
}

export function uniqueAssets(assets: MediaLibrary.Asset[]) {
  const seen = new Set<string>();
  const next: MediaLibrary.Asset[] = [];

  for (const asset of assets) {
    if (seen.has(asset.id)) continue;
    seen.add(asset.id);
    next.push(asset);
  }

  return next;
}

export async function loadScreenshotAssets() {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  const screenshotAlbums = albums.filter((album) => SCREENSHOT_NAME_RE.test(album.title));

  if (screenshotAlbums.length === 0) {
    return [];
  }

  const albumAssets = await Promise.all(
    screenshotAlbums.map(async (album) => {
      const allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let after: string | undefined = undefined;
      const pageSize = 500; // Optimized page size for SQLite / React Native IPC bounds

      while (hasNextPage) {
        const page = await MediaLibrary.getAssetsAsync({
          album,
          first: __DEV__ ? Math.min(DEV_SCREENSHOT_LIMIT, pageSize) : pageSize,
          mediaType: [MediaLibrary.MediaType.photo],
          sortBy: [MediaLibrary.SortBy.creationTime],
          after,
        });

        allAssets.push(...page.assets);
        after = page.endCursor;
        hasNextPage = page.hasNextPage && !(__DEV__ && allAssets.length >= DEV_SCREENSHOT_LIMIT);
      }

      return allAssets;
    }),
  );

  const assets = uniqueAssets(albumAssets.flat()).sort((left, right) => right.creationTime - left.creationTime);

  return __DEV__ ? assets.slice(0, DEV_SCREENSHOT_LIMIT) : assets;
}

/**
 * Watches the device media library and refreshes the screenshot snapshot on change.
 */
export async function watchScreenshotAssets(
  onChange: (assets: MediaLibrary.Asset[]) => void | Promise<void>,
  onError: (cause: unknown) => void,
) {
  await onChange(await loadScreenshotAssets());

  const subscription = MediaLibrary.addListener(() => {
    void (async () => {
      try {
        await onChange(await loadScreenshotAssets());
      } catch (cause) {
        onError(cause);
      }
    })();
  });

  return () => subscription.remove();
}

export function isWithinRange(creationTime: number, filter: 'all' | 'today' | 'week' | 'month') {
  if (filter === 'all') return true;

  const age = Date.now() - creationTime * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  if (filter === 'today') return age < oneDay;
  if (filter === 'week') return age < 7 * oneDay;
  return age < 30 * oneDay;
}
