# Universal SAR — Search & Rescue Operations Platform

A production-grade, FOSS-first search and rescue management system that locates anyone or anything — missing persons, fugitives, lost hikers, animals, vehicles, and objects. Integrates real terrain analysis via OpenTopoData (SRTM 30m), OpenStreetMap Overpass API, Open-Meteo weather, and a full Bayesian probability engine based on Robert Koester's Lost Person Behavior statistics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Leaflet.js / OpenStreetMap |
| API | tRPC 11 (end-to-end type-safe), Express 4 |
| Terrain Engine | Python 3.11, Flask 3, NumPy, Pandas, Folium |
| Database | MySQL / TiDB (Drizzle ORM) |
| Maps | Leaflet.js + OpenStreetMap (FOSS, no API key) |
| Elevation | OpenTopoData SRTM 30m (free, no API key) |
| OSM Features | Overpass API (free, no API key) |
| Weather | Open-Meteo API (free, no API key) |
| Auth | Manus OAuth (JWT session cookies) |
| Testing | Vitest (39 tests) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Leaflet Map │ Operation Wizard │ Sightings │ Evidence   │
└──────────────────────┬──────────────────────────────────┘
                       │ tRPC (HTTP/JSON)
┌──────────────────────▼──────────────────────────────────┐
│              Node.js / Express Server                    │
│  tRPC Routers │ SAR Algorithm Engine │ DB Helpers        │
└──────────┬────────────────────────┬────────────────────-┘
           │ Drizzle ORM            │ HTTP fetch
┌──────────▼──────────┐   ┌─────────▼──────────────────-─┐
│   MySQL / TiDB      │   │  Python Flask Terrain API     │
│   8 tables          │   │  Port 5001                    │
│   subjects          │   │  /api/analyze (full pipeline) │
│   search_operations │   │  /api/elevation (OpenTopoData)│
│   probability_zones │   │  /api/features (Overpass OSM) │
│   sightings         │   │  /api/gpr-protocol            │
│   search_teams      │   │  /api/terrain-analysis        │
│   timeline_events   │   │  /api/map (Folium HTML)       │
│   evidence          │   └──────────────────────────────-┘
│   sensor_data       │
└─────────────────────┘
```

**Key design decisions:**

The application uses a polymorphic subject model — a single `subjects` table handles humans, animals, vehicles, and objects via a `subjectType` discriminator column, with type-specific attributes stored in a `JSON` column. This avoids table-per-type sprawl while preserving full schema flexibility.

The Python terrain analyst runs as a sidecar microservice on port 5001. It is called asynchronously after operation creation so the user is not blocked waiting for the 30–60 second OpenTopoData + Overpass pipeline. Results are written back to the `terrainData` JSON column on the operation record and polled by the frontend every 15 seconds.

---

## Prerequisites

- Node.js 22+, pnpm 10+
- Python 3.11+, pip3
- MySQL 8+ (or TiDB)

---

## Setup Guide

### 1. Clone the repository

```bash
git clone https://github.com/midnghtsapphire/universal-sar-app.git
cd universal-sar-app
```

### 2. Install Node.js dependencies

```bash
pnpm install
```

### 3. Install Python dependencies

```bash
pip3 install flask flask-cors requests numpy pandas folium matplotlib scipy
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=mysql://user:password@host:3306/sar_db
JWT_SECRET=your-secret-here
VITE_APP_ID=your-manus-app-id
TERRAIN_API_URL=http://localhost:5001   # optional, defaults to localhost:5001
```

### 5. Apply database migrations

```bash
pnpm drizzle-kit generate
# Then apply the generated SQL via your DB admin tool or:
pnpm drizzle-kit migrate
```

### 6. Start the Python terrain API

```bash
cd python-backend
python3 api_server.py &
# Verify: curl http://localhost:5001/health
```

### 7. Start the development server

```bash
pnpm dev
# App runs at http://localhost:3000
```

### 8. Run tests

```bash
pnpm test
# 39 tests: SAR engine (14) + API integration (24) + auth (1)
```

---

## Application Screens

| Screen | Route | Description |
|---|---|---|
| Command Center | `/` | Dashboard with live stats, active operations, quick actions |
| New Operation | `/operations/new` | 3-step wizard: operation details → subject details → location + terrain |
| Operations List | `/operations` | All operations with status, priority, environment filters |
| Operation Detail | `/operations/:id` | Map, probability zones, terrain analysis, timeline, teams, evidence |
| Live Map | `/map` | Aggregated map of all active operations |
| Sightings | `/sightings` | Report and view sightings; triggers Bayesian zone recalculation |
| Teams | `/teams` | Create and manage search teams |
| Evidence | `/evidence` | Catalog evidence with chain of custody |
| Analytics | `/analytics` | Movement profiles (Koester LPB), weather lookup, operation stats |
| Snow Bridge | `/snow-bridge` | Forensic snow bridge structural analysis (Sun Peaks Feb 2018) |
| Documentation | `/docs` | In-app documentation viewer |

---

## FOSS Components

| Component | License | Purpose |
|---|---|---|
| OpenStreetMap | ODbL | Base map tiles |
| Leaflet.js | BSD-2 | Interactive map rendering |
| OpenTopoData (SRTM 30m) | Public Domain | Elevation data |
| Overpass API | ODbL | OSM feature queries (waterways, roads, forest) |
| Open-Meteo | CC BY 4.0 | Weather data |
| Folium | MIT | Python interactive map generation |
| Drizzle ORM | Apache 2.0 | Type-safe database ORM |
| React / tRPC / Zod | MIT | Frontend + API framework |

---

## Connecting to Forensic Analysis

The Snow Bridge page (`/snow-bridge`) implements the physics model from the Sun Peaks Feb 2018 case. To connect your existing Python forensic code:

1. Place your module in `python-backend/`
2. Import it in `api_server.py` and add a new Flask endpoint
3. Add a tRPC procedure in `server/routers.ts` that calls `callTerrainAPI("/api/your-endpoint", ...)`
4. Wire the frontend form to the new procedure

---

## Project Structure

```
universal-sar-app/
├── client/src/
│   ├── components/        # SARMap, DashboardLayout, UI primitives
│   ├── pages/             # All 11 screens
│   └── lib/trpc.ts        # tRPC client binding
├── server/
│   ├── algorithms/
│   │   └── sar-engine.ts  # Convex hull, Bayesian, Koester LPB, snow bridge
│   ├── routers.ts         # All tRPC procedures
│   └── db.ts              # Drizzle query helpers
├── python-backend/
│   ├── terrain_analyst.py # 7-module terrain analysis pipeline
│   └── api_server.py      # Flask microservice wrapper
├── drizzle/
│   └── schema.ts          # Full database schema (8 tables)
└── docs/                  # 9 extended documentation files
```

---

## Test

| Feature | Status |
|---------|--------|
| Feature | ✅ Ready |

