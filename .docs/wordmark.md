# Refind Wordmark & Visual Identity Specification

> **Brand Core**: Refind is a 100% on-device, private screenshot recall search engine.  
> *"A memory, made searchable."*

---

## 1. Executive Summary & Brand Thesis

Refind's primary visual identity is the **Refind Wordmark**.

While standalone logos are often abstract emblems that require heavy brand awareness to recognize, a **typographic wordmark is inherently semantic**—it immediately communicates the product name while anchoring the visual brand.

In Refind, the wordmark does not compromise between an emblem and typography: **the brand emblem IS the capital letter 'R'**, seamlessly fused with custom-kerned typography set in **Manrope SemiBold (600)**.

```
       [Screenshot Viewfinder Corner]
             \     ______
              ┌─┐ /      \  <--- [Recall Loop / Camera Lens]
              │ ││        │
              │ │ \______/
              │ │   /
              │ │  / \      <--- [Grounded Foot on Baseline]
              └─┘ └───┘
```

---

## 2. Anatomy of the "R" Brand Symbol

The capital 'R' carries three interconnected visual metaphors:

1. **The Screenshot Viewfinder (Top-Left Bracket)**:
   * A $90^\circ$ sharp outer corner separated from the circular bowl by a uniform, concentric curved clearance channel ($64\,\text{units}$ / $\sim 4.1\text{px}$).
   * Metaphor: The crop corner of a mobile screenshot, a camera viewfinder, or a focus frame.
   * **Rule for Future Maintainers**: Never merge this bracket flush into the circle. That negative-space channel is what transforms the glyph from a generic letter into the Refind camera/screenshot viewfinder emblem.

2. **The Recall Loop / Lens (The Circular Bowl)**:
   * A mathematically pure circular ring ($R_{\text{out}} = 480\,\text{units}$, $R_{\text{in}} = 271\,\text{units}$).
   * Metaphor: The magnifying glass of search, a memory recall loop, and an optical camera lens.

3. **The Grounded Stem & Dynamic Leg**:
   * A vertical anchor stem ($209\,\text{units}$ wide) running down to the baseline ($y = 0$).
   * A clean diagonal leg projecting downward and landing with a horizontal terminal flush on the baseline.

---

## 3. Typographic Engineering & Mathematical Alignment

The wordmark was compiled directly from the source font file of **Manrope** (designed by Mikhail Sharov) at native $2000\,\text{UPM}$ (Units Per Em) coordinate resolution:

| Metric | Font Unit Value | Pixel Equiv (at 128px scale) | Architectural Justification |
|---|---|---|---|
| **Cap Height** | $1440\,\text{units}$ | $92.16\text{px}$ | Matches the top of the 'R' flush with the ascender line of `f` and `d`. |
| **x-Height** | $1080\,\text{units}$ | $69.12\text{px}$ | The mean-line of `e`, `n`, and the bowl of `d`. |
| **Stem Width** | $209\,\text{units}$ | $13.38\text{px}$ | Exact stem width of Manrope SemiBold's `i`, `n`, and `d`. |
| **Bowl Stroke** | $209\,\text{units}$ | $13.38\text{px}$ | $R_{\text{out}} - R_{\text{in}} = 480 - 271 = 209$. Equal optical density with straight stems. |
| **Bracket Gap** | $64\,\text{units}$ | $4.10\text{px}$ | $R_{\text{bracket}} - R_{\text{out}} = 544 - 480 = 64$. Preserves channel legibility down to $20\text{px}$ display height. |
| **Tangent Joint** | $x = 329\,\text{units}$ | $y = 600\,\text{units}$ | Inner and outer circles are tangent to the vertical stem at the equator ($C^1$ continuous). |

---

## 4. Optical Kerning & Spacing System

### The R → E Asymmetrical Negative-Space Challenge
In type design, an uppercase **R** followed by a curved lowercase **e** creates an optical illusion:
* The upper bowl curves away to the left (creating open negative space above).
* The lower leg thrusts to the right (closing the negative space at the baseline).

If spaced purely by bounding box, the leg foot collides with the `e`, or the upper space feels like a chasm.

### The Standardized Spacing Values:
* **R Advance**: $1090\,\text{units}$ (leaving a clean $160\,\text{unit}$ / $10.2\text{px}$ gap between the leg foot and the left curve of `e`).
  * *Why this works*: It matches Manrope's native OpenType `Re` kerning table, allowing the `e` to tuck naturally under the bowl overhang while giving the leg foot clean breathing room.
* **Inter-Glyph Adjustments**:
  * $e \rightarrow f$: $+0\,\text{units}$ (natural sidebearing gap: $229\,\text{units}$)
  * $f \rightarrow i$: $-20\,\text{units}$ (tucks the $i$ under the $f$ crossbar)
  * $i \rightarrow n$: $-40\,\text{units}$ (closes the visual hole created by narrow $i$)
  * $n \rightarrow d$: $+0\,\text{units}$ (natural sidebearing gap: $168\,\text{units}$)

---

## 5. System Role: Wordmark vs. Standalone App Icon

Refind maintains two complementary brand assets. Here is when to use each:

```
┌─────────────────────────────────────────────────────────────┐
│                    REFIND BRAND ASSETS                      │
├──────────────────────────────┬──────────────────────────────┤
│      STANDALONE ICON         │           WORDMARK           │
│     (brand-logo.png)         │    (brand-wordmark.svg)      │
├──────────────────────────────┼──────────────────────────────┤
│ • Android Launcher Icon      │ • In-App Top Header          │
│ • Notification Tray Icon     │ • Onboarding Hero Title      │
│ • Favicon / Web App Icon     │ • About / Community Sheet    │
│ • Splash Screen Emblem       │ • Play Store Feature Graphic │
│ • App Store Square Tile      │ • GitHub README Banner       │
│ • Social Avatar / Profile    │ • Web Landing Page Navbar    │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 6. Engineering Implementation in Codebase

### A. React Native Component
Located at [src/ui/brand/Wordmark.tsx](file:///Users/tanay/Developer/refind/src/ui/brand/Wordmark.tsx):

```tsx
import { Wordmark } from '@/ui/brand';

// Responsive with default theme colors:
<Wordmark height={26} color={colors.onSurface} />

// Hero header size:
<Wordmark height={48} color={colors.onSurface} />
```

* **Aspect Ratio**: Locked to $5897 : 1600$ ($\sim 3.686 : 1$).
* **Dynamic Colors**: Defaults to `colors.onSurface` (Material You dynamic theme-aware).
* **Zero Rerender Overhead**: Wrapped in `React.memo`.

### B. Vector Files for Marketing & Web
* Light Glyph on Transparent: [assets/images/brand-wordmark.svg](file:///Users/tanay/Developer/refind/assets/images/brand-wordmark.svg)
* Dark Glyph on Transparent: [assets/images/brand-wordmark-dark.svg](file:///Users/tanay/Developer/refind/assets/images/brand-wordmark-dark.svg)

---

## 7. Rules for Future Modifications

1. **Do not use text editors to type "Refind" in place of the Wordmark**: Always use `<Wordmark />` or the official SVGs so the custom R glyph, tangent continuity, and kerning remain uniform.
2. **Never scale non-proportionally**: The aspect ratio is $3.686 : 1$.
3. **If adjusting weights**: If an ExtraBold or Regular cut is ever needed, maintain the 1:1 ratio between the vertical stem and the circular bowl ring ($R_{\text{out}} - R_{\text{in}} = W_{\text{stem}}$).
4. **Preserve the baseline**: The vertical stem and diagonal leg foot must always terminate on the exact same horizontal baseline ($y = 1500$ in font units).
