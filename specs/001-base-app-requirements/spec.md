# Feature Specification: Base Application Requirements

**Feature Branch**: `001-base-app-requirements`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Persefone (Botanical Archival System) — Requisitos Base do Aplicativo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Visual Identity & Desktop/Mobile Navigation (Priority: P1)

As a plant enthusiast, I want to access Persefone with a high-contrast "Chlorophyll Noir" visual interface across desktop and mobile browsers, so that I have a consistent, tactile, and responsive archival experience.

**Why this priority**: The visual identity ("Chlorophyll Noir" neobrutalism) and responsive layout framework form the foundational user interface for all functional screens (Dashboard, Taxonomy Explorer, Care Logs).

**Independent Test**: Can be tested by opening the web app on both desktop and mobile viewports to verify contrast, "Chlorophyll Noir" design rules (hard drop shadows, 4px borders, rectangular geometry, Lexend font), and basic application shell navigation.

**Acceptance Scenarios**:

1. **Given** a user navigates to any application screen, **When** components render, **Then** all cards, buttons, and panels feature 4px hard dark drop shadows, 4px solid borders, 0px border radius (sharp rectangular corners), and high-contrast typography.
2. **Given** a user opens the app on a mobile device or narrow viewport, **When** interacting with plant registration and care actions, **Then** the interface adjusts cleanly to mobile touch-friendly controls while preserving high-contrast visibility.
3. **Given** a specimen or taxonomy entry, **When** its status is "Owned", **Then** it renders with full vibrant color accents; **When** its status is "Missing", **Then** it renders in desaturated grayscale visual contrast.

---

### User Story 2 - Specimen & Taxonomic Data Cataloging (Priority: P2)

As a plant archivist, I want to manage individual plant specimens linked to standard taxonomic species entries, so that my personal plant inventory maintains biological hierarchy accuracy and status tracking.

**Why this priority**: Core domain capabilities require linking personal plants (specimens) with standardized species information (GBIF taxons) to enable both care tracking and taxonomic completion visual states ("Owned" vs "Missing").

**Independent Test**: Can be tested by creating a specimen entry linked to a species catalog item, updating its vitality and location metrics, and validating that the species status updates to "Owned".

**Acceptance Scenarios**:

1. **Given** a new plant is acquired, **When** the user registers the specimen with a species reference, nickname, acquisition date, and location, **Then** the system records the specimen under the specified taxonomic hierarchy.
2. **Given** a species catalog item with no associated specimens, **When** the first specimen of that species is registered, **Then** the species status automatically flips from "Missing" (grayscale) to "Owned" (vibrant).
3. **Given** an existing specimen, **When** the user updates vital indicators (vitality index, soil moisture, lux intensity) or care timeline logs, **Then** the specimen profile reflects updated vital metrics and timestamped care history.

---

### User Story 3 - Offline-Resilient & Local Cache Integration (Priority: P3)

As a user with intermittent network connectivity, I want external taxonomic and meteorological queries cached locally, so that previous catalog searches and care data remain accessible without redundant external requests.

**Why this priority**: Improves application performance, reduces external API dependence (GBIF & Weather services), and provides partial offline availability for personal specimen management.

**Independent Test**: Can be tested by fetching species or weather details once, disconnecting network connectivity, and verifying that previously fetched data displays seamlessly from local storage.

**Acceptance Scenarios**:

1. **Given** a taxonomic species query previously retrieved from the GBIF API, **When** the user accesses that species again, **Then** the data renders instantly from the local cached store without triggering an outbound API call.
2. **Given** network failure or offline state, **When** the user views previously loaded specimen vitals and taxonomic data, **Then** the application displays cached records cleanly without application crash or white-screen errors.

---

### Edge Cases

- What happens when an external API (GBIF or Weather) rate-limits or goes offline during an uncached query? The application displays a high-contrast error notice with cached fallback data where available.
- How does the system handle a specimen whose species has missing native region data? The map display renders a graceful placeholder notice ("Region data unavailable") without breaking the taxonomy card layout.
- What happens when all specimens of a species are deleted? The species auto-calculated status reverts from "Owned" back to "Missing" (grayscale).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce the "Chlorophyll Noir" design system globally, featuring vibrant lime (`#BDFF00`) accents, off-white background surfaces, charcoal/black outlines, 4px solid borders, hard 4px-6px drop shadows without blur, and 0px border radius across all UI elements.
- **FR-002**: System MUST render "Owned" species and specimens with full saturated color accents, and "Missing" (uncataloged) items with desaturated grayscale styling.
- **FR-003**: System MUST support single-owner specimen management, anchoring each individual plant (`Specimen`) to a canonical taxonomic entity (`Species`).
- **FR-004**: System MUST maintain timestamped `CareLog` timelines for each specimen, capturing care action types (watering, fertilizing, repotting, observation) and free-text notes.
- **FR-005**: System MUST record specimen vitals including vitality index, soil moisture, lux intensity, home location, acquisition date, and specimen photograph.
- **FR-006**: System MUST persist taxonomic hierarchy metadata (kingdom, phylum, class, order, family, genus, scientific name, common name, native region) and cache GBIF species details in the database to prevent duplicate queries.
- **FR-007**: System MUST provide high-contrast, visible focus states for keyboard navigation and screen accessibility.
- **FR-008**: System MUST optimize primary layouts for desktop analytical views while ensuring quick care logging features are mobile-friendly and touch-responsive.

### Key Entities

- **Species**: Represents taxonomic plant catalog entries. Key attributes: `gbif_key`, `scientific_name`, `common_name`, `kingdom`, `phylum`, `class_name`, `order`, `family`, `genus`, `native_region`, and auto-computed `is_owned` status.
- **Specimen**: Represents an individual plant owned by the user. Key attributes: `species` (reference), `nickname`, `location_in_home`, `acquired_at`, `vitality_index`, `soil_moisture`, `lux_intensity`, and `photo`.
- **CareLog**: Represents historical care activities for a specimen. Key attributes: `specimen` (reference), `type` (watering, fertilizing, repotting, observation), `timestamp`, and `notes`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of UI components adhere to the "Chlorophyll Noir" visual tokens (4px solid borders, zero border radius, hard shadow, Lexend typography).
- **SC-002**: Previously fetched species details render in under 100ms when loaded from local cache.
- **SC-003**: Users can log a care action (e.g., watering) in 3 clicks or taps or under 10 seconds on mobile devices.
- **SC-004**: 100% of interactive components (buttons, inputs, navigation links) demonstrate visible keyboard focus rings for accessibility.

## Assumptions

- Single-user / personal scope for version 1; multi-tenant user isolation and social collaboration are out of scope.
- Automated computer-vision plant identification from photographs is out of scope for v1.
- Push notifications on mobile devices are out of scope for v1.
- Database caching will serve as the primary offline resilience mechanism for previously visited species and specimens.
