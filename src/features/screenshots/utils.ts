import * as MediaLibrary from 'expo-media-library';

import { SCREENSHOT_NAME_RE } from './constants';

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

  if (screenshotAlbums.length > 0) {
    const albumAssets = await Promise.all(
      screenshotAlbums.map(async (album) => {
        const page = await MediaLibrary.getAssetsAsync({
          album,
          first: 100,
          mediaType: [MediaLibrary.MediaType.photo],
          sortBy: [MediaLibrary.SortBy.creationTime],
        });

        return page.assets;
      }),
    );

    return uniqueAssets(albumAssets.flat()).sort(
      (left, right) => right.creationTime - left.creationTime,
    );
  }

  const page = await MediaLibrary.getAssetsAsync({
    first: 200,
    mediaType: [MediaLibrary.MediaType.photo],
    sortBy: [MediaLibrary.SortBy.creationTime],
  });

  return page.assets.filter(isScreenshotAsset).sort((left, right) => right.creationTime - left.creationTime);
}

export function isWithinRange(creationTime: number, filter: 'all' | 'today' | 'week' | 'month') {
  if (filter === 'all') return true;

  const age = Date.now() - creationTime * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  if (filter === 'today') return age < oneDay;
  if (filter === 'week') return age < 7 * oneDay;
  return age < 30 * oneDay;
}
