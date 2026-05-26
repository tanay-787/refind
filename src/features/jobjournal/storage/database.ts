import * as SQLite from 'expo-sqlite';

import { JOB_JOURNAL_SCHEMA } from './schema';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(JOB_JOURNAL_SCHEMA);
}

export async function initializeJobJournalDatabase() {
  const db = await getJobJournalDatabase();
  await initializeDatabase(db);
}

export async function getJobJournalDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('ss-search.db');
      await initializeDatabase(db);
      return db;
    })();
  }

  return databasePromise;
}
