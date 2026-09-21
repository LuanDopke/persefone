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
  margin-mobile: 16px
  margin-wide: 24px
  border-width: 4px
  shadow-default: 4px
  shadow-emphasis: 6px
---

## Brand & Style
This design system applies a neobrutalist visual language to plant care and archival records. It combines the structure of a scientific field journal with the clarity required by an application used during care routines.

The target audience includes climate researchers, urban arborists, and environmental activists who require high-density information layouts that remain legible under varying field conditions. The UI evokes a sense of "digital specimens"—contained, categorized, and high-energy.

**Visual Principles:**
- **Explicit hierarchy:** charcoal borders, rectangular surfaces and visible section labels distinguish primary, secondary and auxiliary content.
- **Archival precision:** systematic grids and monospaced accents identify records, dates, IDs and measurements.
- **Tactile interaction:** hard offsets and immediate state changes communicate interaction without blur, gradients or ornamental motion.

## Colors
The palette is centered on high-chroma accents against a "paper-white" archival background. 

- **Electric Green (#BDFF00):** The primary signal color. Used for high-priority actions, growth indicators, and primary focus states.
- **Forest Green (#4B6700):** The structural anchor. Used for section headers, stable states and secondary containers.
- **Vibrant Amber (#FFBF00):** Reserved for warnings, pest alerts, and critical anomalies. It must maintain high legibility against black text.
- **Sky Blue (#00B4D8):** Dedicated to hydration, atmospheric data, and climate-positive metrics.
- **Neutral (#1C1B1B):** Used for borders, shadows and primary body text. The canonical surface and semantic tokens are defined in the frontmatter of this file and in the frontend theme.

## Typography
The typography system utilizes **Lexend** for its hyper-legibility and geometric strength, reinforcing the Neobrutalist structure. 

**Usage Guidelines:**
- **Headlines:** Set in Bold or ExtraBold. Use tight letter spacing for Display sizes to create a "block" effect.
- **Labels:** Use JetBrains Mono (monospaced) in All-Caps for metadata, timestamps, and scientific nomenclature to reinforce the archival/technical feel.
- **Body:** Standard weight Lexend. Paragraphs should maintain generous line-height to balance the heavy visual weight of the borders.

## Layout & Spacing
The layout follows a **fluid grid** with a 12-column wide-screen structure. Components may use a two-column intermediate composition only when their content remains readable; on narrow screens, the reading order becomes one column.

**Grid Rules:**
- Containers use consistent internal margins: 16px on narrow screens and 24px from the medium breakpoint onward.
- **Breakpoints for validation:** 360px, 768px, 1024px and 1440px. The persistent sidebar begins at 1024px; below it, mobile navigation remains available without covering content.
- **Columns:** cards use one column on narrow screens, two columns when the available width allows comparison, and up to twelve columns on wide screens.
- Decorative offsets or slight rotations are allowed only for non-essential surfaces and must not change reading order, cause overflow or make controls harder to use.
- Page-level fixed or floating elements must reserve safe-area space and must not cover forms, messages, timelines or primary actions.

## Elevation & Depth
In line with Neobrutalism, this design system rejects shadows and blurs. Depth is communicated through **Hard Offsets** and **Stark Layers**.

- **Hard Shadows:** Use 100% opacity charcoal offsets, normally 4px x 4px and up to 6px x 6px for a featured panel. No blur.
- **Tonal Layering:** Lower-level regions may use a flat surface; cards and primary actions use the offset shadow. Border weight remains the canonical 4px token.
- **Negative Space:** Use the surface-container tokens to separate content groups without gradients or decorative textures.

## Shapes
The shape language is strictly **Sharp (0px)**. 

Every UI element—from buttons to input fields to images—must maintain 90-degree corners. This reinforces the "archival sheet" and "scientific document" aesthetic. Overlapping shapes should use the canonical charcoal border to maintain separation.

The implementation uses the canonical 4px border token, including for image frames, inputs and structured regions.

## Components

### Buttons
- **Primary:** Electric Green background, 4px charcoal border, Bold Lexend text. Hard offset shadow (4px).
- **Secondary:** White background, 4px charcoal border, Hard offset shadow.
- **Destructive/Alert:** Vibrant Amber background, 4px charcoal border.

### Cards
- White or light grey background with a 4px charcoal border.
- Header areas of cards should use a Forest Green background with White text to categorize content.
- Use JetBrains Mono labels in the top-right corner for "specimen numbers" or IDs.

### Input Fields
- White background, 4px charcoal border.
- Focus state: The border stays black, but a 4px "glow" (no-blur offset) in Electric Green appears behind the field.

### Chips & Tags
- Used for taxonomy (e.g., "Species," "Ph"). 
- Small, rectangular, Forest Green background with White monospaced text. No rounded corners.

### Lists
- Items use structured cards or 2px separators according to density.
- Hover state may change the surface to Electric Green (#BDFF00) with no transition time; focus-visible and pressed states must remain available by keyboard and pointer.

### Technical Data Viz
- Use Sky Blue for water levels/humidity and Vibrant Amber for warning thresholds. 
- Use Electric Green for light or stable-growth measures when that mapping is meaningful to the product.
- Values must also have a label, unit and accessible text. Avoid a texture as the only data distinction.

## Specimen Detail Composition

The specimen detail page is the reference composition for dense monitoring screens. It uses the shared application shell and follows this reading order:

1. **Identity header:** technical identifier and textual status, specimen name as the page title, species or contextual description, then page actions.
2. **Current state:** a metrics panel adjacent to the identity block on wide screens. Each metric presents a label, value, unit or scale and update time. A progress bar is optional and never replaces the value or label.
3. **Visual timeline:** an open section with a botanical-green square title block, a horizontal rule and square media cards below it. Cards show capture date and contextual label; the final slot may be an explicit action to add a visual record.
4. **Care actions and activity history:** use square title blocks with distinct colors and a horizontal rule; place each activity date outside its record box on the timeline axis. On wide screens, quick care actions occupy the supporting column and the growth or care log occupies the main column. On narrow screens, actions precede the history in one reading flow.
5. **Activity records:** records use a stable vertical axis or equivalent chronology, with timestamp, type and note separated by text and structure. The latest record remains distinguishable without relying only on color.

Composition rules:

- Use `PageContainer`, `PageHeader`, `ResponsiveGrid`, `Card`, `MediaFrame`, semantic status components and the existing modal/form primitives. Use `Card` for metrics, actions and individual records; do not wrap the visual timeline, care actions or history in an additional outer card.
- Prefer a 5-column visual-card grid on wide screens, four columns when space is constrained, two columns on tablet and one column on narrow screens. The DOM order must remain chronological.
- Use a 1/3 supporting-column and 2/3 main-column arrangement for care actions and history only when both columns remain readable; collapse them in reading order otherwise.
- Use lime for primary actions and stable emphasis, blue for hydration or atmospheric measures, amber for attention and red for critical conditions. Every status includes text or a symbol.
- Care actions must expose their label, type and most recent occurrence, and pressed feedback may reduce the hard shadow without moving neighboring content.
- Loading, empty and error states preserve the section context and provide recovery where recovery is possible.
- Images are local product data or approved local fallbacks. Names, dates, sample identifiers, remote URLs and domain features from a visual reference are not product content.
