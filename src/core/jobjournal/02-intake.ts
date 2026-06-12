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

export async function ingestJobJournalScreenshots(assets: MediaLibrary.Asset[] = []) {
  const nextAssets = assets.length > 0 ? assets : await loadJobJournalScreenshotSource();
  const db = await getDrizzleDb();
  const now = new Date();

  let createdJobs = 0;
  let existingJobs = 0;
  let createdExecutions = 0;

  // Use a single transaction for high-efficiency batch intake
  await db.transaction(async (tx) => {
    for (const asset of nextAssets) {
      const jobId = getJobId(asset);
      const hashResult = await getImageHash(asset);
      const imageHash = hashResult.hash;
      
      // 1. Check for existing job
      const existingJob = await tx.query.jobJournalJobs.findFirst({
        where: hashResult.isReliable 
          ? eq(jobJournalJobs.imageHash, imageHash)
          : eq(jobJournalJobs.id, jobId)
      });

      if (existingJob) {
        existingJobs += 1;
        
        const stageExecutionId = getStageExecutionId(existingJob.id, INITIAL_STAGE);
        const existingExecution = await tx.query.stageExecutions.findFirst({
          where: eq(stageExecutions.id, stageExecutionId),
          columns: { id: true }
        });

        if (!existingExecution) {
          await tx.insert(stageExecutions).values({
            id: stageExecutionId,
            jobId: existingJob.id,
            stage: INITIAL_STAGE,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          });
          createdExecutions += 1;
        }
        continue;
      }

      // 2. New Job
      await tx.insert(jobJournalJobs).values({
        id: jobId,
        imageUri: asset.uri,
        imageHash,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      createdJobs += 1;

      const stageExecutionId = getStageExecutionId(jobId, INITIAL_STAGE);
      await tx.insert(stageExecutions).values({
        id: stageExecutionId,
        jobId,
        stage: INITIAL_STAGE,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      createdExecutions += 1;
    }
  });

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
