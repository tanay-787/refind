import { useCallback, useEffect, useState } from 'react';

export function useScreenshotViewer(itemCount: number) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(itemCount - 1, 0)));
  }, [itemCount]);

  const openViewer = useCallback((index: number) => {
    setActiveIndex(index);
    setViewerVisible(true);
  }, []);

  const closeViewer = useCallback(() => setViewerVisible(false), []);

  const syncViewerIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
    },
    [],
  );

  return {
    activeIndex,
    closeViewer,
    openViewer,
    setActiveIndex: syncViewerIndex,
    viewerVisible,
  };
}
