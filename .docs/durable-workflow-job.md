For your screenshot-search pipeline, I would not think of it as a traditional queue.

I would think of it as a **durable execution journal with idempotent stages**.

The durable workflow literature has largely converged on a few principles:

1. Every unit of work has a stable identity.
2. Every stage commits its result atomically.
3. Recovery never re-executes a committed stage.
4. Side effects are isolated behind idempotency boundaries.
5. The system replays state rather than recomputing everything. ([durable-workflow.com][1])

For an on-device screenshot pipeline, this maps almost perfectly.

---

# Your pipeline

Assume:

```text
Screenshot Captured
        ↓
Image Metadata
        ↓
OCR
        ↓
OCR Postprocess
        ↓
SigLIP2 Embedding
        ↓
Keyword Extraction
        ↓
Vector Index Insert
        ↓
Searchable
```

Each box becomes a durable stage.

---

# Core entity: ScreenshotJob

Instead of queues of tasks, store a single durable job.

```ts
type ScreenshotJob = {
  id: string

  imageUri: string
  imageHash: string

  createdAt: number

  state: JobState

  checkpoints: {
    metadata?: MetadataCheckpoint
    ocr?: OCRCheckpoint
    embedding?: EmbeddingCheckpoint
    index?: IndexCheckpoint
  }
}
```

Think:

```text
One screenshot
=
One workflow
```

not

```text
One screenshot
=
Many queue items
```

---

# Use content hashes

The paper you linked is focused on durable execution concepts.

For screenshots, the strongest idempotency key is:

```text
SHA256(image bytes)
```

Example:

```text
9f3f2...
```

If same image enters pipeline twice:

```text
job already exists
```

No work performed.

---

# Checkpoint table

SQLite is enough.

```sql
CREATE TABLE screenshot_jobs (
    id TEXT PRIMARY KEY,
    image_hash TEXT UNIQUE,

    stage TEXT,

    created_at INTEGER,
    updated_at INTEGER
);
```

And:

```sql
CREATE TABLE stage_results (
    job_id TEXT,
    stage_name TEXT,

    status TEXT,

    output_path TEXT,

    started_at INTEGER,
    completed_at INTEGER,

    PRIMARY KEY(job_id, stage_name)
);
```

---

# Stage state machine

Every stage has:

```text
PENDING
RUNNING
COMPLETED
FAILED
```

Example:

```text
OCR
  PENDING
     ↓
  RUNNING
     ↓
  COMPLETED
```

Recovery rule:

```text
if COMPLETED
    skip

if RUNNING
    verify lease timeout

if FAILED
    retry

if PENDING
    execute
```

This is basically how durable workflow systems work. ([durable-workflow.com][1])

---

# Make stages independently resumable

Bad:

```text
OCR
SigLIP
Index

single transaction
```

Crash at SigLIP:

```text
OCR repeated
```

Good:

```text
OCR checkpoint

SigLIP checkpoint

Index checkpoint
```

Crash at SigLIP:

```text
resume from SigLIP
```

---

# Suggested checkpoints

For screenshot search:

## Stage 1

Metadata

Output:

```json
{
  "width": 1440,
  "height": 3120,
  "timestamp": ...
}
```

---

## Stage 2

OCR

Output:

```json
{
  "text": "...",
  "blocks": [...]
}
```

Stored as:

```text
ocr/<job-id>.json
```

---

## Stage 3

SigLIP2

Output:

```text
768-dim vector
```

or

```text
1152-dim vector
```

depending on model.

Stored:

```text
embeddings/<job-id>.bin
```

---

## Stage 4

Keyword extraction

Output:

```json
[
  "react native",
  "expo",
  "siglip"
]
```

---

## Stage 5

Index insertion

Output:

```json
{
  "typesense_id": "...",
  "indexed": true
}
```

or your local vector store entry.

---

# The queue should contain stage executions, not screenshots

I would design:

```text
screenshot_jobs

stage_executions
```

Schema:

```sql
CREATE TABLE stage_executions (
    execution_id TEXT PRIMARY KEY,

    job_id TEXT,

    stage_name TEXT,

    attempt INTEGER,

    state TEXT
);
```

This lets you retry only:

```text
OCR
```

without touching:

```text
SigLIP
```

---

# Worker leases

Big one for Android.

Suppose:

```text
OCR running
```

App killed.

Need recovery.

Add:

```sql
lease_until
```

Example:

```text
now + 5 minutes
```

Worker claims:

```text
OCR
```

and updates lease periodically.

If app dies:

```text
lease expires
```

Next startup:

```text
OCR requeued
```

---

# Two-level idempotency

## Level 1

Screenshot level

```text
image hash
```

Prevents duplicate jobs.

---

## Level 2

Stage level

```text
jobId + stageName
```

Prevents duplicate stage execution.

Example:

```text
job123 + OCR
```

can only commit once.

---

# Atomic commit pattern

Never:

```text
run OCR

update DB
```

because crash can happen in between.

Instead:

```text
run OCR

write output file

fsync

commit DB checkpoint
```

Then:

```text
COMPLETED
```

Only after durable write.

This is the same durable-execution pattern used in workflow engines. ([zylos.ai][2])

---

# Pipeline graph

I would model the workflow as a DAG:

```text
Metadata
    ↓
 OCR
    ↓
 +----------------+
 |                |
SigLIP      Keywords
 |                |
 +----------------+
        ↓
     Index
```

Notice:

```text
SigLIP
```

and

```text
Keywords
```

can run in parallel.

This is important because SigLIP2 will usually dominate runtime on-device.

---

# Android-specific architecture

For Expo / React Native:

```text
SQLite
      +
Background Worker
      +
Filesystem
```

Storage:

```text
SQLite
  job metadata

Files
  OCR outputs
  embeddings
```

Avoid storing embeddings inside SQLite.

Store:

```text
embedding_path
```

instead.

---

# What I would build

A minimal durable journal:

```text
Job
 ├── Metadata checkpoint
 ├── OCR checkpoint
 ├── SigLIP checkpoint
 ├── Keywords checkpoint
 └── Index checkpoint
```

with:

```text
idempotency_key = SHA256(image)
```

and:

```text
checkpoint_key =
(job_id, stage_name)
```

On startup:

```text
SELECT jobs
WHERE stage != COMPLETED
```

Resume from last committed checkpoint.

That gives you most of the benefits of Temporal/Durable Functions-style execution, but implemented entirely on-device with SQLite and filesystem storage, which is ideal for a screenshot-search app. ([durable-workflow.com][1])

[1]: https://durable-workflow.com/docs/2.0/constraints/execution-guarantees/?utm_source=chatgpt.com "Execution Guarantees and Idempotency | Durable Workflow"
[2]: https://zylos.ai/research/2026-04-24-durable-execution-agent-runtimes?utm_source=chatgpt.com "Durable Execution for AI Agent Runtimes: Checkpointing, Replay, and Recovery | Zylos Research"
