# Quickstart & End-to-End Validation Guide

**Feature**: Base Application Requirements (`001-base-app-requirements`)
**Date**: 2026-07-20

This guide describes how to run and validate the Persefone base application locally.

---

## 1. Prerequisites

- **Python**: 3.12+
- **Node.js**: 20+ / npm 10+
- **Git**

---

## 2. Setup Commands

### Backend (Django REST Framework)
```bash
# Navigate to backend directory (or create virtualenv at root)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start dev server
python manage.py runserver 0.0.0.0:8000
```

### Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Chlorophyll Noir Design System Verification
1. Open web application at `http://localhost:5173`.
2. Inspect cards, navigation buttons, and tables.
3. Verify visual rules:
   - All borders are 4px solid (`#1A1A1A`).
   - Shadows are hard 4px-6px drop shadows without blur.
   - Corners are 0px border radius (sharp rectangular geometry).
   - Typography uses the Lexend font.
   - Active controls use Lime accent (`#BDFF00`).

### Scenario 2: Modular UI Component Usage
1. Inspect source files under `frontend/src/components/ui/`.
2. Confirm shared components (`<Table />`, `<Card />`, `<Badge />`, `<Button />`, `<Modal />`) are imported across pages instead of inline duplicate HTML tags.

### Scenario 3: Register Specimen & Automatic Status Flip ("Missing" -> "Owned")
1. Navigate to Taxonomy Explorer. Search for a species (e.g. *Monstera deliciosa*).
2. Note that status badge renders as **Missing** (desaturated grayscale).
3. Click "Add Specimen". Fill in nickname ("Monsterina"), location ("Living Room Window"), and acquisition date.
4. Save specimen. Verify specimen profile is created.
5. Return to Taxonomy Explorer. Verify *Monstera deliciosa* status badge now renders as **Owned** (vibrant lime accent).

### Scenario 4: Log Care Activity (Mobile Touch Flow)
1. Switch browser developer tools to mobile view (e.g., iPhone 14 viewport).
2. Access specimen profile or Quick Action button.
3. Tap "Water Plant" care action. Add optional note ("150ml filtered water").
4. Submit action in under 3 taps.
5. Verify timeline updates immediately with timestamped CareLog entry.

### Scenario 5: Local Cache Verification (<100ms Load)
1. Perform a GBIF taxonomy lookup for a new species.
2. Refresh the page or re-query the species.
3. Verify response is served instantly from local database cache without outbound GBIF API delay (<100ms response).
