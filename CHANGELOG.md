# Changelog

All notable changes to the Universal SAR Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.

## [1.0.0] - 2026-04-02

### Added
- Initial release of Universal SAR Application
- Polymorphic subject tracking system (humans, animals, vehicles, objects)
- Core SAR algorithm engine: convex hull, Bayesian probability mapping, movement prediction
- Interactive map interface with OpenStreetMap/Leaflet.js and probability zone visualization
- Comprehensive database schema with 9 tables supporting full SAR operations
- tRPC API with type-safe procedures for all CRUD operations
- Search operation creation wizard with step-by-step guided flow
- Sighting reporting with automatic Bayesian probability updates
- Team management and deployment tracking
- Evidence cataloging and management
- Timeline event logging for all operations
- Analytics dashboard with search statistics
- Glassmorphism dark UI with warm amber/gold accents
- Accessibility modes: WCAG AAA, ADHD-Friendly, Dyslexic, Neuro, ECO CODE, No Blue Light
- Lost Person Behavior statistics integration (Koester data)
- Snow bridge physics calculation (ported from forensic Python code)
- Terrain impact analysis with slope, vegetation, and water feature assessment
- Weather integration via Open-Meteo API
- Complete documentation suite: roadmap, RAID sheet, use cases, wireframes, data dictionary, pseudo code, resources list
- FOSS-first technology stack — no paid dependencies

## [1.1.0] - 2026-04-02 — CRUD Fixes + Error Handling

### Added
- 39 automated tests (14 SAR engine + 24 API + 1 auth) including negative-path and edge case tests
- `onError` toast notifications on all forms — users see descriptive error messages instead of silent failures
- `onSuccess` toast notifications on all forms — confirmation messages on successful submission
- Client-side validation with `toast.error()` for required fields before API calls
- Global footer in DashboardLayout with copyright and FOSS attribution

### Fixed
- All form submissions now properly call tRPC mutations and persist to MySQL database
- Operations list now shows all created operations from database
- Sightings list now shows all sightings for selected operation
- Teams list now shows all created teams
- Evidence catalog now shows all evidence for selected operation
- Command Center stats now show real counts from database

## [2.0.0] - 2026-04-02 — Python Terrain Analyst Integration

### Added
- Python Flask microservice (`python-backend/api_server.py`) wrapping terrain analyst pipeline on port 5001
- `terrain_analyst.py` — Full terrain analysis pipeline with 7 modules: elevation grid (OpenTopoData SRTM 30m), terrain analysis (slope/aspect/curvature/anomaly detection Phase 1/2/3), OSM feature fetch (Overpass API), GPR protocol generator, Folium interactive map, Matplotlib plots, JSON+Markdown report
- 7 Python API endpoints: `/health`, `/api/analyze`, `/api/elevation`, `/api/features`, `/api/gpr-protocol`, `/api/terrain-analysis`, `/api/map`
- `operations.runTerrainAnalysis` tRPC mutation — triggers Python API on demand from Operation Detail page
- Async terrain analysis on operation creation — every new operation automatically calls the Python API and stores results in `terrainData` JSON column
- Terrain Analysis and GPR Protocol tabs on Operation Detail page
- Temperature and Search Radius fields added to New Operation wizard Step 3
- `analytics.weather` tRPC query — real weather from Open-Meteo API
- `analytics.movementProfile` tRPC query — Koester LPB movement profiles by subject type
- `analytics.snowBridge` tRPC query — snow bridge structural analysis (ported from Python forensic code)

### Fixed
- `circumstances` column changed from `VARCHAR(64)` to `TEXT` — was truncating long circumstance descriptions
- `undefined` to `null` conversion in all create handlers — was causing MySQL "Field doesn't have a default value" errors
- Live Map React hooks violation — `useQuery` called inside `.map()` loop causing crash; refactored to single query
- SAR engine minimum radius — now enforces minimum 1 hour elapsed and per-subject minimums (1 km human, 0.5 km animal, 10 km vehicle)
- SARMap `fitBounds` — now includes zone centers and team positions in bounds calculation
