# Universal SAR App — Project TODO

## Documentation
- [x] Project roadmap (EXRUP style)
- [x] RAID sheet (Risks, Assumptions, Issues, Dependencies)
- [x] Comprehensive use cases (all scenarios)
- [x] Wireframe descriptions for every screen
- [x] Data dictionary (every field, table, relationship)
- [x] Database architecture document
- [x] System architecture / blueprint
- [x] Project plan with tasks and dependencies
- [x] Kanban / task backlog
- [x] Pseudo code for core algorithms
- [x] Resources list (FOSS first)
- [x] Input analysis (variable attributes by subject type)
- [x] CHANGELOG.md

## Database & Backend
- [x] Polymorphic subjects table (humans, animals, vehicles, objects)
- [x] Search operations table
- [x] Probability zones table
- [x] Sightings table
- [x] Search teams table
- [x] Timeline/events table
- [x] Evidence/documents table
- [x] Sensor data table (drone, GPR, acoustic, etc.)
- [x] Database migrations generated and applied
- [x] Database query helpers (server/db.ts)
- [x] tRPC API: subject registration (polymorphic)
- [x] tRPC API: search operation CRUD
- [x] tRPC API: probability zone calculation
- [x] tRPC API: sighting reporting (with Bayesian update trigger)
- [x] tRPC API: team coordination
- [x] tRPC API: weather integration (Open-Meteo API)
- [x] tRPC API: evidence management
- [x] tRPC API: analytics/reporting

## Core SAR Algorithm Engine
- [x] Convex hull calculation (Graham scan)
- [x] Bayesian probability mapping
- [x] Movement prediction by subject type (Koester LPB data)
- [x] Terrain/weather impact analysis
- [x] Lost Person Behavior statistics (Koester data)
- [x] Snow bridge physics integration (ported from Python)
- [x] Maximum travel radius by conditions
- [x] Condition adjustment factors
- [x] Master SAR analysis orchestrator

## Frontend
- [x] Glassmorphism dark UI theme with warm amber/gold accents
- [x] Dashboard layout with sidebar navigation
- [x] Command Center dashboard (Home)
- [x] New Search Operation wizard (polymorphic subject form)
- [x] Active Operations list page
- [x] Operation Detail page (map, zones, timeline, teams, sightings)
- [x] Interactive Live Map with Leaflet.js / OpenStreetMap
- [x] Sightings reporting and listing page
- [x] Team management page
- [x] Evidence cataloging page
- [x] Analytics/reporting page
- [x] Snow Bridge forensic analysis page
- [x] Documentation page (algorithms, API, resources, data dictionary)
- [x] App.tsx routing for all 10+ pages

## Testing
- [x] SAR algorithm unit tests (14 tests passing)
- [x] API integration tests (14 tests passing)
- [x] Auth logout test (1 test passing)

## Revvel Standards
- [x] Global footer: All Rights Reserved 2010-2026 Freedom Angel Corp / Audrey Evans
- [x] FOSS attribution footer on all pages (via DashboardLayout)
