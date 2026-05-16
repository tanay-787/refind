import { useEffect, useMemo, useState } from 'react';

import {
  cancelModelDownload,
  clearDownloadedModel,
  dismissModelDownloadPrompt,
  getModelDownloadState,
  initializeModelDownloadState,
  isModelDownloaded,
  pauseModelDownload,
  resumeModelDownload,
  startModelDownload,
  subscribeModelDownloadState,
} from '../download/modelDownloadStore';

export function useGemmaModelDownload() {
  const [state, setState] = useState(getModelDownloadState());

  useEffect(() => {
    void initializeModelDownloadState();
    const unsubscribe = subscribeModelDownloadState(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const actions = useMemo(
    () => ({
      startDownload: () => startModelDownload(),
      pauseDownload: () => pauseModelDownload(),
      resumeDownload: () => resumeModelDownload(),
      cancelDownload: () => cancelModelDownload(),
      clearDownloadedModel: () => clearDownloadedModel(),
      dismissPrompt: () => dismissModelDownloadPrompt(),
    }),
    [],
  );

  return {
    ...state,
    ...actions,
    fileUri: state.fileUri,
    downloaded: isModelDownloaded(),
  };
}
