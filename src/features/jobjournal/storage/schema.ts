export const JOB_JOURNAL_SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS job_journal_jobs (
  id TEXT PRIMARY KEY,
  image_uri TEXT NOT NULL,
  image_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS job_journal_stage_executions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  lease_until INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS job_journal_stage_executions_job_stage_idx
  ON job_journal_stage_executions(job_id, stage);

CREATE TABLE IF NOT EXISTS job_journal_checkpoints (
  job_id TEXT NOT NULL REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  output_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (job_id, stage)
);

CREATE TABLE IF NOT EXISTS job_journal_metadata (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  file_exists INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS job_journal_ocr_results (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  text TEXT,
  blocks_json TEXT,
  language TEXT,
  confidence REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS job_journal_ocr_postprocessed (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  text TEXT,
  blocks_json TEXT,
  language TEXT,
  block_count INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS job_journal_embeddings (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  modality TEXT NOT NULL,
  vector BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS job_journal_embeddings_job_modality_idx
  ON job_journal_embeddings(job_id, modality);

CREATE TABLE IF NOT EXISTS job_journal_keywords (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  type TEXT NOT NULL,
  score REAL NOT NULL,
  positions_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS job_journal_keywords_job_keyword_idx
  ON job_journal_keywords(job_id, keyword);
`;
