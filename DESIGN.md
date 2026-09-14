---
name: Chlorophyll Noir
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#434933'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#737a61'
  outline-variant: '#c2caad'
  surface-tint: '#4b6700'
  primary: '#4b6700'
  on-primary: '#ffffff'
  primary-container: '#bdff00'
  on-primary-container: '#547300'
  inverse-primary: '#a0d800'
  secondary: '#46645e'
  on-secondary: '#ffffff'
  secondary-container: '#c8eae1'
  on-secondary-container: '#4c6a64'
  tertiary: '#795900'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffe7bc'
  on-tertiary-container: '#866300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b7f700'
  primary-fixed-dim: '#a0d800'
  on-primary-fixed: '#141f00'
  on-primary-fixed-variant: '#374e00'
  secondary-fixed: '#c8eae1'
  secondary-fixed-dim: '#accdc5'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#2e4c46'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#fbbc00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 20px
  margin: 24px
  border-width: 3px
---

## Brand & Style
This design system is an energetic evolution of Neobrutalism tailored for environmental tech and archival research. It balances the raw, "undone" aesthetic of a scientific field journal with the aggressive clarity of modern software. The brand personality is authoritative yet rebellious—treating ecological data with the urgency of a high-contrast editorial spread.

The target audience includes climate researchers, urban arborists, and environmental activists who require high-density information layouts that remain legible under varying field conditions. The UI evokes a sense of "digital specimens"—contained, categorized, and high-energy.

**Visual Principles:**
- **Raw Hierarchy:** Heavy black borders and un-aliased aesthetic choices.
- **Archival Precision:** Systematic use of grids and monospaced accents to imply data integrity.
- **Organic Contrast:** A collision of synthetic "electric" tones against deep, earthy foundations.

## Colors
The palette is centered on high-chroma accents against a "paper-white" archival background. 

- **Electric Green (#BDFF00):** The primary signal color. Used for high-priority actions, growth indicators, and primary focus states.
- **Forest Green (#0B2B26):** The structural anchor. Used for deep backgrounds, heavy headers, and secondary containers to provide a grounded, sophisticated contrast.
- **Vibrant Amber (#FFBF00):** Reserved for warnings, pest alerts, and critical anomalies. It must maintain high legibility against black text.
- **Sky Blue (#00B4D8):** Dedicated to hydration, atmospheric data, and climate-positive metrics.
- **Neutral (#1A1A1A):** Used for all borders, shadows, and primary body text to maintain the Neobrutalist weight.

## Typography
The typography system utilizes **Lexend** for its hyper-legibility and geometric strength, reinforcing the Neobrutalist structure. 

**Usage Guidelines:**
- **Headlines:** Set in Bold or ExtraBold. Use tight letter spacing for Display sizes to create a "block" effect.
- **Labels:** Use JetBrains Mono (monospaced) in All-Caps for metadata, timestamps, and scientific nomenclature to reinforce the archival/technical feel.
- **Body:** Standard weight Lexend. Paragraphs should maintain generous line-height to balance the heavy visual weight of the borders.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy with a 12-column desktop structure and a 4-column mobile structure. 

**Grid Rules:**
- Containers do not use soft padding; they use hard "gutters" that act as visual breaks.
- **Breakpoints:** Mobile (375px), Tablet (768px), Desktop (1280px).
- Elements are often "staggered"—shifted slightly off-axis or overlapping to create a raw, collage-like feel.
- **Margins:** 24px on mobile, scaling to 48px on desktop to provide "breathing room" for the aggressive internal elements.

## Elevation & Depth
In line with Neobrutalism, this design system rejects shadows and blurs. Depth is communicated through **Hard Offsets** and **Stark Layers**.

- **Hard Shadows:** Use 100% opacity black offsets (e.g., 4px x 4px) to elevate cards and buttons.
- **Tonal Layering:** Objects "lower" in hierarchy are flat on the background with a 3px border. "Higher" objects use the offset shadow.
- **Negative Space:** Use the #F4F4F2 background color to separate high-intensity containers.

## Shapes
The shape language is strictly **Sharp (0px)**. 

Every UI element—from buttons to input fields to images—must maintain 90-degree corners. This reinforces the "archival sheet" and "scientific document" aesthetic. Overlapping shapes should use the 3px black border to maintain separation.

## Components

### Buttons
- **Primary:** Electric Green background, 3px Black border, Bold Lexend text. Hard offset shadow (4px).
- **Secondary:** White background, 3px Black border, Hard offset shadow.
- **Destructive/Alert:** Vibrant Amber background, 3px Black border.

### Cards
- White or light grey background with a 3px Black border. 
- Header areas of cards should use a Forest Green background with White text to categorize content.
- Use JetBrains Mono labels in the top-right corner for "specimen numbers" or IDs.

### Input Fields
- White background, 3px Black border. 
- Focus state: The border stays black, but a 4px "glow" (no-blur offset) in Electric Green appears behind the field.

### Chips & Tags
- Used for taxonomy (e.g., "Species," "Ph"). 
- Small, rectangular, Forest Green background with White monospaced text. No rounded corners.

### Lists
- Items separated by 2px horizontal Black lines. 
- Hover state: Row background changes to Electric Green (#BDFF00) with no transition time (instant state change).

### Technical Data Viz
- Use Sky Blue for water levels/humidity and Vibrant Amber for warning thresholds. 
- All charts should use a "pixel-grid" background texture.