import * as MediaLibrary from 'expo-media-library';
import { File } from 'expo-file-system';
import { eq, and } from 'drizzle-orm';

import {
  loadJobJournalScreenshotSource,
  watchJobJournalScreenshotSource,
} from './01-source';
import { getDrizzleDb } from './storage/database';
import { jobJournalJobs, stageExecutions } from './storage/drizzle-schema';
import type { JobJournalStage } from './types';

const INITIAL_STAGE: JobJournalStage = 'metadata';

export type JobJournalIntakeResult = {
  totalAssets: number;
  createdJobs: number;
  existingJobs: number;
  createdExecutions: number;
};

function getJobId(asset: MediaLibrary.Asset) {
  return `job_${asset.id}`;
}

async function getImageHash(asset: MediaLibrary.Asset) {
  const file = new File(asset.uri);
  const info = await file.info({ md5: true });
  if (info.exists && info.md5) {
    return { hash: `md5:${info.md5}`, isReliable: true };
  }

  const fallbackHash = [
    asset.id,
    asset.uri,
    asset.filename ?? '',
    asset.creationTime ?? 0,
    asset.width ?? 0,
    asset.height ?? 0,
  ].join('|');
  return { hash: `fallback:${fallbackHash}`, isReliable: false };
}

function getStageExecutionId(jobId: string, stage: JobJournalStage) {
  return `${jobId}_${stage}`;
}

async function seedJobForAsset(asset: MediaLibrary.Asset, vectorRequired: boolean = false): Promise<{
  createdJob: boolean;
  createdExecution: boolean;
}> {
  const db = await getDrizzleDb();
  const now = new Date();
  const jobId = getJobId(asset);
  const hashResult = await getImageHash(asset);
  const imageHash = hashResult.hash;
  const imageUri = asset.uri;

  // 1. Try to find existing job
  const existingJob = await db.query.jobJournalJobs.findFirst({
    where: hashResult.isReliable 
      ? eq(jobJournalJobs.imageHash, imageHash)
      : eq(jobJournalJobs.id, jobId)
  });

  if (existingJob) {
    // Update vector requirement if needed
    if (vectorRequired && !existingJob.vectorRequired) {
      await db.update(jobJournalJobs)
        .set({ vectorRequired: true, updatedAt: now })
        .where(eq(jobJournalJobs.id, existingJob.id));
    }

    const stageExecutionId = getStageExecutionId(existingJob.id, INITIAL_STAGE);
    const existingExecution = await db.query.stageExecutions.findFirst({
      where: eq(stageExecutions.id, stageExecutionId)
    });

    if (!existingExecution) {
      await db.insert(stageExecutions).values({
        id: stageExecutionId,
        jobId: existingJob.id,
        stage: INITIAL_STAGE,
        attempt: 0,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      return { createdJob: false, createdExecution: true };
    }

    return { createdJob: false, createdExecution: false };
  }

  // 2. Create new job
  await db.insert(jobJournalJobs).values({
    id: jobId,
    imageUri,
    imageHash,
    status: 'pending',
    vectorRequired,
    createdAt: now,
    updatedAt: now,
  });

  const stageExecutionId = getStageExecutionId(jobId, INITIAL_STAGE);
  await db.insert(stageExecutions).values({
    id: stageExecutionId,
    jobId,
    stage: INITIAL_STAGE,
    attempt: 0,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  return { createdJob: true, createdExecution: true };
}

export async function ingestJobJournalScreenshots(assets: MediaLibrary.Asset[] = [], options?: { vectorRequired?: boolean }) {
  const nextAssets = assets.length > 0 ? assets : await loadJobJournalScreenshotSource();
  let createdJobs = 0;
  let existingJobs = 0;
  let createdExecutions = 0;
  const vectorRequired = options?.vectorRequired ?? false;

  for (const asset of nextAssets) {
    const result = await seedJobForAsset(asset, vectorRequired);
    if (result.createdJob) createdJobs += 1;
    else existingJobs += 1;
    if (result.createdExecution) createdExecutions += 1;
  }

  return {
    totalAssets: nextAssets.length,
    createdJobs,
    existingJobs,
    createdExecutions,
  };
}

export async function syncJobJournalScreenshots() {
  return ingestJobJournalScreenshots();
}

/**
 * Keeps the job journal in sync with the live screenshot source.
 */
export async function watchJobJournalIntake(
  onChange: (result: JobJournalIntakeResult) => void | Promise<void>,
  onError: (cause: unknown) => void,
) {
  return watchJobJournalScreenshotSource(
    async (assets) => {
      const result = await ingestJobJournalScreenshots(assets);
      await onChange(result);
    },
    onError,
  );
}
