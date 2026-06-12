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

CREATE TABLE IF NOT EXISTS stage_executions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  lease_until INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_error TEXT,
  last_error_code TEXT,
  last_error_message TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS stage_executions_job_stage_idx
  ON stage_executions(job_id, stage);

CREATE INDEX IF NOT EXISTS stage_executions_status_created_idx
  ON stage_executions(status, created_at);

CREATE INDEX IF NOT EXISTS stage_executions_running_lease_idx
  ON stage_executions(status, lease_until);

CREATE TABLE IF NOT EXISTS stage_checkpoints (
  job_id TEXT NOT NULL REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  output_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (job_id, stage)
);

CREATE TABLE IF NOT EXISTS metadata_stage_results (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  file_exists INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ocr_stage_results (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  text TEXT,
  blocks_json TEXT,
  language TEXT,
  confidence REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ocr_postprocess_stage_results (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  text TEXT,
  canonical_text TEXT,
  blocks_json TEXT,
  language TEXT,
  block_count INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS search_readiness (
  job_id TEXT PRIMARY KEY REFERENCES job_journal_jobs(id) ON DELETE CASCADE,
  fts_ready INTEGER NOT NULL DEFAULT 0,
  keywords_ready INTEGER NOT NULL DEFAULT 0,
  indexed_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS screenshot_search_index USING fts5(
  job_id,
  ocr_text,
  keywords
);

CREATE VIRTUAL TABLE IF NOT EXISTS screenshot_search_trigram USING fts5(
  job_id,
  ocr_text,
  keywords,
  tokenize='trigram'
);
`;

export const JOB_JOURNAL_VEC_SCHEMA = ``;
