# API Documentation — Universal SAR Application

All tRPC procedures (Node.js) and Flask endpoints (Python terrain analyst) documented with request/response schemas.

---

## tRPC API (Node.js — Port 3000)

All tRPC calls are made via HTTP POST to `/api/trpc/{router}.{procedure}`. The frontend uses the tRPC React client (`trpc.*.useQuery` / `trpc.*.useMutation`). Authentication uses JWT session cookies set by Manus OAuth.

**Authentication levels:**
- `publicProcedure` — no authentication required
- `protectedProcedure` — requires valid session cookie (`ctx.user` is populated)

---

### `auth` Router

#### `auth.me` — GET current user
- **Type:** Query (`publicProcedure`)
- **Input:** none
- **Output:** `User | null`
```ts
{ id: number, openId: string, name: string | null, email: string | null,
  role: "user" | "admin", createdAt: Date, lastSignedIn: Date }
```

#### `auth.logout` — Clear session
- **Type:** Mutation (`publicProcedure`)
- **Input:** none
- **Output:** `{ success: true }`
- **Side effect:** Clears session cookie

---

### `subjects` Router

#### `subjects.create` — Create a subject
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  operationId?: number,
  subjectType: "human" | "animal" | "vehicle" | "object",  // required
  subjectSubtype?: string,
  name: string,          // required, min length 1
  description?: string,
  photoUrl?: string,
  lastKnownLat?: string, // decimal string e.g. "50.8812"
  lastKnownLng?: string,
  lastKnownAlt?: string,
  lastSeenAt?: Date,
  directionOfTravel?: string,
  circumstances?: string,
  attributes?: object    // type-specific JSON (see Data Dictionary)
}
```
- **Output:** Created subject row

#### `subjects.getById` — Get subject by ID
- **Type:** Query (`publicProcedure`)
- **Input:** `{ id: number }`
- **Output:** Subject row or `null`

#### `subjects.list` — List all subjects
- **Type:** Query (`publicProcedure`)
- **Input:** `{ limit?: number, offset?: number }`
- **Output:** `Subject[]`

#### `subjects.getByOperation` — Get subjects for an operation
- **Type:** Query (`publicProcedure`)
- **Input:** `{ operationId: number }`
- **Output:** `Subject[]`

#### `subjects.update` — Update a subject
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  id: number,
  data: {
    name?: string,
    description?: string,
    status?: "missing" | "located" | "deceased" | "suspended",
    lastKnownLat?: string,
    lastKnownLng?: string,
    attributes?: object
  }
}
```
- **Output:** Updated subject row

---

### `operations` Router

#### `operations.create` — Create a search operation (main entry point)
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  name: string,           // required, min length 1
  priority?: "critical" | "high" | "medium" | "low",
  environment?: "urban" | "suburban" | "wilderness" | "maritime" | "mountain" | "desert" | "arctic",
  centerLat?: string,
  centerLng?: string,
  radiusKm?: string,
  notes?: string,
  temperatureC?: number,  // passed to Python terrain API
  searchRadiusM?: number, // passed to Python terrain API
  subject?: {
    subjectType: "human" | "animal" | "vehicle" | "object",
    subjectSubtype?: string,
    name: string,
    description?: string,
    lastKnownLat: string,  // required within subject
    lastKnownLng: string,  // required within subject
    lastSeenAt?: Date,
    directionOfTravel?: string,
    circumstances?: string,
    attributes?: object
  }
}
```
- **Output:** Created operation row
- **Side effects:**
  1. Creates subject record (if `subject` provided)
  2. Runs TypeScript SAR analysis → creates 3 probability zones
  3. Fetches Open-Meteo weather → stores in `weatherConditions`
  4. Launches async Python terrain analysis → stores in `terrainData` when complete
  5. Creates "Search Operation Launched" timeline event

#### `operations.getById` — Get full operation with all related data
- **Type:** Query (`publicProcedure`)
- **Input:** `{ id: number }`
- **Output:**
```ts
{
  // all search_operations columns, plus:
  subjects: Subject[],
  zones: ProbabilityZone[],
  sightings: Sighting[],
  teams: SearchTeam[],
  timeline: TimelineEvent[]
}
```

#### `operations.list` — List operations
- **Type:** Query (`publicProcedure`)
- **Input:** `{ status?: string, limit?: number }`
- **Output:** `SearchOperation[]`

#### `operations.update` — Update operation status/details
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  id: number,
  data: {
    status?: "planning" | "active" | "suspended" | "closed" | "cold_case",
    priority?: "critical" | "high" | "medium" | "low",
    notes?: string,
    name?: string
  }
}
```
- **Output:** Updated operation row
- **Side effect:** Creates `status_change` timeline event if status changed

#### `operations.runTerrainAnalysis` — Re-run terrain analysis on demand
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  operationId: number,
  lat: number,
  lon: number,
  radiusM?: number,  // default 500
  tempC?: number     // default -18
}
```
- **Output:** Full terrain analysis result (same as Python `/api/analyze`)
- **Side effect:** Updates `terrainData` on operation, creates timeline event

---

### `sightings` Router

#### `sightings.create` — Report a sighting
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  operationId: number,
  subjectId?: number,
  lat: string,
  lng: string,
  sightedAt: Date,
  sightingType?: "visual" | "auditory" | "physical_evidence" | "electronic" | "scent" | "footprint" | "other",
  confidence: number,    // 1–10
  description?: string,
  reporterName?: string,
  reporterContact?: string
}
```
- **Output:** Created sighting row
- **Side effects:**
  1. Triggers Bayesian probability zone recalculation
  2. Deletes existing zones and creates updated zones
  3. Updates `probabilityScore` on operation
  4. Creates `sighting` timeline event

#### `sightings.getByOperation` — Get sightings for an operation
- **Type:** Query (`publicProcedure`)
- **Input:** `{ operationId: number }`
- **Output:** `Sighting[]`

---

### `teams` Router

#### `teams.create` — Create a search team
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  name: string,
  teamType?: "ground" | "k9" | "aerial" | "marine" | "technical" | "gpr" | "drone" | "mounted",
  memberCount?: number,
  equipment?: object,
  contactInfo?: string,
  notes?: string
}
```
- **Output:** Created team row

#### `teams.list` — List all teams
- **Type:** Query (`publicProcedure`)
- **Input:** `{ limit?: number }`
- **Output:** `SearchTeam[]`

#### `teams.getByOperation` — Get teams for an operation
- **Type:** Query (`publicProcedure`)
- **Input:** `{ operationId: number }`
- **Output:** `SearchTeam[]`

#### `teams.deploy` — Deploy a team to an operation
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  teamId: number,
  operationId: number,
  zoneId?: number,
  lat?: string,
  lng?: string
}
```
- **Output:** Updated team row
- **Side effect:** Creates `team_deployed` timeline event

#### `teams.update` — Update team status/position
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  id: number,
  data: {
    status?: "available" | "deployed" | "returning" | "off_duty",
    currentLat?: string,
    currentLng?: string,
    operationId?: number | null,
    notes?: string
  }
}
```
- **Output:** Updated team row

---

### `evidence` Router

#### `evidence.create` — Log evidence
- **Type:** Mutation (`protectedProcedure`)
- **Input:**
```ts
{
  operationId: number,
  subjectId?: number,
  evidenceType: "photo" | "document" | "physical" | "digital" | "forensic" | "sensor_data" | "video" | "audio",
  title: string,
  description?: string,
  fileUrl?: string,
  fileType?: string,
  collectedAt?: Date,
  collectedBy?: string,
  lat?: string,
  lng?: string
}
```
- **Output:** Created evidence row
- **Side effect:** Creates `evidence_found` timeline event

#### `evidence.getByOperation` — Get evidence for an operation
- **Type:** Query (`publicProcedure`)
- **Input:** `{ operationId: number }`
- **Output:** `Evidence[]`

---

### `timeline` Router

#### `timeline.getByOperation` — Get timeline events
- **Type:** Query (`publicProcedure`)
- **Input:** `{ operationId: number, limit?: number }`
- **Output:** `TimelineEvent[]` (ordered by `createdAt` DESC)

#### `timeline.addNote` — Add a note to the timeline
- **Type:** Mutation (`protectedProcedure`)
- **Input:** `{ operationId: number, title: string, description?: string }`
- **Output:** Created timeline event row

---

### `zones` Router

#### `zones.getByOperation` — Get probability zones
- **Type:** Query (`publicProcedure`)
- **Input:** `{ operationId: number }`
- **Output:** `ProbabilityZone[]`

---

### `terrain` Router

#### `terrain.analyze` — Run full terrain analysis
- **Type:** Mutation (`protectedProcedure`)
- **Input:** `{ lat: number, lon: number, radiusM?: number, tempC?: number }`
- **Output:** Full terrain analysis result (see Python `/api/analyze` below)

#### `terrain.elevation` — Fetch elevation grid
- **Type:** Query (`publicProcedure`)
- **Input:** `{ lat: number, lon: number, radiusM?: number }`
- **Output:** Elevation grid data from OpenTopoData

#### `terrain.features` — Fetch OSM features
- **Type:** Query (`publicProcedure`)
- **Input:** `{ lat: number, lon: number, radiusM?: number }`
- **Output:** OSM waterways, roads, forest polygons

#### `terrain.health` — Check Python API status
- **Type:** Query (`publicProcedure`)
- **Input:** none
- **Output:** `{ status: "online" | "offline" | "error", ... }`

---

### `analytics` Router

#### `analytics.stats` — Get operation statistics
- **Type:** Query (`publicProcedure`)
- **Input:** none
- **Output:**
```ts
{ total: number, active: number, closed: number,
  subjects: number, teams: number }
```

#### `analytics.movementProfile` — Get Koester LPB movement profile
- **Type:** Query (`publicProcedure`)
- **Input:**
```ts
{
  subjectType: "human" | "animal" | "vehicle" | "object",
  subjectSubtype?: string,
  attributes?: object
}
```
- **Output:**
```ts
{ p25_km: number, p50_km: number, p75_km: number, p95_km: number,
  typicalSpeed_kmh: number, description: string }
```

#### `analytics.snowBridge` — Snow bridge structural analysis
- **Type:** Query (`publicProcedure`)
- **Input:**
```ts
{
  snowDepth_m: number,
  temperature_c: number,
  gapWidth_m?: number,       // default 2.0
  subjectWeight_kg?: number  // default 75.0
}
```
- **Output:**
```ts
{ safetyFactor: number, willCollapse: boolean,
  riskLevel: "safe" | "caution" | "danger" | "critical",
  bridgeThickness_m: number, tensileStrength_Pa: number,
  maxLoad_kg: number, effectiveCapacity_kg: number, details: string }
```

#### `analytics.weather` — Fetch current weather
- **Type:** Query (`publicProcedure`)
- **Input:** `{ lat: number, lng: number }`
- **Output:** Open-Meteo weather object

---

## Python Flask API (Port 5001)

The terrain analyst microservice. All endpoints accept and return JSON. No authentication required (internal use only — bind to localhost in production).

---

### `GET /health`

Health check.

**Response:**
```json
{ "status": "ok", "service": "terrain-analyst-api", "version": "1.0.0" }
```

---

### `POST /api/analyze`

Full terrain analysis pipeline. Calls OpenTopoData, runs anomaly detection, fetches OSM features, generates GPR protocol, and produces a report. Takes 30–90 seconds.

**Request:**
```json
{ "lat": 50.8812, "lon": -119.8925, "radius_m": 500, "temp_c": -26 }
```

**Response:**
```json
{
  "terrain_stats": {
    "anomaly_count": 227,
    "phase1_count": 180,
    "phase2_count": 35,
    "phase3_count": 12,
    "elevation_range": 293.0,
    "mean_slope": 18.4,
    "max_slope": 62.1
  },
  "anomalies": [
    { "lat": 50.881, "lon": -119.892, "phase": 3,
      "slope": 42.1, "depth": 2.3, "aspect": "NW" }
  ],
  "osm_features": {
    "waterways": [{ "name": "...", "type": "stream", "coords": [...] }],
    "roads": [{ "name": "...", "type": "track", "coords": [...] }],
    "forest": [{ "type": "wood", "coords": [...] }]
  },
  "gpr_protocol": {
    "antenna_freq_mhz": 500,
    "dielectric_constant": 3.5,
    "scan_spacing_m": 0.5,
    "depth_penetration_m": 3.2,
    "recommended_grid": "0.5m parallel lines"
  },
  "elevation_summary": { "min": 1224, "max": 1517, "mean": 1368, "std": 58.2 },
  "report": {
    "summary": "High-priority terrain with 12 Phase 3 anomalies...",
    "recommendations": ["Deploy GPR team to Phase 3 zones", "..."]
  }
}
```

---

### `POST /api/elevation`

Fetch elevation grid from OpenTopoData SRTM 30m.

**Request:**
```json
{ "lat": 50.8812, "lon": -119.8925, "radius_m": 500, "grid_spacing_m": 30 }
```

**Response:**
```json
{
  "points": [{ "lat": 50.879, "lon": -119.895, "elevation": 1239.0 }],
  "count": 441,
  "min_elevation": 1224,
  "max_elevation": 1517,
  "mean_elevation": 1368
}
```

---

### `POST /api/features`

Fetch nearby OSM features via Overpass API.

**Request:**
```json
{ "lat": 50.8812, "lon": -119.8925, "radius_m": 600 }
```

**Response:**
```json
{
  "waterways": [...],
  "roads": [...],
  "forest": [...],
  "buildings": [...],
  "total_features": 47
}
```

---

### `POST /api/gpr-protocol`

Generate GPR scan protocol based on temperature and terrain.

**Request:**
```json
{
  "lat": 50.8812, "lon": -119.8925,
  "temp_c": -26,
  "anomalies": [...],
  "features": {...}
}
```

**Response:**
```json
{
  "antenna_freq_mhz": 500,
  "dielectric_constant": 3.5,
  "scan_spacing_m": 0.5,
  "depth_penetration_m": 3.2,
  "time_window_ns": 42.7,
  "recommended_grid": "0.5m parallel lines",
  "notes": "Frozen ground at -26°C: use 500MHz for 3.2m penetration"
}
```

---

### `POST /api/terrain-analysis`

Run terrain analysis only (no OSM features, no GPR protocol).

**Request:**
```json
{ "lat": 50.8812, "lon": -119.8925, "radius_m": 500 }
```

**Response:** Terrain stats and anomalies only (subset of `/api/analyze`)

---

### `POST /api/map`

Generate Folium interactive HTML map.

**Request:**
```json
{ "lat": 50.8812, "lon": -119.8925, "radius_m": 500, "temp_c": -26 }
```

**Response:**
```json
{ "map_html": "<html>...</html>", "anomaly_count": 227 }
```

---

## Error Responses

All endpoints return standard HTTP error codes:

| Code | Meaning |
|---|---|
| `400` | Bad request — missing or invalid input parameters |
| `401` | Unauthorized — missing or invalid session cookie (tRPC only) |
| `403` | Forbidden — insufficient role (admin procedures) |
| `404` | Not found — resource does not exist |
| `500` | Internal server error — unexpected failure |

tRPC errors use the standard tRPC error format:
```json
{ "error": { "message": "...", "code": "BAD_REQUEST", "data": { "zodError": {...} } } }
```

Flask errors return:
```json
{ "error": "Description of the error" }
```
