# Implementation Plan: Base Application Requirements

**Branch**: `001-base-app-requirements` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-base-app-requirements/spec.md`

## Summary

Build the baseline application architecture, data models, API endpoints, local caching layer, and Chlorophyll Noir design system for **Persefone (Botanical Archival System)**.

This feature establishes:
1. Django + DRF backend setup with SQLite/PostgreSQL, single-owner specimen model (`Species`, `Specimen`, `CareLog`, `WeatherCache`), and GBIF/Open-Meteo local caching.
2. React + Vite + Tailwind CSS frontend setup with global "Chlorophyll Noir" styling rules (4px solid borders, hard 4px-6px shadows, 0px border radius, Lexend font, `#BDFF00` accent, owned vs missing visual states).
3. Centralized modular UI component library (`src/components/ui/` containing `<Table />`, `<Card />`, `<Badge />`, `<Button />`, `<Modal />`, `<Input />`).
4. End-to-end data integration and mobile-responsive layouts.

## Technical Context

**Language/Version**: Python 3.12 (Django 5.x, DRF) + React 18+ (Vite, JS/TypeScript)
**Primary Dependencies**: Django, `djangorestframework`, `django-cors-headers`, `djangorestframework-simplejwt`, React, Vite, Tailwind CSS, React Router, TanStack Query (React Query), Recharts, Leaflet / OpenStreetMap
**Storage**: SQLite (development), PostgreSQL (production)
**Testing**: Pytest / Django `TestCase` (backend); Vitest + React Testing Library (frontend)
**Target Platform**: Desktop analytical web browser & Mobile touch-friendly responsive interface
**Project Type**: Web application (Django DRF backend + React Vite frontend)
**Performance Goals**: Local cached taxonomy/specimen lookups load in <100ms; fluid 60fps UI transitions
**Constraints**: Chlorophyll Noir neobrutalist aesthetics, 100% modular component reuse (no duplicate inline tables/cards), local database caching for external APIs, single-owner model scope
**Scale/Scope**: Personal botanical collection management & taxonomy archive

## Constitution Check

*GATE: All principles from .specify/memory/constitution.md MUST be satisfied.*

| Principle | Compliance Status | Rationale |
|---|---|---|
| **I. Chlorophyll Noir Aesthetic & Design System** | ✅ PASS | Tailwind config enforces 4px solid borders, hard shadows (`shadow-hard`), 0px border radius, Lexend typography, `#BDFF00` accent, and saturated vs desaturated states. |
| **II. Mobile-Responsive & Fluid Interface** | ✅ PASS | Desktop provides high-density data views; mobile viewports adapt quick action buttons and care logging to single-column touch targets. |
| **III. Modular Component Architecture** | ✅ PASS | Central `src/components/ui/` library provides reusable `<Table />`, `<Card />`, `<Badge />`, `<Button />`, `<Modal />`, `<Input />` components. |
| **IV. Local-First Caching & Offline Resilience** | ✅ PASS | GBIF Species API and Open-Meteo climate queries cached in local DB (`Species`, `WeatherCache`) to ensure <100ms load times. |
| **V. Specimen & Taxonomy Data Integrity** | ✅ PASS | Canonical `Species` linked to `Specimen` instances with dynamic `is_owned` calculation and immutable `CareLog` records. |
| **VI. Test-Driven Task Validation** | ✅ PASS | Every task follows the strict pipeline: Task Code Implementation -> Automated Test Execution -> Mark Task Complete (`[X]`). |

## Project Structure

### Documentation (this feature)

```text
specs/001-base-app-requirements/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 output (GBIF caching, weather, Tailwind design tokens, modular UI)
├── data-model.md        # Phase 1 output (Species, Specimen, CareLog, WeatherCache schemas)
├── contracts/
│   └── api-contracts.json # OpenAPI REST endpoints
├── quickstart.md        # Phase 1 output (Validation scenarios and run instructions)
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Layout

```text
backend/
├── manage.py
├── core/                # Django project settings, CORS, authentication
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── catalog/             # Species & GBIF caching domain
│   ├── models.py
│   ├── serializers.py
│   ├── services.py      # GBIF API integration & cache handler
│   ├── views.py
│   └── urls.py
├── specimens/           # User plant specimens & CareLog domain
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── weather/             # Climate & Open-Meteo caching domain
    ├── models.py
    ├── services.py
    ├── views.py
    └── urls.py

frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js    # Chlorophyll Noir design tokens (4px border, hard shadow, 0px radius, Lexend)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── assets/
│   ├── components/
│   │   ├── ui/          # Shared modular UI library (<Table />, <Card />, <Badge />, <Button />, <Modal />, <Input />)
│   │   └── layout/      # Navbar, Sidebar, App Shell
│   ├── pages/           # Dashboard, Taxonomy Explorer, Specimen Detail
│   ├── services/        # Axios API client & TanStack Query hooks
│   └── styles/          # index.css (global resets & Lexend font imports)
└── tests/
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Structure complies fully with standard Django REST + React Vite architecture. |

## Phase Output Artifacts

- **Phase 0 (Research)**: [research.md](./research.md)
- **Phase 1 (Data Model & Contracts)**: [data-model.md](./data-model.md), [contracts/api-contracts.json](./contracts/api-contracts.json), [quickstart.md](./quickstart.md)
