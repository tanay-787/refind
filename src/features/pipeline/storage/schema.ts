export const PIPELINE_SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pipeline_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  uri TEXT NOT NULL,
  filename TEXT,
  created_at INTEGER,
  content_hash TEXT,
  width INTEGER,
  height INTEGER,
  album TEXT,
  source TEXT,
  ingested_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS screenshots_content_hash_idx
  ON screenshots(content_hash);

CREATE TABLE IF NOT EXISTS ingestion_queue (
  id TEXT PRIMARY KEY,
  screenshot_id TEXT NOT NULL REFERENCES screenshots(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS ingestion_queue_state_idx
  ON ingestion_queue(state, priority, created_at);

CREATE TABLE IF NOT EXISTS ocr_results (
  screenshot_id TEXT PRIMARY KEY REFERENCES screenshots(id) ON DELETE CASCADE,
  text TEXT,
  blocks_json TEXT,
  language TEXT,
  confidence REAL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS embeddings (
  screenshot_id TEXT PRIMARY KEY REFERENCES screenshots(id) ON DELETE CASCADE,
  embedding BLOB,
  model TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS enrichment (
  screenshot_id TEXT PRIMARY KEY REFERENCES screenshots(id) ON DELETE CASCADE,
  caption TEXT,
  summary TEXT,
  topics_json TEXT,
  entities_json TEXT,
  app_name TEXT,
  screen_type TEXT,
  language TEXT,
  model_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  screenshot_id UNINDEXED,
  ocr_text,
  caption,
  summary,
  topics,
  entities,
  app_name,
  screen_type
);
`;

export const VEC_TABLE_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS embeddings_vec USING vec0(
  embedding float[768],
  screenshot_id text
);
`;
