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

## Bug Fixes — Backend CRUD Not Working
- [x] Diagnose why tRPC mutations fail on submit (check db helpers, schema, routers)
- [x] Fix database query helpers (db.ts) to properly insert/select from MySQL
- [x] Fix tRPC routers to handle all input fields correctly (undefined → null)
- [x] Fix New Search wizard form to submit and create operation + subject
- [x] Fix Sightings form to submit and create sightings
- [x] Fix Teams form to submit and create teams
- [x] Fix Evidence form to submit and create evidence
- [x] Fix Operations list to load and display real operations from DB
- [x] Fix Operation Detail page to load real data
- [x] Fix Live Map to plot data from real operations (hooks crash fixed)
- [x] Fix Command Center dashboard stats to show real counts
- [x] Add proper error handling with user-friendly toast messages on all forms
- [x] Test all CRUD operations end-to-end
- [x] Fix circumstances column varchar(64) → text
- [x] Fix SAR engine minimum radius (0.1km → 1km+ minimum per subject type)

## Python Backend Integration — Real Terrain Analyst
- [x] Install Python deps (requests, pandas, numpy, matplotlib, scipy, folium, flask)
- [x] Deploy terrain_analyst.py as Flask API microservice on port 5001
- [x] Create /api/analyze endpoint (full pipeline: elevation + terrain + OSM + GPR + report)
- [x] Create /api/elevation endpoint (Module 1 only)
- [x] Create /api/features endpoint (Module 3 OSM only)
- [x] Create /api/gpr-protocol endpoint (Module 4 only)
- [x] Wire tRPC operations.create to call Python API for real terrain analysis
- [x] Wire tRPC operations.runAnalysis to re-run analysis on demand
- [x] Store terrain analysis results in DB (terrainData JSON field)
- [x] Update OperationDetail page to show real anomaly data, GPR protocol, terrain stats
- [x] Add temperature input to NewOperation wizard (Step 3)
- [x] Add search radius input to NewOperation wizard (Step 3)
- [x] Test with real Sun Peaks data: 50.8812, -119.8925, -26C
- [x] Verify real elevation data returns from OpenTopoData (1224-1517m confirmed)
- [x] Verify real OSM features return from Overpass API (waterways, roads confirmed)
- [x] Verify anomaly detection runs on real data (227 anomalies detected)
- [x] Verify GPR protocol generates correctly for -26C (dielectric 3.5 confirmed)
- [x] All forms submit and persist — no demo data anywhere

## Documentation & GitHub Push
- [ ] README.md — complete setup guide, architecture, tech stack
- [ ] DATA_DICTIONARY.md — every field mapped to DB column with types/constraints
- [ ] DATABASE_ARCHITECTURE.md — all 8 tables with schemas and relationships
- [ ] API_DOCS.md — every tRPC and Flask endpoint documented
- [ ] FIELD_MAPPING.md — UI form field to DB column mapping for every form
- [ ] CHANGELOG.md — complete build and fix history
- [ ] Push to GitHub: midnghtsapphire/universal-sar-app
