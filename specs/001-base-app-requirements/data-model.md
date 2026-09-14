# Data Model Specification

**Feature**: Base Application Requirements (`001-base-app-requirements`)
**Date**: 2026-07-20

## Core Entities & Schema Design

### 1. `Species` (Taxonomic Catalog Entity)
Represents canonical plant species cached from the GBIF API or created manually via Django Admin.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigAutoField | Primary Key | Internal database record ID |
| `gbif_key` | IntegerField | Unique, Indexed, Nullable | GBIF API `usageKey` |
| `scientific_name` | CharField(255) | Required, Indexed | Full binomial scientific name |
| `common_name` | CharField(255) | Blankable | Primary vernacular/common name |
| `kingdom` | CharField(100) | Default: 'Plantae' | Taxonomic Kingdom |
| `phylum` | CharField(100) | Blankable | Taxonomic Phylum |
| `class_name` | CharField(100) | Blankable | Taxonomic Class |
| `order` | CharField(100) | Blankable | Taxonomic Order |
| `family` | CharField(100) | Blankable | Taxonomic Family |
| `genus` | CharField(100) | Blankable | Taxonomic Genus |
| `native_region` | JSONField | Default: dict | GeoJSON/Region metadata for origin mapping |
| `created_at` | DateTimeField | Auto now add | Record creation timestamp |
| `updated_at` | DateTimeField | Auto now | Record last modification timestamp |

#### Computed Properties
- `is_owned` (boolean): Returns `True` if `specimens.count() > 0`, otherwise `False`.

---

### 2. `Specimen` (Personal Plant Instance)
Represents an individual physical plant belonging to the user.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default uuid4 | Unique specimen identifier |
| `species` | ForeignKey -> Species | Related: `specimens`, OnDelete: PROTECT | Linked canonical species catalog record |
| `nickname` | CharField(100) | Required | Personal name given to the specimen |
| `location_in_home` | CharField(100) | Blankable | Room / microclimate location (e.g. "Living Room Window") |
| `acquired_at` | DateField | Required | Date when the plant was acquired |
| `vitality_index` | SmallIntegerField | Range: 0 to 100, Default: 100 | Vitality score percentage |
| `soil_moisture` | SmallIntegerField | Range: 0 to 100, Default: 50 | Current soil moisture percentage |
| `lux_intensity` | IntegerField | Min: 0, Default: 1000 | Current estimated sunlight intensity (Lux) |
| `photo` | ImageField / URLField | Blankable | Specimen cover photograph |
| `created_at` | DateTimeField | Auto now add | Record creation timestamp |
| `updated_at` | DateTimeField | Auto now | Record last modification timestamp |

---

### 3. `CareLog` (Specimen Care Timeline Event)
Represents historical maintenance events performed on a specimen.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default uuid4 | Unique log entry identifier |
| `specimen` | ForeignKey -> Specimen | Related: `care_logs`, OnDelete: CASCADE | Linked specimen instance |
| `type` | CharField(50) | Choices: `watering`, `fertilizing`, `repotting`, `observation` | Type of care activity |
| `timestamp` | DateTimeField | Default: now | Date and time when care was performed |
| `notes` | TextField | Blankable | Free-text observations or notes |

---

### 4. `WeatherCache` (Local Climate Cache)
Represents cached local weather and environmental forecast metrics.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigAutoField | Primary Key | Internal record ID |
| `location_key` | CharField(100) | Unique, Indexed | Location key (e.g., "lat_-23.55_lon_-46.63") |
| `temperature_c` | FloatField | Required | Current ambient temperature in Celsius |
| `humidity_pct` | IntegerField | Required | Relative humidity percentage |
| `weather_code` | IntegerField | Required | WMO weather code |
| `cached_at` | DateTimeField | Auto now | Timestamp of API cache capture |
