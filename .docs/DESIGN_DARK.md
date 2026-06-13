---
name: Monochrome Utility Dark
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c3c5d9'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#8d90a2'
  outline-variant: '#434656'
  surface-tint: '#b6c4ff'
  primary: '#b6c4ff'
  on-primary: '#00277f'
  primary-container: '#0057ff'
  on-primary-container: '#e5e8ff'
  inverse-primary: '#004ee7'
  secondary: '#c6c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#ffb59f'
  on-tertiary: '#5f1600'
  tertiary-container: '#c13600'
  on-tertiary-container: '#ffe3db'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#003ab2'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb59f'
  on-tertiary-fixed: '#3a0a00'
  on-tertiary-fixed-variant: '#862300'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 30px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1200px
---

## Brand & Style

The design system is engineered for deep work and high-density information management. It targets power users who value speed and clarity over visual flair. The brand personality is disciplined, intellectual, and utilitarian.

The aesthetic follows a **"Brutalist-lite"** philosophy: it embraces the raw structure of the web—sharp lines, modular grids, and clear boundaries—but polishes them with minimalist restraint. In this dark mode configuration, the emotional response is one of "focused immersion"—a digital workspace that feels like a high-end terminal or a late-night architectural studio.

Key stylistic pillars include:
- **Structural Integrity:** Layouts are defined by borders rather than shadows.
- **Typographic Authority:** High-contrast font pairing to separate meta-data from primary content.
- **Functional Density:** Maximizing information on screen without sacrificing legibility through strict rhythmic spacing.

## Colors

The palette is strictly monochrome to minimize cognitive load, optimized for a high-contrast dark environment.

- **Primary (Action):** A vivid, digital Blue (#0057FF) used exclusively for interactive elements, primary buttons, and active states. In dark mode, this provides a piercing functional affordance against the dark canvas.
- **Surface & Backgrounds:** The primary canvas is a deep, near-black Neutral (#1A1C1C). Sidebars and secondary containers use slightly elevated dark grays to provide subtle structural separation without breaking the dark aesthetic.
- **Content:** Pure White or high-brightness Gray for primary headers and text to ensure maximum legibility; muted grays for secondary body text.
- **Borders:** Subtle, low-brightness grays serve as the primary tool for elevation and containment, maintaining the system's "Brutalist-lite" roots by replacing all drop shadows with structural lines.

## Typography

This design system utilizes a "hybrid-intellectual" typographic scale. 

- **Headlines:** `Newsreader` provides a literary, authoritative feel to page titles and major sections. It should be used with tighter tracking and generous line height to maintain a "journal" aesthetic.
- **Body:** `Inter` is used for all functional interface text and long-form reading due to its exceptional legibility at small sizes and high x-height.
- **Technical Meta:** `JetBrains Mono` is reserved for labels, tags, breadcrumbs, and data-heavy strings to emphasize the "productivity tool" nature of the interface.

On mobile, display sizes scale down aggressively to ensure no more than 3-4 words per line are broken, maintaining a vertical rhythm.

## Layout & Spacing

The layout uses a **strict modular grid** based on a 4px baseline.

- **Grid Model:** A 12-column fluid grid on desktop, 6-column on tablet, and a single-column stack on mobile.
- **Containment:** Content is typically housed in "blocks" separated by 1px borders. 
- **Density:** Padding is intentionally compact (`12px` to `16px` for internal containers) to allow more data visibility, balanced by significant outer margins (`40px+` on desktop) to prevent visual claustrophobia.
- **Vertical Rhythm:** Every element, from line-height to button height, must align to the 4px unit.

## Elevation & Depth

In dark mode, this system rejects shadows in favor of **Tonal Layering and Borders** to preserve clarity and prevent "muddy" interfaces.

- **Level 0 (Canvas):** The base background (Black or deep Neutral).
- **Level 1 (Surface):** Secondary content areas (e.g., sidebars) use a slightly lighter gray fill or a 1px gray border to separate from the canvas.
- **Interactive State:** Hovering over a list item or card does not lift it; instead, it changes the background to a subtly lighter gray or thickens the border on the left side to the primary blue accent.
- **Modals/Popovers:** These use a solid 2px light gray border to stand out against the dark canvas. A sharp 4px offset "hard shadow" (pure black, high opacity) can be used to emphasize separation from the underlying layers.

## Shapes

The shape language is **geometric and precise**. 

- **Corners:** A "Soft" approach is used (4px/0.25rem radius). This provides just enough friendliness to keep the UI from feeling hostile, while maintaining the architectural rigidity of the design system.
- **Inputs & Buttons:** Follow the 4px radius strictly. 
- **Icons:** Use linear, 2px stroke-weight icons with square caps to match the border-heavy aesthetic.

## Components

- **Buttons:** 
    - *Primary:* Solid Blue (#0057FF) background, White text. No shadow.
    - *Secondary:* 1px border (Light Gray), Dark background, White text.
    - *Ghost:* No border, Blue text.
- **Input Fields:** 1px border (Dark Gray) that turns 1px White or Blue on focus. Labels use `label-mono` style sitting just above the field.
- **Cards:** No shadows. Defined by a 1px border. Card headers should have a 1px bottom border separating the title from the body content.
- **Chips/Tags:** Rounded 4px, dark gray background, no border. Use `label-mono` for tag text.
- **Lists:** Items are separated by 1px horizontal dividers. Active items are indicated by a 2px Blue left-border.
- **Search Bar:** Large, 1px border, high-contrast text. The search icon should always be the primary blue accent to signal the core utility of the app.