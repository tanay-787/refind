# OCR Stage: Tiled Deep Scan Strategy

This document explains the "Tiled Deep Scan" implementation used in the OCR stage (`02-ocr.stage.ts`) to handle **Maximalist UIs**, **Game UIs**, and **Dense Dashboards**.

## The Problem
Standard OCR engines (like ML Kit) often fail on complex mobile screenshots for three reasons:
1. **Resolution vs. Text Size**: On high-res screens (1440p+), UI labels are physically small. When the whole image is processed, these small details are often filtered out as noise.
2. **Visual Clutter**: Multi-colored backgrounds, gradients, and unstructured layouts confuse the global text detector.
3. **Landscape Compression**: Landscape screenshots often contain the highest density of information (e.g., a game HUD or a spreadsheet) but are frequently processed with less "attention" per square pixel.

## The Solution: Tiled Deep Scan
Instead of relying on a single pass, the OCR stage employs a **multi-pass tiling strategy** specifically for landscape images.

### 1. Global Pass (0°)
First, a standard OCR pass is run on the original image. This captures large headings, body text, and establishes the "global" layout.

### 2. Tiled Deep Scan (Landscape Only)
If the image is detected as landscape (via metadata), the system performs a high-resolution sub-scan using a **2.0x Upscale Factor**.

#### Tiling & Scaling Visualization
The image is split into two overlapping vertical halves, and each is physically resized to 200% of its original dimensions before processing.

```text
Original Landscape Image (W x H)
┌───────────────────────────────────────────────────┐
│                                                   │
│                  GLOBAL IMAGE                     │
│                                                   │
└───────────────────────────────────────────────────┘

Tile 1: Left Half (Scaled 2x)       Tile 2: Right Half (Scaled 2x)
┌──────────────────────────────┐   ┌──────────────────────────────┐
│                              │   │                              │
│           TILE 1             │   │           TILE 2             │
│       (200% Width)           │   │       (200% Width)           │
│                              │   │                              │
└──────────────────────────────┘   └──────────────────────────────┘
```

### Why This Works
By cropping and **scaling** the tiles:
* **Neural Network Input**: ML Kit's internal models work better when characters have a minimum pixel height. Scaling "tiny" game UI text up to 2x ensures they exceed this threshold.
* **ML Kit Attention**: The engine receives a smaller canvas, making small text elements appear "larger" relative to the total pixel area.
* **Higher Precision**: Each tile is essentially a "deep zoom" for the OCR detector.
* **Overlap Safety**: A 100px overlap (±50px from center) ensures that words spanning across the center line are captured fully in at least one tile.

## Coordinate Projection & Inverse Scaling
Since OCR results from tiles use "local" coordinates relative to a **scaled** canvas, the system performs an inverse projection to map them back to the original global space:

$$X_{global} = \frac{X_{local}}{Scale} + Offset_X$$
$$Y_{global} = \frac{Y_{local}}{Scale} + Offset_Y$$
$$Width_{global} = \frac{Width_{local}}{Scale}$$

This ensures that the bounding boxes stored in the database correctly map back to the original screenshot dimensions for visual highlighting in the search UI.

## Merging & Deduplication
1. **Text**: Tile text is appended to the global text.
2. **Blocks**: All blocks from all passes are stored in the `ocr_stage_results` table.
3. **Post-Processing**: The next stage (`03-ocr_postprocess.stage.ts`) handles deduplication, cleaning up text overlaps, and refining the final searchable content.
