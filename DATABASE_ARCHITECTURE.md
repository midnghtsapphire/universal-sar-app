# Database Architecture — Universal SAR Application

Full schema for all 8 tables, with column definitions, data types, constraints, indexes, and foreign key relationships.

---

## Entity Relationship Overview

```
users ──────────────────────────────────────────────────────────────────┐
  │ createdBy (FK)                                                       │
  ▼                                                                      │
search_operations ──────────────────────────────────────────────────────┤
  │ operationId (FK)         │ operationId (FK)                          │
  ▼                          ▼                                           │
subjects              probability_zones                                  │
  │ subjectId (FK)                                                       │
  ▼                                                                      │
sightings ◄──── operationId (FK) ──── search_operations                 │
evidence  ◄──── operationId (FK) ──── search_operations                 │
timeline_events ◄── operationId (FK) ── search_operations               │
search_teams ◄── operationId (FK) ──── search_operations                │
sensor_data ◄─── operationId (FK) ──── search_operations                │
```

---

## Table 1: `users`

Backing table for Manus OAuth authentication. Extended with `role` for admin/user separation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `openId` | `VARCHAR(64)` | NOT NULL, UNIQUE | Manus OAuth identifier |
| `name` | `TEXT` | nullable | Display name from OAuth |
| `email` | `VARCHAR(320)` | nullable | Email address |
| `loginMethod` | `VARCHAR(64)` | nullable | OAuth provider (e.g. `manus`) |
| `role` | `ENUM('user','admin')` | NOT NULL, DEFAULT `user` | Access control role |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Account creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW, ON UPDATE | Last modification time |
| `lastSignedIn` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Last authentication time |

---

## Table 2: `subjects`

Polymorphic subject table. Stores all subject types (human, animal, vehicle, object) in a single table. Type-specific attributes are stored in the `attributes` JSON column.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `operationId` | `INT` | nullable, FK → `search_operations.id` | Associated operation (null if subject created standalone) |
| `subjectType` | `ENUM('human','animal','vehicle','object')` | NOT NULL | Polymorphic discriminator |
| `subjectSubtype` | `VARCHAR(64)` | nullable | Subtype (e.g. `hiker`, `dog`, `car`, `equipment`) |
| `name` | `VARCHAR(255)` | NOT NULL | Subject name or identifier |
| `description` | `TEXT` | nullable | Physical description |
| `photoUrl` | `VARCHAR(512)` | nullable | URL to subject photo (S3 or CDN) |
| `lastKnownLat` | `DECIMAL(10,7)` | nullable | WGS84 latitude of last known position |
| `lastKnownLng` | `DECIMAL(10,7)` | nullable | WGS84 longitude of last known position |
| `lastKnownAlt` | `DECIMAL(8,2)` | nullable | Altitude in metres (from SRTM if available) |
| `lastSeenAt` | `TIMESTAMP` | nullable | Timestamp of last confirmed sighting |
| `directionOfTravel` | `VARCHAR(16)` | nullable | Compass direction (e.g. `NW`, `SE`) |
| `circumstances` | `TEXT` | nullable | Narrative of disappearance circumstances |
| `status` | `ENUM('missing','located','deceased','suspended')` | NOT NULL, DEFAULT `missing` | Current status of subject |
| `attributes` | `JSON` | nullable | Type-specific attributes (see Data Dictionary) |
| `createdBy` | `INT` | NOT NULL, FK → `users.id` | User who created the record |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW, ON UPDATE | Last modification time |

**Indexes:** `operationId`, `subjectType`, `status`, `createdBy`

**`attributes` JSON schema by subject type:**

```json
// Human
{ "age": 35, "gender": "male", "height_cm": 178, "weight_kg": 75,
  "fitness_level": "good", "experience_level": "intermediate",
  "clothing": "Red jacket, blue jeans", "medical_conditions": "Diabetes" }

// Animal
{ "breed": "Golden Retriever", "color": "Golden, white chest",
  "weight_kg": 30, "training_level": "basic",
  "temperament": "friendly", "collar": "Red collar, ID tag #12345" }

// Vehicle
{ "make": "Toyota", "model": "4Runner", "year": 2020, "color": "White",
  "license_plate": "ABC 1234", "range_km": 500 }

// Object
{ "object_type": "Backpack", "color": "Red", "size": "60cm x 40cm",
  "serial_number": "SN-12345" }
```

---

## Table 3: `search_operations`

The central table. One row per search operation. Aggregates all related data via foreign keys.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `name` | `VARCHAR(255)` | NOT NULL | Operation name |
| `status` | `ENUM('planning','active','suspended','closed','cold_case')` | NOT NULL, DEFAULT `planning` | Current operational status |
| `priority` | `ENUM('critical','high','medium','low')` | NOT NULL, DEFAULT `medium` | Urgency level |
| `environment` | `ENUM('urban','suburban','wilderness','maritime','mountain','desert','arctic')` | NOT NULL, DEFAULT `wilderness` | Search environment type |
| `centerLat` | `DECIMAL(10,7)` | nullable | Operation center latitude (typically LKP) |
| `centerLng` | `DECIMAL(10,7)` | nullable | Operation center longitude (typically LKP) |
| `radiusKm` | `DECIMAL(8,2)` | nullable | Maximum search radius in kilometres (from SAR engine) |
| `boundaryGeoJson` | `JSON` | nullable | Convex hull boundary as GeoJSON polygon |
| `probabilityScore` | `DECIMAL(5,2)` | nullable | Primary zone probability as percentage (0–100) |
| `weatherConditions` | `JSON` | nullable | Open-Meteo weather snapshot at LKP |
| `terrainData` | `JSON` | nullable | Full Python terrain analyst result (async, may be null until complete) |
| `notes` | `TEXT` | nullable | Operational notes |
| `startedAt` | `TIMESTAMP` | nullable | When the operation was activated |
| `closedAt` | `TIMESTAMP` | nullable | When the operation was closed |
| `createdBy` | `INT` | NOT NULL, FK → `users.id` | User who created the operation |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW, ON UPDATE | Last modification time |

**Indexes:** `status`, `priority`, `environment`, `createdBy`, `createdAt`

**`weatherConditions` JSON schema:**
```json
{ "temperature_c": -26.0, "wind_speed_kmh": 15.2, "wind_direction_deg": 270,
  "precipitation_mm": 0.0, "visibility_km": 10.0, "conditions": "Clear" }
```

**`terrainData` JSON schema (from Python terrain analyst):**
```json
{
  "terrain_stats": { "anomaly_count": 227, "phase3_count": 12,
    "elevation_range": 293.0, "mean_slope": 18.4 },
  "anomalies": [{ "lat": 50.881, "lon": -119.892, "phase": 3,
    "slope": 42.1, "depth": 2.3 }],
  "osm_features": { "waterways": [...], "roads": [...], "forest": [...] },
  "gpr_protocol": { "antenna_freq_mhz": 500, "dielectric_constant": 3.5,
    "scan_spacing_m": 0.5 },
  "elevation_summary": { "min": 1224, "max": 1517, "mean": 1368 },
  "report": { "summary": "...", "recommendations": [...] }
}
```

---

## Table 4: `probability_zones`

Probability zones calculated by the SAR algorithm engine. Recreated on each Bayesian update.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `operationId` | `INT` | NOT NULL, FK → `search_operations.id` | Associated operation |
| `zoneName` | `VARCHAR(128)` | nullable | Human-readable zone name (e.g. "Primary Search Zone") |
| `zoneType` | `ENUM('primary','secondary','tertiary','exclusion')` | NOT NULL, DEFAULT `primary` | Zone classification |
| `probability` | `DECIMAL(5,4)` | nullable | Probability of subject being in zone (0.0–1.0) |
| `geoJson` | `JSON` | nullable | Zone boundary as GeoJSON polygon |
| `centerLat` | `DECIMAL(10,7)` | nullable | Zone center latitude |
| `centerLng` | `DECIMAL(10,7)` | nullable | Zone center longitude |
| `areaKm2` | `DECIMAL(10,4)` | nullable | Zone area in square kilometres |
| `algorithm` | `VARCHAR(64)` | nullable | Algorithm used (e.g. `koester_lpb`, `bayesian_update`) |
| `confidence` | `DECIMAL(5,4)` | nullable | Algorithm confidence score (0.0–1.0) |
| `notes` | `TEXT` | nullable | Zone-specific notes |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW, ON UPDATE | Last modification time |

**Indexes:** `operationId`, `zoneType`

---

## Table 5: `sightings`

Individual sighting reports. Each sighting triggers a Bayesian recalculation of probability zones.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `operationId` | `INT` | NOT NULL, FK → `search_operations.id` | Associated operation |
| `subjectId` | `INT` | nullable, FK → `subjects.id` | Specific subject sighted (if known) |
| `lat` | `DECIMAL(10,7)` | NOT NULL | WGS84 latitude of sighting |
| `lng` | `DECIMAL(10,7)` | NOT NULL | WGS84 longitude of sighting |
| `sightedAt` | `TIMESTAMP` | NOT NULL | When the sighting occurred |
| `sightingType` | `ENUM('visual','auditory','physical_evidence','electronic','scent','footprint','other')` | NOT NULL, DEFAULT `visual` | Type of evidence |
| `confidence` | `INT` | NOT NULL | Confidence 1–10; used as Bayesian likelihood weight |
| `description` | `TEXT` | nullable | Narrative description |
| `reporterName` | `VARCHAR(255)` | nullable | Name of reporter |
| `reporterContact` | `VARCHAR(255)` | nullable | Contact info of reporter |
| `photoUrl` | `VARCHAR(512)` | nullable | URL to photo evidence |
| `verified` | `BOOLEAN` | DEFAULT `false` | Whether sighting has been verified by IC |
| `createdBy` | `INT` | nullable, FK → `users.id` | User who logged the sighting |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |

**Indexes:** `operationId`, `subjectId`, `sightedAt`, `sightingType`

---

## Table 6: `search_teams`

Search and rescue teams. Can be deployed to specific operations and probability zones.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `name` | `VARCHAR(128)` | NOT NULL | Team name or call sign |
| `teamType` | `ENUM('ground','k9','aerial','marine','technical','gpr','drone','mounted')` | NOT NULL, DEFAULT `ground` | Team type determines capabilities |
| `status` | `ENUM('available','deployed','returning','off_duty')` | NOT NULL, DEFAULT `available` | Current deployment status |
| `memberCount` | `INT` | nullable | Number of team members |
| `operationId` | `INT` | nullable, FK → `search_operations.id` | Currently assigned operation |
| `currentLat` | `DECIMAL(10,7)` | nullable | Current GPS latitude (for live tracking) |
| `currentLng` | `DECIMAL(10,7)` | nullable | Current GPS longitude (for live tracking) |
| `assignedZoneId` | `INT` | nullable, FK → `probability_zones.id` | Assigned probability zone |
| `equipment` | `JSON` | nullable | Equipment list as JSON array |
| `contactInfo` | `VARCHAR(255)` | nullable | Radio channel, phone, or call sign |
| `notes` | `TEXT` | nullable | Team notes |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW, ON UPDATE | Last modification time |

**Indexes:** `status`, `operationId`, `teamType`

---

## Table 7: `timeline_events`

Append-only audit log of all significant events in an operation. Never deleted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `operationId` | `INT` | NOT NULL, FK → `search_operations.id` | Associated operation |
| `eventType` | `ENUM('status_change','sighting','team_deployed','team_recalled','probability_update','weather_update','evidence_found','note','decision','resource_change')` | NOT NULL | Event classification |
| `title` | `VARCHAR(255)` | NOT NULL | Short event title |
| `description` | `TEXT` | nullable | Detailed event description |
| `lat` | `DECIMAL(10,7)` | nullable | Geographic location of event |
| `lng` | `DECIMAL(10,7)` | nullable | Geographic location of event |
| `metadata` | `JSON` | nullable | Additional structured data |
| `createdBy` | `INT` | nullable, FK → `users.id` | User who created the event |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Event timestamp |

**Indexes:** `operationId`, `eventType`, `createdAt`

---

## Table 8: `evidence`

Evidence catalog with chain of custody tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `operationId` | `INT` | NOT NULL, FK → `search_operations.id` | Associated operation |
| `subjectId` | `INT` | nullable, FK → `subjects.id` | Associated subject |
| `evidenceType` | `ENUM('photo','document','physical','digital','forensic','sensor_data','video','audio')` | NOT NULL | Evidence classification |
| `title` | `VARCHAR(255)` | NOT NULL | Short descriptive title |
| `description` | `TEXT` | nullable | Detailed description |
| `fileUrl` | `VARCHAR(512)` | nullable | URL to file (S3 or CDN) |
| `fileType` | `VARCHAR(64)` | nullable | MIME type (e.g. `image/jpeg`) |
| `fileSize` | `INT` | nullable | File size in bytes |
| `collectedAt` | `TIMESTAMP` | nullable | When evidence was collected |
| `collectedBy` | `VARCHAR(255)` | nullable | Name of collector |
| `lat` | `DECIMAL(10,7)` | nullable | Location where found |
| `lng` | `DECIMAL(10,7)` | nullable | Location where found |
| `chainOfCustody` | `JSON` | nullable | Array of custody transfer records |
| `metadata` | `JSON` | nullable | Additional structured metadata |
| `createdBy` | `INT` | nullable, FK → `users.id` | User who logged the evidence |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |

**Indexes:** `operationId`, `subjectId`, `evidenceType`

---

## Table 9 (bonus): `sensor_data`

Sensor readings from drones, GPR, trail cameras, and other instruments.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate primary key |
| `operationId` | `INT` | NOT NULL, FK → `search_operations.id` | Associated operation |
| `sensorType` | `ENUM('drone_thermal','drone_lidar','drone_visual','gpr','acoustic','seismic','trail_camera','sonar','cell_ping','satellite')` | NOT NULL | Sensor type |
| `lat` | `DECIMAL(10,7)` | NOT NULL | Sensor position latitude |
| `lng` | `DECIMAL(10,7)` | NOT NULL | Sensor position longitude |
| `altitude` | `DECIMAL(8,2)` | nullable | Altitude in metres |
| `reading` | `JSON` | nullable | Raw sensor reading data |
| `anomalyDetected` | `BOOLEAN` | DEFAULT `false` | Whether anomaly was detected |
| `anomalyConfidence` | `DECIMAL(5,4)` | nullable | Anomaly detection confidence (0.0–1.0) |
| `capturedAt` | `TIMESTAMP` | NOT NULL | When reading was captured |
| `processedAt` | `TIMESTAMP` | nullable | When reading was processed |
| `notes` | `TEXT` | nullable | Notes on the reading |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW | Record creation time |

**Indexes:** `operationId`, `sensorType`, `anomalyDetected`, `capturedAt`

---

## Foreign Key Summary

| Table | Column | References |
|---|---|---|
| `subjects` | `operationId` | `search_operations.id` |
| `subjects` | `createdBy` | `users.id` |
| `search_operations` | `createdBy` | `users.id` |
| `probability_zones` | `operationId` | `search_operations.id` |
| `sightings` | `operationId` | `search_operations.id` |
| `sightings` | `subjectId` | `subjects.id` |
| `sightings` | `createdBy` | `users.id` |
| `search_teams` | `operationId` | `search_operations.id` |
| `search_teams` | `assignedZoneId` | `probability_zones.id` |
| `timeline_events` | `operationId` | `search_operations.id` |
| `timeline_events` | `createdBy` | `users.id` |
| `evidence` | `operationId` | `search_operations.id` |
| `evidence` | `subjectId` | `subjects.id` |
| `evidence` | `createdBy` | `users.id` |
| `sensor_data` | `operationId` | `search_operations.id` |
