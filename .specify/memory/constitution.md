<!--
Sync Impact Report:
- Version change: v1.1.0 → v1.2.0
- List of modified principles:
  - Updated: VI. Test-Driven Task Validation (Strict Execution Pipeline: Task -> Test Validation -> Mark Completed)
- Added sections: Mandatory 3-step task execution lifecycle (Task -> Test -> Mark Complete)
- Removed sections: None
- Templates requiring updates:
  - ✅ plan-template.md (Task execution pipeline verified)
  - ✅ spec-template.md (Testing alignment verified)
  - ✅ tasks-template.md (Task-level test generation alignment verified)
  - ✅ plan.md (Updated Constitution Check with Principle VI v1.2.0)
- Follow-up TODOs: None
-->

# Persefone Constitution

## Core Principles

### I. Chlorophyll Noir Aesthetic & Design System
All user interfaces MUST strictly follow the "Chlorophyll Noir" neobrutalist design system:
- Solid **4px borders** on all structured UI components and containers.
- Hard drop shadows of **4px to 6px** with zero blur.
- Rectangular geometry with **0px border-radius** (sharp corners) on 100% of components.
- Color palette: Vibrant Lime (`#BDFF00`) for active actions/states, Off-white background, Charcoal (`#1A1A1A`) for borders and text contrast.
- Visual status differentiation: **Owned** items render in full vibrant color; **Missing** (uncataloged) items render in desaturated grayscale.
- Typography: **Lexend** bold headers and technical data labels. No soft gradients or organic rounded elements.

### II. Mobile-Responsive & Fluid Interface
The application interface MUST be responsive across desktop and mobile screens:
- Desktop viewports MUST present high-density, analytical data layouts (climate widgets, care timelines, taxonomy tree explorers).
- Mobile viewports MUST adapt key interaction flows (Quick Actions, Care Log entries, Specimen registration) to touch-friendly, single-column responsive layouts.
- Latency MUST remain minimal; UI transitions MUST feel raw, tactile, and immediate.

### III. Modular Component Architecture
Codebases MUST be structured using modular, reusable components:
- Shared UI primitives (e.g., `<Table />`, `<Card />`, `<Button />`, `<Modal />`, `<Badge />`, `<Input />`) MUST be created in a central component library and imported wherever tables, cards, or controls are required.
- Ad-hoc, inline duplication of tabular markup or card layouts across different pages is strictly forbidden.
- Components MUST be self-contained, single-responsibility, and reusable.

### IV. Local-First Caching & Offline Resilience
External data queries (GBIF Species API, weather services) MUST be cached locally in the database:
- Local database cache MUST serve previously retrieved species and climate data, ensuring view loads in under 100ms.
- Intermittent connectivity or API failure MUST degrade gracefully using cached fallback data without disrupting core personal specimen tracking.

### V. Specimen & Taxonomy Data Integrity
Data models MUST maintain strict biological hierarchy and ownership rules:
- Every user plant (`Specimen`) MUST link to a canonical `Species` entity (containing Kingdom → Genus hierarchy).
- `Species.is_owned` status MUST be dynamically calculated based on whether at least one user `Specimen` exists for that species.
- Care logs (`CareLog`) MUST maintain immutable historical timestamps for watering, fertilizing, repotting, and observation events.

### VI. Test-Driven Task Validation (Strict Task -> Test -> Done Pipeline)
Every task MUST strictly adhere to a 3-step execution pipeline:
1. **Task Execution (`Tarefa`)**: Code implementation for the specific unit of work.
2. **Test Validation (`Validação pelos Testes`)**: Automatic execution of the corresponding unit/integration/contract test.
3. **Completion Check (`Check de Completo [X]`)**: Marking the task checkbox as completed (`[X]`) in `tasks.md` ONLY after the validating test passes.

## Architectural & Development Constraints

- **Backend Architecture**: Built with Django + Django REST Framework (DRF), utilizing SQLite for local development and PostgreSQL for production. Django Admin MUST remain enabled for internal data curation.
- **Frontend Framework**: Built with React (Vite bundler) and Tailwind CSS (configured for neobrutalist border/shadow utilities), utilizing React Router for navigation and React Query (TanStack Query) for asynchronous state and cache management.
- **Data Visualizations**: Recharts for plant vital statistics and Leaflet / OpenStreetMap for geographical species native region mapping.

## Development & Quality Workflow

- **Execution Lifecycle**: All AI agents and developers MUST strictly follow the lifecycle: `Task Code Implementation -> Execute Test Suite -> Mark Task Complete [X]`.
- **Modular UI First**: When implementing new screens, existing shared modular components MUST be reused. If a new UI pattern is introduced, it MUST be extracted into a shared modular component first.
- **High-Contrast Accessibility**: All interactive elements MUST provide clear, visible high-contrast focus indicators for keyboard navigation.
- **Performance Thresholds**: Cached species lookups and navigation transitions MUST render in under 100ms.

## Governance

1. **Constitution Supersedes Ad-Hoc Decisions**: This document defines the non-negotiable architectural and design principles for Persefone. All feature specs, implementation plans, and code reviews MUST comply with these principles.
2. **Amendment Process**: Proposed amendments require explicit reasoning, documentation of impacted templates/components, and a semantic version bump:
   - **MAJOR**: Removal or breaking change to core design system or architectural principles.
   - **MINOR**: Addition of new design principles or architectural constraints.
   - **PATCH**: Non-functional wording, formatting, or clarification updates.
3. **Compliance Review**: Every pull request and plan MUST pass the "Constitution Check" before implementation begins.

**Version**: 1.2.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
