# Job Journal Module Structure

## Execution Flow (Outer Numbering)

```
01-source.ts          → Discover screenshots from MediaStore
02-intake.ts          → Ingest & dedupe (with metadata extraction) → initialize jobs
03-executor.ts        → Manage execution state (claim/complete/fail/recover)
04-stages.ts          → Stage exports (DAG registry)
05-runner.ts          → Orchestrate stage execution and timeouts
background-tasks.ts   → Foreground service & background sync scheduling
```

## Stage DAG Flow (Inner Numbering within `stages/`)

```
02-ocr.stage.ts             → Extract text & bounds via native expo-mlkit-ocr
03-ocr_postprocess.stage.ts → Clean text, detect script, normalize whitespace
05-keywords.stage.ts        → Extract TF-based keywords & expand alphanumeric tokens
06-index_fts.stage.ts       → Index text into SQLite FTS5 standard & Trigram tables
```

## Key Concepts

- **Dependency DAG**: `ocr` → `ocr_postprocess` → `keywords` → `index_fts` (waits for both `ocr_postprocess` and `keywords`).
- **Instant Search Path**: intake (metadata) → ocr → ocr_postprocess → keywords → index_fts.
- **Resumable**: Stages can fail and be retried independently; leases prevent concurrent worker collisions.
- **Durable**: All state persists in SQLite `job_journal_*` tables; app process kills or crashes don't lose progress.
