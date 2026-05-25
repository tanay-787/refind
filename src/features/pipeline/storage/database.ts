import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { PIPELINE_SCHEMA, VEC_TABLE_SQL } from './schema';

type VecStatus = {
  available: boolean;
  error: string | null;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let vecStatus: VecStatus = { available: false, error: null };

export function getVecStatus() {
  return vecStatus;
}

async function loadVecExtension(db: SQLite.SQLiteDatabase) {
  if (Platform.OS === 'web') {
    vecStatus = { available: false, error: 'sqlite-vec is not supported on web.' };
    return;
  }

  const extension = SQLite.bundledExtensions?.['sqlite-vec'];
  if (!extension) {
    vecStatus = { available: false, error: 'sqlite-vec extension is not bundled.' };
    return;
  }

  try {
    await db.loadExtensionAsync(extension.libPath, extension.entryPoint);
    vecStatus = { available: true, error: null };
  } catch (cause) {
    vecStatus = {
      available: false,
      error: cause instanceof Error ? cause.message : 'Failed to load sqlite-vec extension.',
    };
  }
}

async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(PIPELINE_SCHEMA);
  await loadVecExtension(db);
  if (vecStatus.available) {
    await db.execAsync(VEC_TABLE_SQL);
  }
}

export async function initializePipelineDatabase() {
  const db = await getPipelineDatabase();
  // ensure initialization has run
  await initializeDatabase(db);
}

export async function getPipelineDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('ss-search.db');
      await initializeDatabase(db);
      return db;
    })();
  }

  return databasePromise;
}
