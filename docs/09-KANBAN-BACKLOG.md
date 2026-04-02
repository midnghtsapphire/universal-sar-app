# Universal SAR Application — Kanban Backlog

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## Done

| ID | Item | Acceptance Criteria |
|----|------|-------------------|
| K-01 | Database schema design | All 9 tables defined in drizzle/schema.ts with proper types, relations, and indexes |
| K-02 | Migration generation and application | SQL migrations generated and applied; database matches schema |
| K-03 | Subject CRUD API | Create, read, update subjects with polymorphic attributes; Zod validation |
| K-04 | Operation CRUD API | Create, read, update, close operations; status transitions enforced |
| K-05 | Sighting reporting API | Create sightings with location, confidence, type; triggers Bayesian update |
| K-06 | Team management API | Create, assign, update teams; status tracking |
| K-07 | Evidence management API | Upload, catalog, associate evidence with operations |
| K-08 | Convex hull algorithm | Graham Scan implementation; generates GeoJSON polygon from anchor points |
| K-09 | Bayesian probability engine | Grid initialization from priors; likelihood updates from sightings; normalization |
| K-10 | Movement prediction | Subject-type profiles from Koester data; condition adjustments |
| K-11 | Terrain/weather analysis | Slope penalty, vegetation factor, water proximity, temperature impact |
| K-12 | Snow bridge physics | Ported from Python; structural capacity calculation with sensitivity analysis |
| K-13 | Glassmorphism dark theme | Warm amber/gold accents, backdrop-blur panels, no cool blues |
| K-14 | Dashboard layout | Sidebar navigation, stats cards, active operations, recent activity |
| K-15 | Interactive map component | Leaflet.js with OSM tiles, probability overlay, markers, layers |
| K-16 | Search wizard | 4-step guided flow: type → details → location → parameters |
| K-17 | Operation detail/map view | Full-screen map with probability zones, sightings, teams, timeline |
| K-18 | Team management page | Team list, status, assignment, creation dialog |
| K-19 | Evidence management page | Grid view, upload, metadata, chain of custody |
| K-20 | Analytics page | Charts for operations, success rates, team performance |
| K-21 | Accessibility modes | WCAG AAA, ADHD, Dyslexic, Neuro, ECO CODE, No Blue Light |
| K-22 | Documentation suite | All 9 documents: roadmap, RAID, use cases, wireframes, data dictionary, architecture, pseudo code, resources, project plan |
| K-23 | Unit tests | Algorithm tests, API tests |

## Backlog (Future Iterations)

| ID | Item | Priority | Acceptance Criteria |
|----|------|----------|-------------------|
| K-30 | Offline PWA mode | High | Service worker caches map tiles and enables local data entry; syncs when online |
| K-31 | Real-time push notifications | High | WebSocket/SSE for team coordination alerts during active operations |
| K-32 | Native mobile app | Medium | React Native or PWA with native-like experience for field operators |
| K-33 | Drone swarm data ingestion | Medium | Accept thermal/LIDAR/visual data from MAVLink-compatible drones |
| K-34 | Satellite imagery integration | Medium | Copernicus Sentinel data overlay on map |
| K-35 | Cell phone ping triangulation | High | Carrier data import and signal-based location estimation |
| K-36 | Social media geolocation mining | Medium | Automated scraping and geolocation from public social posts |
| K-37 | GPR data visualization | Medium | Import GPR survey data and display anomalies on map |
| K-38 | Acoustic/seismic sensor array | Low | Ground sensor data processing for movement detection |
| K-39 | Trail camera network | Low | Automated image analysis from distributed cameras |
| K-40 | Underwater ROV/sonar | Low | Sonar data import and underwater zone mapping |
| K-41 | ML pattern analysis | Medium | Train models on historical search data for probability refinement |
| K-42 | 3D terrain visualization | Medium | Three.js or Cesium integration for 3D elevation views |
| K-43 | Multi-agency coordination | High | Inter-agency data sharing with access controls |
| K-44 | Forensic analysis module | Medium | GoPro footage analysis, construction barrier modeling |
| K-45 | Token economy system | Low | Reward system for volunteer searchers |
| K-46 | GitHub push to MIDNGHTSAPPHIRE | Medium | Automated code export to GitHub organization |
