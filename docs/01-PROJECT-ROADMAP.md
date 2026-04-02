# Universal SAR Application — Project Roadmap (EXRUP Style)

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**
**FOSS-First. No paid dependencies. No AI watermarks.**

---

## Executive Summary

The Universal SAR (Search and Rescue) Application is a comprehensive, FOSS-first platform designed to locate any subject — humans (missing persons, fugitives, lost hikers, children), animals (lost dogs, wildlife), vehicles, and objects — using adaptive probability mapping, Bayesian updating, convex hull search perimeters, and real-time team coordination. The system handles variable and incomplete data, adapting its algorithms based on what information is available for each unique search scenario.

This roadmap follows the **EXRUP (EXtreme Rapid Unified Process)** methodology — ship in one iteration, refine continuously.

---

## Iteration 1: Full System Delivery

### Phase 1 — Foundation (Days 1–3)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Database Architecture | Polymorphic subject schema supporting humans, animals, vehicles, objects with type-specific JSON attributes | Migration SQL, schema.ts |
| Core Data Models | Search operations, probability zones, sightings, teams, resources, timeline, evidence, weather, terrain | Drizzle ORM models |
| Authentication & RBAC | Admin (angelreporters@gmail.com) and operator roles with protected procedures | Auth middleware |
| API Layer | tRPC procedures for all CRUD operations, search management, probability calculation | server/routers/*.ts |

### Phase 2 — Algorithm Engine (Days 4–6)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Convex Hull Engine | Graham Scan implementation for search perimeter generation from anchor points | shared/algorithms/convexHull.ts |
| Bayesian Probability Mapping | Prior probability distribution, likelihood updates from sightings/evidence, posterior calculation | shared/algorithms/bayesian.ts |
| Movement Prediction | Subject-type-specific movement models (Koester Lost Person Behavior data, animal behavior, vehicle patterns) | shared/algorithms/movement.ts |
| Terrain & Weather Impact | Slope analysis, vegetation density, water features, temperature/wind/precipitation effects on mobility | shared/algorithms/environment.ts |
| Snow Bridge Physics | Forensic structural analysis for winter SAR scenarios (integrated from existing Python code) | shared/algorithms/snowBridge.ts |
| Path of Least Resistance | Downhill drift modeling, drainage vector calculation, terrain trap identification | shared/algorithms/pathfinding.ts |

### Phase 3 — Frontend & Map Integration (Days 7–10)

| Task | Description | Deliverable |
|------|-------------|-------------|
| Glassmorphism Dark UI | Warm amber/gold accent theme, backdrop-blur glass panels, no cool blues | index.css, components |
| Interactive Map | Leaflet.js with OpenStreetMap tiles, probability zone overlays, sighting markers, team positions | Map component |
| Dashboard | Active searches, team status, resource allocation, timeline, alerts | Dashboard pages |
| Subject Registration Wizard | Polymorphic form adapting fields by subject type (person/animal/vehicle/object) | Registration wizard |
| Search Operation Wizard | Step-by-step search creation with automatic probability zone generation | Operation wizard |
| Evidence Management | Upload, catalog, and link evidence/photos/documents to search operations | Evidence pages |
| Analytics & Reporting | Search statistics, success rates, pattern analysis, exportable reports | Analytics pages |
| Accessibility Modes | WCAG AAA, ADHD-friendly, Dyslexic, Neuro, ECO CODE, No Blue Light | Accessibility system |

### Phase 4 — Integration & Deployment (Days 11–12)

| Task | Description | Deliverable |
|------|-------------|-------------|
| End-to-End Testing | Vitest unit tests, integration tests for all API endpoints and algorithms | Test suite |
| Documentation Suite | All 15 deliverables: roadmap, RAID, use cases, wireframes, data dictionary, etc. | docs/ folder |
| Performance Optimization | Query optimization, map rendering performance, algorithm efficiency | Optimized codebase |
| Deployment | Production build, environment configuration, checkpoint and publish | Live application |

---

## Technology Stack (FOSS-First)

| Layer | Technology | License | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React 19 | MIT | UI components and state management |
| Styling | Tailwind CSS 4 | MIT | Glassmorphism dark theme |
| Map Library | Leaflet.js | BSD-2 | Interactive map with probability overlays |
| Map Tiles | OpenStreetMap | ODbL | Base map data |
| Backend | Express + tRPC | MIT | API layer with type-safe procedures |
| Database | MySQL/TiDB | GPL/Apache | Persistent storage |
| ORM | Drizzle ORM | Apache-2.0 | Type-safe database queries |
| Algorithms | Custom TypeScript | Proprietary | Convex hull, Bayesian, movement prediction |
| Weather Data | NOAA API | Public Domain | Real-time weather for search areas |
| Elevation Data | USGS/OpenTopoData | Public Domain | Terrain analysis |
| Geospatial | Turf.js | MIT | Geometric calculations |
| Charts | Recharts | MIT | Analytics visualizations |
| Icons | Lucide React | ISC | UI iconography |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Probability zone generation | Under 2 seconds for standard search area |
| Map rendering with overlays | 60fps pan/zoom with probability heatmap |
| Subject registration | Under 60 seconds for complete entry |
| Search operation creation | Under 3 minutes with wizard |
| API response time | Under 200ms for all CRUD operations |
| Bayesian update cycle | Under 500ms per new evidence item |
| Accessibility compliance | WCAG AAA for all interactive elements |

---

## Future Iterations (Post-MVP)

The following capabilities are architected for but not fully implemented in Iteration 1. The database schema and API contracts support these extensions:

1. **Drone Swarm Integration** — Thermal/LIDAR/AI data ingestion from drone fleet management systems
2. **Satellite SAR** — Integration with Copernicus/Sentinel satellite imagery APIs
3. **Cell Phone Ping Triangulation** — Carrier data ingestion for signal-based location estimation
4. **Social Media Geolocation Mining** — Automated scraping and geolocation extraction from social posts
5. **Ground-Penetrating Radar (GPR)** — Data import and anomaly visualization from GPR survey equipment
6. **Acoustic/Seismic Detection** — Ground sensor array data processing for movement detection
7. **Electronic Nose / Scent AI** — Scent detection sensor data integration
8. **Trail Camera Networks** — Automated image analysis from distributed camera systems
9. **Underwater ROV/Sonar** — Sonar data import and underwater search zone mapping
10. **Real-time Push Notifications** — WebSocket-based team coordination alerts
11. **Machine Learning Pipeline** — Pattern analysis, probability refinement, and outcome prediction
12. **Forensic Analysis Module** — Snow bridge physics, GoPro footage analysis, construction barrier modeling
