import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { MODEL_DOWNLOAD_TASK, resumeModelDownload } from './modelDownloadStore';

TaskManager.defineTask(MODEL_DOWNLOAD_TASK, async () => {
  try {
    await resumeModelDownload();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
