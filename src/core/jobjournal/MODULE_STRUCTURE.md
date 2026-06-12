# Job Journal Module Structure

## Execution Flow (Outer Numbering)

```
01-source.ts          → Load live screenshot source
02-intake.ts          → Ingest & dedupe → create jobs
03-executor.ts        → Manage execution state (claim/complete/fail/recover)
04-stages.ts          → Stage exports (DAG order)
05-runner.ts          → Orchestrate stage execution
06-backgroundTasks.ts → Schedule background work
```

## Stage DAG Flow (Inner Numbering within `stages/`)

```
01-metadata.stage.ts        → Extract image metadata
02-ocr.stage.ts             → Extract text via MLKit
03-ocr_postprocess.stage.ts → Clean text, detect language
05-keywords.stage.ts        → Extract TF-based keywords + entities
06-index_fts.stage.ts       → Index text into FTS5 + Trigram (Instant Search)
```

## Key Concepts

- **Dependency DAG**: `keywords` depends on `ocr_postprocess`; `index_fts` waits for keywords and ocr_postprocess.
- **Instant Search Path**: metadata → ocr → ocr_postprocess → keywords → index_fts.
- **Resumable**: Stages can fail and be retried; leases prevent concurrent execution.
- **Durable**: All state persists in job_journal tables; crashes don't lose work.
