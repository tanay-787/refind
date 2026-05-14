import { useCallback, useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import type { ScreenshotAsset } from '../types';
import { loadScreenshotAssets } from '../utils';

export function useScreenshotLibrary() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<ScreenshotAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await loadScreenshotAssets();
      setAssets(
        items.map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          filename: asset.filename,
          creationTime: asset.creationTime,
          width: asset.width,
          height: asset.height,
        })),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load screenshots.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (permissionResponse?.status === 'granted') {
      void refresh();
    }
  }, [permissionResponse?.status, refresh]);

  const requestAccess = useCallback(async () => {
    const response = await requestPermission();
    if (response.status === 'granted') {
      await refresh();
    }
  }, [refresh, requestPermission]);

  return {
    assets,
    error,
    loading,
    permissionResponse,
    granted: permissionResponse?.status === 'granted',
    denied: permissionResponse != null && permissionResponse.status !== 'granted',
    requestAccess,
    refresh,
  };
}
