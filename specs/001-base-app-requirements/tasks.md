# Tasks: Base Application Requirements

**Input**: Design documents from `/specs/001-base-app-requirements/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/api-contracts.json`, `research.md`, `quickstart.md`, `constitution.md`

**Tests & Validation**: Per Constitution Principle VI, **every single implementation task is paired with an automated test task**. Tests are written/configured and executed upon task completion to validate correctness.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic testing framework setup.

- [X] T001 Initialize Django DRF backend project structure in `backend/manage.py` and `backend/core/settings.py`
- [X] T002 Initialize React Vite frontend project structure with Tailwind CSS in `frontend/package.json` and `frontend/vite.config.js`
- [X] T003 [P] Configure Pytest test runner for Django backend in `backend/pytest.ini` and `backend/conftest.py`
- [X] T004 [P] Configure Vitest and React Testing Library for frontend in `frontend/vite.config.js` and `frontend/src/test/setup.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core visual design system tokens and shared modular UI component library.

- [X] T005 [P] Create shared modular UI component test suite in `frontend/src/components/ui/__tests__/ui_primitives.test.jsx`
- [X] T006 [P] Implement Chlorophyll Noir design tokens (4px border, hard shadow, 0px radius, Lexend font) in `frontend/tailwind.config.js` and `frontend/src/styles/index.css`
- [X] T007 Implement shared modular `<Button />` and `<Card />` components in `frontend/src/components/ui/Card.jsx` and `frontend/src/components/ui/Button.jsx`
- [X] T008 [P] Implement shared modular `<Table />` component in `frontend/src/components/ui/Table.jsx`
- [X] T009 [P] Implement shared modular `<Badge />` component for Owned/Missing states in `frontend/src/components/ui/Badge.jsx`
- [X] T010 [P] Implement shared modular `<Modal />` component in `frontend/src/components/ui/Modal.jsx`
- [X] T011 Execute component test suite in `frontend/src/components/ui/__tests__/ui_primitives.test.jsx` to validate modular UI primitives

---

## Phase 3: User Story 1 - Unified Visual Identity & Desktop/Mobile Navigation (Priority: P1) 🎯 MVP

**Goal**: Deliver a responsive application shell adhering strictly to the "Chlorophyll Noir" neobrutalist aesthetic across desktop and mobile viewports.

**Independent Test**: Mount the application shell in Vitest/RTL across desktop and mobile viewport sizes to verify high contrast, 4px solid borders, hard drop shadows, and responsive navigation.

- [X] T012 [P] [US1] Write frontend navigation and responsive shell tests in `frontend/src/components/layout/__tests__/AppShell.test.jsx`
- [X] T013 [P] [US1] Create main Navbar and Sidebar components in `frontend/src/components/layout/Navbar.jsx` and `frontend/src/components/layout/Sidebar.jsx`
- [X] T014 [US1] Implement main App Layout shell with desktop sidebar & mobile responsive drawer in `frontend/src/components/layout/AppShell.jsx`
- [X] T015 [US1] Execute AppShell test in `frontend/src/components/layout/__tests__/AppShell.test.jsx` to validate responsive shell layout

---

## Phase 4: User Story 2 - Specimen & Taxonomic Data Cataloging (Priority: P2)

**Goal**: Register and manage individual plant specimens linked to canonical species catalog entries with automatic "Missing" to "Owned" status transitions and care log history.

**Independent Test**: Register a specimen for an uncataloged species, verify the species status automatically flips from "Missing" (desaturated) to "Owned" (vibrant lime), and log care events on the timeline.

- [X] T016 [P] [US2] Write unit tests for `Species`, `Specimen`, and `CareLog` models in `backend/catalog/tests/test_models.py` and `backend/specimens/tests/test_models.py`
- [X] T017 [P] [US2] Create `Species` catalog model with computed `is_owned` property in `backend/catalog/models.py`
- [X] T018 [P] [US2] Create `Specimen` model and `CareLog` model in `backend/specimens/models.py`
- [X] T019 [US2] Create serializers for `Species`, `Specimen`, and `CareLog` in `backend/catalog/serializers.py` and `backend/specimens/serializers.py`
- [X] T020 [US2] Execute model tests in `backend/catalog/tests/test_models.py` and `backend/specimens/tests/test_models.py` to validate entity relations and `is_owned` logic
- [X] T021 [P] [US2] Write API endpoint contract tests in `backend/specimens/tests/test_api.py`
- [X] T022 [US2] Implement Specimen & CareLog API viewsets in `backend/specimens/views.py` and configure routing in `backend/specimens/urls.py`
- [X] T023 [US2] Execute API contract tests in `backend/specimens/tests/test_api.py` to validate CRUD endpoints
- [X] T024 [P] [US2] Write React component tests for Specimen Card and Care Log Timeline in `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx`
- [X] T025 [US2] Implement Specimen List and Registration Modal using modular UI components in `frontend/src/pages/SpecimenCatalog.jsx`
- [X] T026 [US2] Implement Care Log Timeline component in `frontend/src/components/specimen/CareLogTimeline.jsx`
- [X] T027 [US2] Execute React component test in `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx` to validate specimen catalog page and care log UI

---

## Phase 5: User Story 3 - Offline-Resilient & Local Cache Integration (Priority: P3)

**Goal**: Fetch and locally cache GBIF species taxonomic data and Open-Meteo climate indicators to guarantee <100ms lookup times and partial offline availability.

**Independent Test**: Perform a GBIF taxonomy search or climate query, verify data persists in local database cache, and re-query to confirm response renders in <100ms without network delay.

- [X] T028 [P] [US3] Write tests for GBIF service API fetcher and local cache handler in `backend/catalog/tests/test_gbif_service.py`
- [X] T029 [P] [US3] Write tests for Weather service cache handler in `backend/weather/tests/test_weather_service.py`
- [X] T030 [US3] Implement GBIF API search & local cache persistence service in `backend/catalog/services.py`
- [X] T031 [US3] Implement Open-Meteo climate API fetcher & `WeatherCache` service in `backend/weather/services.py`
- [X] T032 [US3] Create API endpoints `/api/species/search-gbif/` and `/api/weather/current/` in `backend/catalog/views.py` and `backend/weather/views.py`
- [X] T033 [US3] Execute GBIF and Weather service tests in `backend/catalog/tests/test_gbif_service.py` and `backend/weather/tests/test_weather_service.py` to validate caching performance (<100ms response)
- [X] T034 [P] [US3] Write TanStack Query cache integration tests in `frontend/src/services/__tests__/api_cache.test.js`
- [X] T035 [US3] Configure TanStack Query client & cache provider in `frontend/src/services/apiClient.js`
- [X] T036 [US3] Implement Climate & Weather Dashboard Widget in `frontend/src/components/dashboard/WeatherWidget.jsx`
- [X] T037 [US3] Execute frontend cache test in `frontend/src/services/__tests__/api_cache.test.js` to validate query caching and offline fallback

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final end-to-end integration suite and validation against quickstart scenarios.

- [X] T038 [P] Write end-to-end integration test suite in `frontend/src/test/e2e_smoke.test.jsx` covering full quickstart validation flows
- [X] T039 Execute full backend test suite with `pytest` in `backend/`
- [X] T040 Execute full frontend test suite with `npm test` in `frontend/`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion.
- **Phase 3 (User Story 1 - MVP)**: Depends on Phase 2 completion.
- **Phase 4 (User Story 2)**: Depends on Phase 2 completion (can run in parallel with or after US1).
- **Phase 5 (User Story 3)**: Depends on Phase 2 completion (can run in parallel with or after US2).
- **Phase 6 (Polish)**: Depends on Phase 3, Phase 4, and Phase 5 completion.

### Within Each User Story
- Test creation tasks marked `[P]` are defined alongside models/services.
- Code implementation is followed immediately by test execution tasks to validate the increment before progressing.

---

## Implementation Strategy

1. **MVP First (User Story 1)**: Complete Phase 1, Phase 2, and Phase 3. Validate visual identity and responsive shell.
2. **Incremental Delivery**: Add Phase 4 (Specimen & Care Cataloging), then Phase 5 (GBIF & Weather Caching).
3. **Continuous Verification**: Every task completed is validated by running its corresponding automated test suite.
