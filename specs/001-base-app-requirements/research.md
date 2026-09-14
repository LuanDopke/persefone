# Phase 0: Research & Architecture Decisions

**Feature**: Base Application Requirements (`001-base-app-requirements`)
**Date**: 2026-07-20

## 1. Taxonomic API & Local Caching Strategy (GBIF Integration)

### Decision
Use GBIF Species API (`https://api.gbif.org/v1/species/`) with local database caching via Django ORM.

### Rationale
- GBIF provides comprehensive botanical taxonomic data (usageKey, scientific name, hierarchy, native distribution).
- Direct client-side calls would introduce network latency and rate-limiting issues.
- Caching species data in SQLite/PostgreSQL allows <100ms lookups and partial offline functionality as required by Constitution Principle IV.

### Implementation Pattern
- Backend endpoint `/api/species/search/?q={query}` checks local DB first.
- If missing, queries GBIF API `https://api.gbif.org/v1/species/match?name={query}` or `https://api.gbif.org/v1/species/{key}`.
- Persists result into `Species` table including `gbif_key`, `scientific_name`, hierarchy fields (`kingdom`, `phylum`, `class_name`, `order`, `family`, `genus`), and geographic distribution summary.

---

## 2. Weather & Climate Data Integration

### Decision
Use Open-Meteo API for real-time weather and climate indicators, cached locally with a 1-hour TTL.

### Rationale
- Open-Meteo is free, requires no API key for non-commercial personal usage, and provides accurate temperature, humidity, and sunlight metrics.
- Caching weather metrics prevents unnecessary network overhead on every dashboard reload.

### Implementation Pattern
- Endpoint `/api/weather/current/?lat={lat}&lon={lon}` queries local cache table `WeatherCache`.
- If cache is expired (>1 hour) or missing, fetches from Open-Meteo API and updates local cache.

---

## 3. Chlorophyll Noir Design Tokens in Tailwind CSS

### Decision
Configure Tailwind CSS config (`tailwind.config.js`) to enforce "Chlorophyll Noir" design rules globally across the React application.

### Rationale
Constitution Principle I dictates strict, non-negotiable visual guidelines:
- `4px` solid borders (`border-4 border-charcoal`)
- Hard drop shadow without blur (`shadow-hard` -> `4px 4px 0px 0px #1A1A1A` or `6px 6px 0px 0px #1A1A1A`)
- `0px` border radius (`rounded-none` globally)
- Vibrant Lime (`#BDFF00`), Off-white (`#F5F5F0`), Charcoal (`#1A1A1A`)
- Lexend font family

### Configuration Strategy
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        lime: '#BDFF00',
        offwhite: '#F5F5F0',
        charcoal: '#1A1A1A',
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #1A1A1A',
        'hard-lg': '6px 6px 0px 0px #1A1A1A',
      },
      borderWidth: {
        '4': '4px',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
      },
      fontFamily: {
        mono: ['Lexend', 'monospace'],
        sans: ['Lexend', 'sans-serif'],
      }
    }
  }
}
```

---

## 4. Modular Component Architecture

### Decision
Establish a dedicated modular UI directory (`src/components/ui/`) containing single-responsibility, reusable UI components.

### Rationale
Constitution Principle III mandates that all common UI structures (Tables, Cards, Modals, Badges, Buttons, Inputs) MUST be extracted into modular, reusable components to prevent inline markup duplication across screens.

### Target Modular UI Library
- `<Table />`: Standardized table layout with neobrutalist borders, headers, and rows.
- `<Card />`: Structured container with 4px border, hard drop shadow, and configurable header/body/footer slots.
- `<Badge />`: Visual indicator for "Owned" (lime accent) vs "Missing" (grayscale) status.
- `<Button />`: Tactile button featuring hard shadow and active press animation (`translate-x-1 translate-y-1`).
- `<Modal />`: Overlay modal dialog adhering to Chlorophyll Noir styling.
- `<Input />` & `<Select />`: Standardized form control fields with sharp geometry and high-contrast focus rings.
