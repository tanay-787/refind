---
name: Monochrome Utility
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#434656'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ee7'
  primary: '#0043c8'
  on-primary: '#ffffff'
  primary-container: '#0057ff'
  on-primary-container: '#e5e8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#972800'
  on-tertiary: '#ffffff'
  tertiary-container: '#c13600'
  on-tertiary-container: '#ffe3db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
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
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
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

The aesthetic follows a **"Brutalist-lite"** philosophy: it embraces the raw structure of the web—sharp lines, modular grids, and clear boundaries—but polishes them with minimalist restraint. The emotional response should be one of "organized calm"—a digital workspace that feels like a high-end physical notebook or an architectural blueprint. 

Key stylistic pillars include:
- **Structural Integrity:** Layouts are defined by borders rather than shadows.
- **Typographic Authority:** High-contrast font pairing to separate meta-data from primary content.
- **Functional Density:** Maximizing information on screen without sacrificing legibility through strict rhythmic spacing.

## Colors

The palette is strictly monochrome to minimize cognitive load, using a single high-chroma Blue for functional affordances.

- **Primary (Action):** A vivid, digital Blue (#0057FF) used exclusively for interactive elements, primary buttons, and active states.
- **Surface & Backgrounds:** A pure White (#FFFFFF) for primary work areas, with a light Neutral (#F7F7F7) used for sidebars, gutters, and secondary containers to provide subtle structural separation.
- **Content:** True Black (#000000) for primary headers and high-contrast text; a deep Slate (#4D4D4D) for secondary body text.
- **Borders:** A consistent light Grey (#E5E5E5) serves as the primary tool for elevation and containment, replacing all drop shadows.

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

This system rejects shadows in favor of **Tonal Layering and Borders**.

- **Level 0 (Canvas):** The base background.
- **Level 1 (Surface):** Secondary content areas (e.g., sidebars) use a subtle grey fill (#F7F7F7) or a 1px border (#E5E5E5) to separate from the canvas.
- **Interactive State:** Hovering over a list item or card does not lift it; instead, it changes the background to a very light grey or thickens the border on the left side to the primary blue accent.
- **Modals/Popovers:** These use a solid 2px black border and a sharp 4px offset "hard shadow" (pure black, 100% opacity) if deep separation is required, though simple 1px borders are preferred.

## Shapes

The shape language is **geometric and precise**. 

- **Corners:** A "Soft" approach is used (4px/0.25rem radius). This provides just enough friendliness to keep the UI from feeling hostile or overly "Windows 95," while maintaining the architectural rigidity of the design system.
- **Inputs & Buttons:** Follow the 4px radius strictly. 
- **Icons:** Use linear, 2px stroke-weight icons with square caps to match the border-heavy aesthetic.

## Components

- **Buttons:** 
    - *Primary:* Solid Black background, White text. No shadow.
    - *Secondary:* 1px border (#E5E5E5), White background, Black text.
    - *Ghost:* No border, Blue text.
- **Input Fields:** 1px border (#E5E5E5) that turns 1px Black on focus. Labels use `label-mono` style sitting just above the field.
- **Cards:** No shadows. Defined by a 1px border. Card headers should have a 1px bottom border separating the title from the body content.
- **Chips/Tags:** Rounded 4px, light grey background, no border. Use `label-mono` for tag text.
- **Lists:** Items are separated by 1px horizontal dividers. Active items are indicated by a 2px Blue left-border.
- **Search Bar:** Large, 1px border, high-contrast text. The search icon should always be the primary blue accent to signal the core utility of the app.