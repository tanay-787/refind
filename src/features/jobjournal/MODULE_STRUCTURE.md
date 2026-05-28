# Job Journal Module Structure

## Execution Flow (Outer Numbering)

```
01-source.ts          → Load live screenshot source
02-intake.ts          → Ingest & dedupe → create jobs
03-executor.ts        → Manage execution state (claim/complete/fail/recover)
04-runner.ts          → Orchestrate stage execution
05-stages/            → Individual stage implementations (DAG order)
06-modelManager.ts    → Model lifecycle (download/load/ready)
07-modelMonitor.ts    → Monitor model state, auto-retry waiting jobs
08-backgroundTasks.ts → Schedule background work
```

## Stage DAG Flow (Inner Numbering within `stages/`)

```
01-metadata.stage.ts        → Extract image metadata
02-ocr.stage.ts             → Extract text via MLKit
03-ocr_postprocess.stage.ts → Clean text, detect language
04-embedding.stage.ts       → Generate SigLIP embeddings (image + text)
05-keywords.stage.ts        → Extract TF-based keywords + entities
06-index.stage.ts           → Index into FTS5 + vector search
```

## Key Concepts

- **Linear DAG**: Each job progresses through stages sequentially.
- **Resumable**: Stages can fail and be retried; leases prevent concurrent execution.
- **Model-aware**: Stages return `waiting_for_model` if SigLIP is not ready (idempotent retry).
- **Durable**: All state persists in job_journal tables; crashes don't lose work.
