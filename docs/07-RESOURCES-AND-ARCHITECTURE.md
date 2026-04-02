# Universal SAR Application — Resources List & System Architecture

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## FOSS Resources (Free Over Paid)

### Mapping & Geospatial

| Resource | License | Purpose | URL |
|----------|---------|---------|-----|
| OpenStreetMap | ODbL | Base map tiles for all map views | https://www.openstreetmap.org |
| Leaflet.js | BSD-2-Clause | Interactive map library (lightweight, mobile-friendly) | https://leafletjs.com |
| Turf.js | MIT | Geospatial analysis (convex hull, buffer, intersect, area) | https://turfjs.org |
| QGIS | GPL-2.0 | Desktop GIS for advanced analysis (offline) | https://qgis.org |
| GeoJSON | RFC 7946 | Standard format for encoding geographic data | https://geojson.org |
| OpenTopoData | MIT | Open elevation API (SRTM, ASTER, NED datasets) | https://www.opentopodata.org |
| Stamen/Stadia Maps | Various | Alternative map tile styles (terrain, toner) | https://stadiamaps.com |

### Weather & Environmental Data

| Resource | License | Purpose | URL |
|----------|---------|---------|-----|
| NOAA Weather API | Public Domain | Real-time weather data for US locations | https://api.weather.gov |
| Open-Meteo | CC-BY-4.0 | Global weather API (no key required) | https://open-meteo.com |
| Environment Canada | Open Gov License | Canadian weather data (Sun Peaks case) | https://climate.weather.gc.ca |
| USGS Elevation API | Public Domain | US elevation data and terrain analysis | https://apps.nationalmap.gov/epqs/ |
| OpenWeatherMap | CC-BY-SA-4.0 | Global weather (free tier: 1000 calls/day) | https://openweathermap.org |

### SAR Reference Data

| Resource | License | Purpose | URL |
|----------|---------|---------|-----|
| Lost Person Behavior (Koester) | Published Research | Statistical movement data by subject type | ISBN: 978-1879471399 |
| ISRID Database | Research | International Search & Rescue Incident Database | https://www.dbs-sar.com |
| NASAR Standards | Published | National Association for Search and Rescue guidelines | https://www.nasar.org |
| Mattson Consensus | Published | SAR probability of detection methodology | Academic literature |

### Frontend Libraries

| Resource | License | Purpose | URL |
|----------|---------|---------|-----|
| React 19 | MIT | UI framework | https://react.dev |
| Tailwind CSS 4 | MIT | Utility-first CSS (glassmorphism theme) | https://tailwindcss.com |
| Recharts | MIT | Data visualization charts | https://recharts.org |
| Lucide React | ISC | Icon library | https://lucide.dev |
| shadcn/ui | MIT | Accessible UI component library | https://ui.shadcn.com |
| Framer Motion | MIT | Animation library | https://www.framer.com/motion |
| react-leaflet | MIT | React wrapper for Leaflet.js | https://react-leaflet.js.org |

### Backend & Infrastructure

| Resource | License | Purpose | URL |
|----------|---------|---------|-----|
| Express.js | MIT | HTTP server | https://expressjs.com |
| tRPC | MIT | Type-safe API layer | https://trpc.io |
| Drizzle ORM | Apache-2.0 | Type-safe database ORM | https://orm.drizzle.team |
| MySQL/TiDB | GPL/Apache | Relational database | https://www.mysql.com |
| Vitest | MIT | Unit testing framework | https://vitest.dev |
| Zod | MIT | Schema validation | https://zod.dev |

### Advanced SAR Technologies (Future Integration)

| Technology | FOSS Option | Purpose |
|-----------|-------------|---------|
| Drone Fleet Management | MAVLink/QGroundControl (GPL) | Drone swarm coordination |
| LiDAR Processing | PDAL (BSD), CloudCompare (GPL) | Point cloud analysis |
| GPR Data Processing | GPRPy (MIT) | Ground-penetrating radar data |
| Satellite Imagery | Copernicus Open Access Hub (Free) | Sentinel satellite data |
| Acoustic Analysis | Librosa (ISC) | Audio signal processing |
| Image Analysis | OpenCV (Apache-2.0) | Visual anomaly detection |
| ML Pipeline | scikit-learn (BSD), TensorFlow (Apache-2.0) | Pattern recognition |

---

## System Architecture Blueprint

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/PWA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Dashboard │ │ Map View │ │ Wizards  │ │  Analytics   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │             │            │               │           │
│  ┌────┴─────────────┴────────────┴───────────────┴───────┐  │
│  │              React 19 + Tailwind CSS 4                 │  │
│  │         Leaflet.js / Turf.js / Recharts               │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │ tRPC Client                      │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┼──────────────────────────────────┐
│                    SERVER (Express + tRPC)                    │
│  ┌────────────────────────┴──────────────────────────────┐  │
│  │                   tRPC Router Layer                     │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐  │  │
│  │  │Subjects │ │Operations│ │Sighting│ │   Teams    │  │  │
│  │  └────┬────┘ └────┬─────┘ └───┬────┘ └─────┬──────┘  │  │
│  └───────┼───────────┼───────────┼─────────────┼─────────┘  │
│          │           │           │             │             │
│  ┌───────┴───────────┴───────────┴─────────────┴─────────┐  │
│  │              SAR Algorithm Engine                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Convex   │ │ Bayesian │ │ Movement │ │ Terrain  │ │  │
│  │  │  Hull    │ │Probability│ │Prediction│ │ Weather  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │              Data Access Layer (Drizzle ORM)           │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│              EXTERNAL SERVICES                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ MySQL/   │ │   S3     │ │  NOAA    │ │ OpenTopo     │   │
│  │ TiDB     │ │ Storage  │ │ Weather  │ │ Elevation    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: New Search Operation

```
1. User fills wizard form → tRPC mutation: operations.create
2. Server validates input with Zod schema
3. Subject record created in subjects table
4. Operation record created in search_operations table
5. SAR Engine triggered:
   a. Fetch terrain data (elevation API)
   b. Fetch weather data (NOAA/Open-Meteo)
   c. Calculate movement profile (Koester data)
   d. Generate convex hull from anchor points
   e. Initialize Bayesian probability grid
   f. Identify terrain traps
   g. Calculate snow bridge risks (if winter)
6. Probability zones stored in probability_zones table
7. Timeline event logged
8. Response returned to client with operation ID + initial probability map
9. Client renders map with probability overlay
```

### Data Flow: Sighting Report → Bayesian Update

```
1. User submits sighting → tRPC mutation: sightings.create
2. Server validates and stores sighting
3. SAR Engine Bayesian update triggered:
   a. Load current probability grid for operation
   b. Calculate likelihood function from sighting data
   c. Apply Bayes' theorem: posterior = prior × likelihood / evidence
   d. Normalize probability grid
   e. Identify new high-probability zones
4. Updated probability zones stored
5. Timeline event logged
6. All connected clients receive updated probability map
```
