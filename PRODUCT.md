# Product Documentation: Refind

> **"A memory, made searchable."**  
> 100% On-Device, Private Screenshot Recall Search Engine & Text Extraction Utility for Android.

---

## 1. Executive Summary & Product Vision

### 1.1 The Problem: The Screenshot Graveyard
Every day, mobile users take screenshots as an act of intentional capture: a flight confirmation, an online receipt, a WhatsApp chat snippet, a witty tweet, a medical prescription, a line of code, or an article quote. In that moment, the user recognizes value and preserves it.

Days or months later, when that information is needed, the experience degrades into frustration. Native gallery apps organize media chronologically or by generic computer-vision photo tags (e.g., "Food", "Outdoors", "Documents"). They treat a screenshot containing a critical order number the same way they treat a blurry vacation snapshot. The user is forced to endlessly scroll through thousands of thumbnails, hoping their eye catches a recognizable visual silhouette.

**The core thesis of Refind is simple:** *The problem was never taking the screenshot. The problem was finding it again.*

### 1.2 Product Definition & Mission
Refind is **not a photo gallery**, **not a media organizer**, and **not a cloud vault**. 

Refind is a **high-throughput, local indexing engine paired with a recall search interface**. It transforms an Android device's unorganized screenshot directory into a queryable knowledge base. Users search using the words, phrases, and natural language concepts they remember seeing inside their screenshots. Refind executes full-text retrieval on-device and instantly surfaces the exact screenshot.

### 1.3 The Core Guarantees
* **100% On-Device Computation**: OCR extraction, text tokenization, keyword generation, and database indexing occur entirely on the local device hardware.
* **Zero Cloud & Zero Telemetry**: The application communicates with no external API servers, includes no crash telemetry SDKs (no Firebase, no Sentry), no ad trackers, and no analytics beacons.
* **Zero Account Footprint**: No authentication, registration, phone number, or email is required.
* **Offline Independence**: Refind requires no internet access to function. Bundled offline machine learning models guarantee text extraction anywhere, anytime.

---

## 2. Product Metadata & Current Release State

| Property | Value / Specification |
|---|---|
| **App Name** | Refind |
| **Package Identifier** | `com.tanay22.refind` |
| **Current Version** | `1.9.2` (Build 25) |
| **Platform Target** | Android 8.0+ (API Level 26+) |
| **Target Architecture** | ARM64 (`arm64-v8a`), ARMv7 (`armeabi-v7a`), x86_64 |
| **Core Framework** | React Native `0.85.3` / Expo SDK `56.0.11` (New Architecture ready) |
| **Primary Languages** | TypeScript (App & Pipeline), Kotlin (Native OCR Module), SQL (FTS5 Engine) |
| **Styling & Design** | HeroUI Native `1.0.11` + Uniwind (Tailwind CSS v4) + Material You Dynamic Color Engine |
| **Local Storage** | SQLite (`expo-sqlite` with WAL mode & FTS5) + Drizzle ORM `0.45.2` |
| **License** | Apache License, Version 2.0 |
| **Distribution** | GitHub Releases, Obtainium (auto-updating via GitHub API), F-Droid / Google Play (planned) |

---

## 3. Historical Evolution & Major Strategic Pivots

Refind’s current architecture is the result of deliberate engineering decisions, empirical mobile benchmarking, and rigorous simplification based on real-world constraints.

```
May 2026                     June 2026                 July - Sept 2026           Oct - Nov 2026            Nov 2026
┌──────────────────────┐    ┌────────────────────┐    ┌─────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ Pivot 1: The ML Trap │    │ Pivot 2: IA & UX   │    │ Pivot 3: Pipeline   │    │ Pivot 4: UI Engine │    │ Pivot 5: Native    │
│ ExecuTorch + SigLIP  │───>│ Single-Screen      │───>│ Depth-First Fused   │───>│ Jetpack Compose    │───>│ Custom in-tree     │
│ vector search purged │    │ Canvas replaces    │    │ Job Execution &     │    │ Host replaced with │    │ expo-mlkit-ocr     │
│ for lean OCR + FTS5  │    │ multi-tab Library  │    │ Foreground Service  │    │ Pure RN + HeroUI   │    │ module (Kotlin)    │
└──────────────────────┘    └────────────────────┘    └─────────────────────┘    └────────────────────┘    └────────────────────┘
```

### 3.1 Pivot 1: Stripping On-Device Multimodal Embeddings (SigLIP2 / Gemma 3)
* **Initial Direction (May 2026)**: The project initially set out to implement multimodal semantic search. It integrated Meta’s ExecuTorch runtime to execute on-device SigLIP2 vision-language models and Gemma 3 LLM checkpoints (`feba577`, `917e170`). The plan was to generate 768- or 1152-dimensional dense vector embeddings for every screenshot and store them in an on-device vector index (`04-embedding.stage.ts`, `07-index_vec.stage.ts`).
* **The Reality & Failure Mode**:
  1. *Model Weight & APK Bloat*: The quantized model weights ballooned the application download size by several hundred megabytes.
  2. *Inference Latency & Thermal Throttling*: Generating a single dense image embedding took 1.5 to 4 seconds on mobile NPUs/CPUs. For users with 5,000+ screenshots, full library indexing would take hours, severely draining the battery and triggering OS thermal throttling.
  3. *Toolchain Fragility*: PyTorch ExecuTorch bindings introduced complex native compilation requirements (NDK, CMake, Gradle 9.0 pinning) that routinely broke across Android targets.
* **The Strategic Shift (June 12, 2026 - Commit `6fd1094`)**:
  - ExecuTorch, SigLIP2 binaries, and vector database stages were **surgically stripped**.
  - The pipeline was refocused into a lean, deterministic, low-resource DAG: **High-precision OCR + Script Detection + Exhaustive Keyword Token Expansion + SQLite FTS5 (Trigram & Standard Prefix Search)**.
  - *Result*: Indexing throughput increased by over 1,000%, binary size dropped drastically, battery consumption became negligible, and search precision for actual text queries increased.

### 3.2 Pivot 2: Information Architecture & Navigation Consolidation
* **Initial Direction (Early June 2026)**: The app used a multi-tab structure (`src/app/(tabs)/_layout.tsx`): a "Search" tab and a dedicated "Library" tab (`library.tsx`). The Library tab exposed granular engineering metrics: multi-segment progress bars ("Power Search Ready" vs "Simple Search Ready" vs "In Process") and queue counters.
* **The Problem**: Violating fundamental UX principles: users were forced to manage an ingestion pipeline rather than experience the immediate value of search. Segmenting search readiness into multiple tiers created cognitive friction.
* **The Strategic Shift (June 21, 2026 - Commit `c83797c`, `7fa68fd`)**:
  - The project was officially renamed to **Refind**.
  - The multi-tab system was deleted in favor of a **unified, single-screen home route** (`src/app/home.tsx`).
  - The UI adopted modern local-AI patterns: **Progressive Ingestion** and **Search Before Complete**. Technical metrics were encapsulated into an interactive `AboutCommunitySheet` featuring an aesthetic `RadialChart` discovery breakdown.

### 3.3 Pivot 3: Pipeline Execution Flow (Breadth-First to Depth-First Fused Execution)
* **Initial Direction (June 2026)**: The pipeline runner executed stage-by-stage across the entire library queue (e.g., executing OCR across 2,000 items, then post-processing all 2,000, then indexing all 2,000).
* **The Problem**: Unacceptable **Time-to-First-Value (TTFV)**. If a user had 3,000 screenshots, zero screenshots became searchable until the entire batch completed the final indexing stage.
* **The Strategic Shift (July 2026 - Commits `33b74a5`, `ff691e6`, `7adc51b`)**:
  - Shifted image metadata extraction directly into the initial `intake` stage.
  - Replaced FIFO breadth-first scheduling with **Depth-First Fused Job Execution** (`runNextJobToCompletion`): each screenshot is driven through all stages (`ocr` → `ocr_postprocess` → `keywords` → `index_fts`) consecutively.
  - *Outcome*: Screenshot #1 is searchable within ~500ms of app launch, allowing immediate querying while the remaining thousands index in the background.

### 3.4 Pivot 4: UI Engine Architecture (Jetpack Compose Host to Pure React Native + HeroUI Native)
* **Initial Direction (Late June 2026 - Commit `b2967f0`)**: Refind migrated its screen hierarchy to Android Jetpack Compose via `@expo/ui` (`Host` and `Surface` components) to achieve native Material 3 theming.
* **The Problem**:
  - Nesting pure React Native components (Reanimated gesture handlers, FlashList, and image viewports) inside `@expo/ui` Compose `Host` caused severe native layout deadlocks.
  - The image viewer suffered navigation freezes, gesture hit-slop dropping on app resume, and modal dialog crashes.
* **The Strategic Shift (October - November 2026 - Commits `58bb87d`, `8ae1095`, `4d124fe`, `cf2f1b0`, `fd9a95d`)**:
  - The entire UI layer was rewritten in **100% pure React Native** combined with `react-native-reanimated` and `react-native-gesture-handler`.
  - Jetpack Compose was retained exclusively as an off-screen native color bridge (`getMaterialColors`) to extract dynamic Android system palette tokens.
  - Integrated **HeroUI Native** compound components (`BottomSheet`, `Card`, `Button`, `Chip`, `Separator`, `PressableFeedback`) styled with Uniwind (Tailwind CSS v4).

### 3.5 Pivot 5: OCR Engine: Community Library to Custom In-Tree Kotlin Module
* **Initial Direction (July - October 2026)**: Relied on the third-party `rn-mlkit-ocr` package.
* **The Problem**:
  - Models were downloaded on-demand by Google Play Services, causing OCR to fail completely if the user launched Refind while offline or on ungoogled Android ROMs (GrapheneOS, CalyxOS, LineageOS).
  - Required brittle Gradle build patches (`withMlKitBundled.js`, `modify-gradle-props.js`).
  - Bridge serialization throttled throughput to ~1 screenshot/sec.
* **The Strategic Shift (November 8, 2026 - Commits `6e64816`, `4c1863d`)**:
  - Developed a custom, in-tree Expo module: **`expo-mlkit-ocr`** (`modules/expo-mlkit-ocr/`).
  - Implemented in Kotlin using structured coroutines (`Dispatchers.Default`) and modern Expo JSI bindings.
  - Bundled offline Google ML Kit models (**Latin / English** script, with Devanagari on the way) directly in the Gradle build dependencies.
  - *Outcome*: Throughput doubled to **~2 screenshots/sec**, full offline capability was guaranteed, and third-party workarounds were eliminated.

---

## 4. System Architecture & Core Subsystems

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANDROID MEDIASTORE                              │
│              Detects Screenshots via Filename & Smart Albums           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   01: INTAKE & DEDUPLICATION ENGINE                    │
│   • Generates Content Hash: SHA256 / Stable Metadata Hash              │
│   • Extracts Image Dimensions (W x H) into metadata_stage_results      │
│   • Chunks SQLite Inserts (Batch: 500 query / 100 insert)              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│            JOBJOURNAL: DURABLE DIRECTED ACYCLIC GRAPH (DAG)            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STAGE 01: NATIVE OCR (expo-mlkit-ocr Kotlin / JSI)               │  │
│  │  • Portrait: Fast global pass                                    │  │
│  │  • Landscape: Tiled Deep Scan (2x upscale, overlapping halves)   │  │
│  │  • Inverse coordinate projection back to global image space      │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STAGE 02: POSTPROCESS & NORMALIZATION                            │  │
│  │  • Spatial deduplication (intersection/union ratio > 0.7)        │  │
│  │  • Gibberish & OCR noise removal (symbol/digit ratio heuristics) │  │
│  │  • Unicode NFKD canonicalization (I/l/1, 0/O, 5/S mapping)       │  │
│  │  • Script & language classification (Latin, Devanagari, etc.)    │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STAGE 03: KEYWORD EXPANSION & TOKENIZATION                       │  │
│  │  • Exhaustive token splitting (case changes, symbols)            │  │
│  │  • Sub-token generation (e.g., "ARGxInfyy" -> "Infy", "ARG")     │  │
│  │  • Bulk chunked insertion into keyword_stage_results             │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STAGE 04: DUAL-LEG FTS5 INDEXING                                 │  │
│  │  • Standard FTS5: Cleaned text + expanded keywords               │  │
│  │  • Trigram FTS5: Raw text for typo & sub-string fallback         │  │
│  │  • Updates search_readiness state                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│             QUERY-CONDITIONED RECALL SEARCH & VIEWER                   │
│   • Broad Candidate Retrieval: Standard Prefix Wildcard OR Trigram     │
│   • Query-Conditioned Scorer: Dynamic token-explanation ratio          │
│   • Lens Viewer: Interactive cropping, on-demand re-scan & copy        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Ingestion & Idempotency Layer (`01-source.ts`, `02-intake.ts`)
* **Discovery Filter**: Media Library smart albums and photo assets are filtered via regular expression:
  ```ts
  const SCREENSHOT_NAME_RE = /screenshot|screen shot|capture/i;
  ```
* **Deduplication Identity**: Each asset receives a stable hash based on metadata keys (`asset.id`, `filename`, `creationTime`, `width`, `height`). This prevents duplicate processing without incurring heavy file hashing I/O across thousands of unindexed images.
* **Batch Ingestion**: Intake processes assets in chunks of 500 to remain safely under SQLite's parameter limits (999), batch-inserting records across `job_journal_jobs`, `stage_executions`, and `metadata_stage_results`.

### 4.2 Durable Workflow Engine (`JobJournal`)
Every screenshot constitutes an isolated, durable workflow governed by strict execution guarantees:
1. **Crash Resilience**: App kills, low-memory conditions, and background terminations do not corrupt state. Stages commit results atomically inside SQLite.
2. **Lease Management (`03-executor.ts`)**: Workers acquire time-bound leases (`leaseUntil`). If a worker dies mid-execution, the lease expires and the stage is safely reclaimed on the next startup via `recoveryExpiredLeases()`.
3. **Hardware "Breathing" Pauses**: During continuous bulk processing, the execution runner introduces a 200ms throttle every 25 completed jobs. This gives the Android garbage collector and the JavaScript event loop time to clear native bitmaps, avoiding Out-Of-Memory (OOM) faults.

### 4.3 Native OCR & The "Tiled Deep Scan" Strategy (`02-ocr.stage.ts`, `modules/expo-mlkit-ocr`)
Standard mobile OCR engines routinely miss small text inside high-density UI screenshots (such as landscape dashboards, dense order forms, or games). Refind solves this with an adaptive scanning architecture:
* **Portrait / Square Images**: Executes a single, fast global OCR pass.
* **Landscape Images (Tiled Deep Scan)**:
  1. The image is split into two overlapping vertical tiles (Left and Right halves) with a 100px overlap safety margin.
  2. Each tile is physically resized to **200% (2.0x upscale factor)** using `expo-image-manipulator` before being passed to ML Kit. This forces physically small characters past ML Kit's minimum recognition threshold.
  3. **Inverse Coordinate Projection**: Bounding box frames returned from the scaled tiles are mathematically projected back to original global pixel space:
     $$X_{global} = \frac{X_{local}}{Scale} + Offset_X$$
     $$Y_{global} = \frac{Y_{local}}{Scale} + Offset_Y$$
     $$Width_{global} = \frac{Width_{local}}{Scale}, \quad Height_{global} = \frac{Height_{local}}{Scale}$$
* **Engine Prewarming**: When the app initializes, `prewarmOcrEngine()` asynchronously loads the native OCR library off the main UI thread so that the first user interaction experiences zero latency.

### 4.4 Text Post-Processing & Canonicalization (`03-ocr_postprocess.stage.ts`)
Raw OCR outputs contain visual noise, duplicate blocks from tiling, and character substitutions. The post-processing stage applies four filters:
1. **Spatial Deduplication**: If two detected bounding boxes overlap by more than 70% ($\frac{\text{Intersection Area}}{\min(\text{Area}_A, \text{Area}_B)} > 0.7$), the system retains the higher-resolution tile block and discards the duplicate.
2. **Gibberish Filtering**: Blocks with extreme symbol ratios (>40% non-alphanumeric) or coordinate/serial strings (>70% digits with length > 6) are discarded.
3. **Reading-Order Sorting**: Cleaned blocks are topologically sorted vertically and horizontally to preserve logical sentence flow.
4. **OCR Noise Canonicalization (`canonicalize`)**: Bridges common optical recognition errors by normalizing characters to an invariant representation:
   - Decomposes accents via Unicode `NFKD`.
   - Maps visually ambiguous glyphs: `0/O` $\rightarrow$ `o`, `1/l/L/i/I/\|` $\rightarrow$ `i`, `s/S/5` $\rightarrow$ `s`, `z/Z/2` $\rightarrow$ `z`.

### 4.5 Keyword Expansion (`05-keywords.stage.ts`)
To bridge compound words and dense strings (e.g., handles, URLs, order codes):
* Splits tokens on casing transitions and non-alphanumeric boundaries (e.g., `"ARGxInfyy"` generates `"ARGx"`, `"Infyy"`, `"Infy"`, and `"ARG"`).
* Generates prefixes and suffixes for long tokens ($>6$ characters).
* Persists searchable units in `keyword_stage_results` using transactional batch insertion.

### 4.6 Dual-Leg Search & Query-Conditioned Reranking (`hybrid.ts`)
Searching does not rely on a basic `LIKE '%query%'` query. Refind implements a dual-leg FTS5 architecture:
1. **Leg 1: Standard FTS5 (`screenshot_search_index`)**:
   - Queries cleaned OCR text and expanded keyword indexes using prefix wildcard syntax (`token*`) joined with `OR`.
2. **Leg 2: Trigram FTS5 (`screenshot_search_trigram`)**:
   - Matches arbitrary 3-character sequences against raw OCR text, enabling typo-tolerant retrieval and substring matching without requiring exact word boundaries.
3. **Query-Conditioned Scorer (`calculateQueryScore`)**:
   - Retrieved candidates from both legs are dynamically reranked.
   - Priority 1: Exact or expanded keyword match = **1.0 weight**.
   - Priority 2: Substring match in raw text = **0.5 weight**.
   - Final Score:
     $$\text{Score} = \frac{\sum \text{Matched Token Weights}}{\text{Total Query Tokens}}$$
   - Results are capped at the top matches for high-speed rendering.

---

## 5. User Interface & Interaction Architecture

### 5.1 Design Philosophy: "Monochrome Utility" meets Material You
Refind's interface follows an **"organized calm"** brutalist-lite aesthetic designed for functional clarity:
* **Structural Borders over Shadows**: Content cards and surfaces are delineated by clean 1px borders rather than heavy blur shadows.
* **Typographic Hierarchy**:
  - `Newsreader`: Editorial serif headlines for titles and literary touchpoints.
  - `Inter`: Crisp, neutral sans-serif for UI labels, search input, and body content.
  - `JetBrains Mono`: High-density monospace for status tags, indexing counters, and metadata dividers.
* **Adaptive Color Engine**: Dynamically derives Material You light and dark palettes from Android’s wallpaper seed color (defaulting to `#208AEF`), while maintaining high contrast.

### 5.2 Application Route Structure
Refind operates on a streamlined, 4-route stack powered by `expo-router`:

```
src/app/
├── _layout.tsx      # Root layout, theme provider, system bars & font loading
├── index.tsx        # Initialization, database check & splash routing
├── onboarding.tsx   # Welcome screen, product value proposition & permission priming
├── home.tsx         # Unified primary interface (Search + Live Dashboard + RAF)
└── viewer.tsx       # Immersive, transparent-modal gesture viewer & Lens extractor
```

### 5.3 Home Screen State Machine (`home.tsx`)
The home screen transitions smoothly across distinct operational states:

```
                               ┌────────────────────────┐
                               │     Has Permission?    │
                               └───────────┬────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │ No                                  │ Yes
                        ▼                                     ▼
             ┌─────────────────────┐              ┌───────────────────────┐
             │ GrantPermissionView │              │   Sync on Mount       │
             └─────────────────────┘              └───────────┬───────────┘
                                                              │
                                   ┌──────────────────────────┴──────────────────────────┐
                                   │ Active Search Query?                                │ Empty Query (Idle)
                                   ▼                                                     ▼
                       ┌───────────────────────┐                             ┌────────────────────────┐
                       │ Delayed Spinner       │                             │ Has Indexed Items?     │
                       │ (if search > 300ms)   │                             └───────────┬────────────┘
                       └───────────┬───────────┘                                         │
                                   │                                  ┌──────────────────┴──────────────────┐
                       ┌───────────┴───────────┐                      │ No                                  │ Yes
                       │ Results Found?        │                      ▼                                     ▼
                       └─────┬───────────┬─────┘            ┌───────────────────┐                 ┌────────────────────┐
                        Yes  │           │ No               │ WelcomeState      │                 │ Recent Activity    │
                             ▼           ▼                  │ (Empty discovery) │                 │ Feed (RAF Grid)    │
                    ┌─────────────┐ ┌──────────────────┐    └───────────────────┘                 └────────────────────┘
                    │ ResultsList │ │  NoResultsState  │
                    │ FlashList   │ │  w/ dynamic chips│
                    └─────────────┘ └──────────────────┘
```

1. **Permission Gate (`GrantPermissionScreen`)**: If storage access has not been granted, renders an educational screen explaining *why* Refind requires photos access before prompting the system dialog.
2. **Discovery & Intake (`DiscoveryView`)**: During initial bulk sync, renders a zero-query progress state to eliminate database lock contention and reactive thrashing.
3. **Live Dashboard (`LiveDashboard`)**: As items complete processing, renders progress counters and preview thumbnails. When finished, displays an "All done" confirmation.
4. **Recent Activity Feed (RAF)**: When idle, displays the most recently indexed screenshots in a dynamic, aspect-ratio-chunked FlashList grid.
5. **Active Search**: Real-time 300ms debounced queries. Features a 300ms delayed loading spinner to avoid visual flickering on fast sub-millisecond local queries.
6. **No-Results State (`NoResultsState`)**: When a query yields no matches, the system extracts high-signal keywords (stripping common English stopwords) and presents them as interactive suggestion chips. If background indexing is active, it contextually displays a `"STILL INDEXING"` banner.
7. **Discovery Engine Bottom Sheet (`AboutCommunitySheet`)**: Triggered via a micro radial chart in the top header. Features a 180° semicircle `RadialChart` visualizing Search Ready, Pending, and Failed counts, a manual **Rescan** trigger, app version details, and community links.

### 5.4 On-Demand Text Extraction & Crop Scanner (`viewer.tsx`)
Opening any screenshot launches a full-screen, hardware-accelerated viewer with gesture physics:
* **Physics & Gestures**: Smooth pinch-to-zoom (up to 5x), continuous panning, and interactive swipe-to-dismiss mapped to backdrop opacity.
* **OCR Mode & Crop Selection**:
  - Tapping the visual scan icon triggers a smooth spring animation that shrinks the image into a safe viewport bounded between the top and bottom chrome.
  - An interactive **`CropOverlay`** appears with custom hit-slop corner handles. Users drag and resize the crop box around any paragraph, table column, or receipt line item.
  - Tapping **Scan Selection** crops the high-resolution source bitmap, upscales it 2x, and passes it to `expo-mlkit-ocr`.
* **Result Bottom Sheet (`ViewerOcrResultPanel`)**: Extracted text slides up in a HeroUI `BottomSheet` with a 1-tap **Copy to Clipboard** button and native Android system sharing via `expo-sharing`. *(Direct on-canvas interactive word bounding box overlays are on the roadmap).*

---

## 6. Background Processing & Android Service Lifecycle

Android aggressively kills background processes to conserve battery. Refind implements an enterprise-grade background synchronization lifecycle:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ANDROID SYSTEM LIFECYCLE                             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. INITIATION:                                                         │
│    App foreground launch or periodic background check triggers intake  │
│                                                                        │
│ 2. FOREGROUND SERVICE ELEVATION:                                       │
│    • Elevated to Android Foreground Service (type: dataSync)           │
│    • Persistent, low-priority notification posted via react-native-   │
│      notify-kit (prevents Android Doze / LMK kills)                    │
│                                                                        │
│ 3. LIVE MORPHING NOTIFICATION:                                         │
│    • Discovery: "Scanning your library..." (Indeterminate)             │
│    • Processing: "Indexing screenshots... (142 / 850)" + Progress Bar  │
│    • Interactive Action Buttons: [ PAUSE ] and [ RESUME ]              │
│                                                                        │
│ 4. ENGINE CONTROLLER & AUTO-RESUME:                                    │
│    • Pausing suspends the stage loop at the next checkpoint            │
│    • Re-entering app automatically triggers engine auto-resume         │
│    • User dismissal cleans up notifications and gracefully shuts down  │
│                                                                        │
│ 5. PERIODIC RECOVERY:                                                  │
│    • expo-task-manager registers JOB_JOURNAL_RUNNER_TASK (15 min min)  │
│    • Runs bounded 24-second execution budgets while device is idle     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security, Privacy & Permissions

Refind operates under a **Zero-Trust Privacy Architecture**. It adheres to the principle that a user's screenshots contain their most sensitive personal, financial, and private data.

### 7.1 Data Protection Boundary
* **No Network Socket Calls**: The app does not initiate HTTP/WebSocket requests for core features. All network-related utilities (e.g., opening the GitHub repository) strictly use `expo-web-browser` to launch the user’s default browser externally.
* **Isolated Database Sandbox**: Extracted OCR text, bounding boxes, and search tokens are stored strictly inside the application-private SQLite database path:
  `/data/user/0/com.tanay22.refind/databases/`
* **Zero Telemetry**: No analytics SDKs, advertising IDs, or crash reporting services are compiled into the production binary.

### 7.2 Permission Audit Matrix

| Android Permission | API Tier | Technical Necessity |
|---|---|---|
| `READ_MEDIA_IMAGES` | API 33+ | Read screenshot files from Android MediaStore. |
| `READ_EXTERNAL_STORAGE` | API 26-32 | Legacy access to read screenshot files on older Android versions. |
| `ACCESS_MEDIA_LOCATION` | API 29+ | Read chronological creation timestamps for accurate result ordering. |
| `FOREGROUND_SERVICE` | API 28+ | Prevent the OS from terminating OCR workers during indexing. |
| `FOREGROUND_SERVICE_DATA_SYNC` | API 34+ | Android 14+ mandatory classification for background sync services. |
| `POST_NOTIFICATIONS` | API 33+ | Display persistent indexing progress and Pause/Resume action buttons. |

---

## 8. Distribution, Tooling & Automation

### 8.1 Automated Release Flow
Refind utilizes Google's **Release Please** combined with **Conventional Commits**:
1. Merges to `master` analyze conventional commit prefixes (`feat:`, `fix:`, `perf:`).
2. Release Please maintains a release PR updating `CHANGELOG.md`, `package.json`, and `app.json`.
3. Merging the release PR generates a git tag (e.g., `refind-v1.9.2`) and triggers the GitHub Actions build workflow.

### 8.2 Distribution Channels
* **GitHub Releases**: Direct download of unsigned/signed production APKs (`pnpm compile:apk --release`).
* **Obtainium**: Native integration with Obtainium via deep-link schema. Allows open-source users to receive automated, background app update notifications directly from the GitHub repository release feed without Google Play Services.
* **Side-by-Side Debugging**: The CI build workflow features an on-demand debug configuration (`build-debug.yml`) that appends a `.debug` package suffix, allowing developer builds to be installed alongside production releases on the same physical device.

---

## 9. Product Boundaries & Future Roadmap

### 9.1 Non-Goals (What Refind Deliberately Does NOT Do)
* **Not a Cloud Sync Service**: Refind will never sync screenshots to Google Drive, Dropbox, or proprietary servers.
* **Not a General Photo Gallery**: Refind does not organize family photos, selfies, or camera rolls. It strictly scopes itself to screenshot media.
* **Not a Generative AI Playground**: Refind will not add cloud LLM wrappers, chat bots, or generative image filters that compromise speed, battery, or privacy.

### 9.2 Prospective Roadmap
* **Extended Multi-Language OCR Packs**: Expanding offline ML Kit bundles to support additional scripts (e.g., Japanese, Chinese, Cyrillic) via modular on-demand downloads.
* **Duplicate & Low-Quality Pruning**: Optional utility to surface duplicate or expired screenshots (e.g., one-time OTP codes or temporary delivery maps) for one-tap deletion.
* **F-Droid Inclusion**: Submitting official recipe configurations to the official F-Droid repository.
