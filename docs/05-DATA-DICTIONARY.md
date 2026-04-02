# Universal SAR Application — Data Dictionary & Database Architecture

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## Polymorphic Subject Model

The core design challenge is that different subject types have fundamentally different attributes. A missing child has age, fitness level, and behavioral tendencies. A lost dog has breed, temperament, and training level. A stolen vehicle has make, model, and fuel level. The system solves this with a **polymorphic subject table** that stores common fields as typed columns and type-specific attributes in a JSON column.

---

## Table: `subjects`

The central entity representing any person, animal, vehicle, or object being searched for.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Unique subject identifier |
| operationId | INT | No (FK) | Associated search operation |
| subjectType | ENUM('human','animal','vehicle','object') | Yes | Primary type classification |
| subjectSubtype | VARCHAR(64) | No | Subtype: 'child','hiker','fugitive','elderly','dog','cat','wildlife','car','truck','boat','equipment','valuables' |
| name | VARCHAR(255) | Yes | Subject name or identifier |
| description | TEXT | No | Free-text physical description |
| photoUrl | VARCHAR(512) | No | S3 URL to primary photo |
| lastKnownLat | DECIMAL(10,7) | Yes | Last known position latitude |
| lastKnownLng | DECIMAL(10,7) | Yes | Last known position longitude |
| lastKnownAlt | DECIMAL(8,2) | No | Last known altitude (meters) |
| lastSeenAt | TIMESTAMP | Yes | Date/time last confirmed seen |
| directionOfTravel | VARCHAR(16) | No | Compass direction if known |
| circumstances | VARCHAR(64) | No | 'voluntary','involuntary','accident','unknown' |
| status | ENUM('missing','located','deceased','suspended') | Yes | Current subject status |
| attributes | JSON | No | Type-specific attributes (see below) |
| createdBy | INT | Yes (FK) | User who created the record |
| createdAt | TIMESTAMP | Yes | Record creation time |
| updatedAt | TIMESTAMP | Yes | Last update time |

### JSON `attributes` Schema by Subject Type

**Human Attributes:**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| age | number | Recommended | Age in years |
| gender | string | Recommended | Gender identity |
| height_cm | number | Optional | Height in centimeters |
| weight_kg | number | Optional | Weight in kilograms |
| hair_color | string | Optional | Hair color |
| eye_color | string | Optional | Eye color |
| clothing | string | Optional | Clothing description at time of disappearance |
| medical_conditions | string[] | Optional | List of medical conditions |
| medications | string[] | Optional | Current medications |
| fitness_level | string | Optional | 'poor','fair','good','excellent' |
| experience_level | string | Optional | 'novice','intermediate','expert' (for hikers) |
| equipment_carried | string[] | Optional | Items carried (GPS, phone, beacon, etc.) |
| behavioral_flags | string[] | Optional | 'autism','alzheimers','suicidal','intoxicated','despondent' |
| intoxication_level | string | Optional | 'none','mild','moderate','severe' |
| familiarity_with_area | string | Optional | 'none','some','familiar','expert' |
| planned_route | object | Optional | GeoJSON LineString of planned route |
| known_locations | object[] | Optional | Array of {name, lat, lng} for familiar places |
| phone_number | string | Optional | Mobile phone number (for ping triangulation) |
| phone_last_ping | object | Optional | {lat, lng, timestamp, accuracy_m} |

**Animal Attributes:**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| species | string | Yes | 'dog','cat','horse','bird','wildlife_other' |
| breed | string | Recommended | Breed or breed mix |
| color_markings | string | Recommended | Color and distinctive markings |
| weight_kg | number | Optional | Weight in kilograms |
| age_years | number | Optional | Age in years |
| temperament | string | Recommended | 'friendly','fearful','aggressive','skittish' |
| training_level | string | Optional | 'untrained','basic','advanced','service' |
| microchip_id | string | Optional | Microchip identification number |
| collar_description | string | Optional | Collar color, tags, contact info |
| spayed_neutered | boolean | Optional | Spay/neuter status |
| indoor_outdoor | string | Optional | 'indoor_only','outdoor_access','outdoor_only' |
| known_hangouts | object[] | Optional | Array of {name, lat, lng} |
| prey_drive | string | Optional | 'none','low','moderate','high' |

**Vehicle Attributes:**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| make | string | Yes | Vehicle manufacturer |
| model | string | Yes | Vehicle model |
| year | number | Yes | Model year |
| color | string | Yes | Exterior color |
| license_plate | string | Recommended | License plate number |
| state_province | string | Optional | Registration jurisdiction |
| vin | string | Optional | Vehicle Identification Number |
| fuel_level_pct | number | Optional | Estimated fuel level (0–100) |
| fuel_type | string | Optional | 'gasoline','diesel','electric','hybrid' |
| range_km | number | Optional | Estimated remaining range |
| gps_tracker | boolean | Optional | Has GPS tracking device |
| gps_tracker_id | string | Optional | Tracker device ID |
| distinguishing_features | string | Optional | Damage, stickers, modifications |
| theft_method | string | Optional | 'keys','hotwire','tow','carjack' |

**Object Attributes:**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| category | string | Yes | 'equipment','valuables','evidence','document','other' |
| dimensions | string | Optional | Size description or L x W x H |
| weight_kg | number | Optional | Weight |
| serial_number | string | Optional | Serial or identification number |
| value_usd | number | Optional | Estimated value |
| tracking_number | string | Optional | Shipping/tracking number |
| gps_tracker | boolean | Optional | Has GPS tracking |
| portability | string | Optional | 'pocket','carried','vehicle_required','immovable' |

---

## Table: `search_operations`

Represents an active or historical search and rescue operation.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Unique operation identifier |
| name | VARCHAR(255) | Yes | Operation name/title |
| status | ENUM('planning','active','suspended','closed','cold_case') | Yes | Current operation status |
| priority | ENUM('critical','high','medium','low') | Yes | Priority level |
| environment | ENUM('urban','suburban','wilderness','maritime','mountain','desert','arctic') | Yes | Primary environment type |
| centerLat | DECIMAL(10,7) | Yes | Search area center latitude |
| centerLng | DECIMAL(10,7) | Yes | Search area center longitude |
| radiusKm | DECIMAL(8,2) | Yes | Maximum search radius in km |
| boundaryGeoJson | JSON | No | GeoJSON polygon of search boundary (convex hull or custom) |
| probabilityScore | DECIMAL(5,2) | No | Current overall probability score (0–100) |
| weatherConditions | JSON | No | Current weather data for search area |
| terrainData | JSON | No | Terrain analysis data |
| notes | TEXT | No | Operational notes |
| startedAt | TIMESTAMP | Yes | Operation start time |
| closedAt | TIMESTAMP | No | Operation close time |
| createdBy | INT | Yes (FK) | User who created the operation |
| createdAt | TIMESTAMP | Yes | Record creation time |
| updatedAt | TIMESTAMP | Yes | Last update time |

---

## Table: `probability_zones`

Stores calculated probability zones within a search operation.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Zone identifier |
| operationId | INT | Yes (FK) | Parent search operation |
| zoneName | VARCHAR(128) | No | Human-readable zone name |
| zoneType | ENUM('primary','secondary','tertiary','exclusion') | Yes | Zone classification |
| probability | DECIMAL(5,4) | Yes | Probability value (0.0000–1.0000) |
| geoJson | JSON | Yes | GeoJSON polygon defining zone boundary |
| centerLat | DECIMAL(10,7) | Yes | Zone center latitude |
| centerLng | DECIMAL(10,7) | Yes | Zone center longitude |
| areaKm2 | DECIMAL(10,4) | No | Zone area in square kilometers |
| algorithm | VARCHAR(64) | No | Algorithm that generated this zone |
| confidence | DECIMAL(5,4) | No | Confidence level of the calculation |
| notes | TEXT | No | Zone-specific notes |
| createdAt | TIMESTAMP | Yes | Calculation time |
| updatedAt | TIMESTAMP | Yes | Last recalculation time |

---

## Table: `sightings`

Reports of subject sightings or evidence finds.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Sighting identifier |
| operationId | INT | Yes (FK) | Associated search operation |
| subjectId | INT | Yes (FK) | Associated subject |
| lat | DECIMAL(10,7) | Yes | Sighting latitude |
| lng | DECIMAL(10,7) | Yes | Sighting longitude |
| sightedAt | TIMESTAMP | Yes | Time of sighting |
| sightingType | ENUM('visual','auditory','physical_evidence','electronic','scent','footprint','other') | Yes | Type of sighting |
| confidence | INT | Yes | Confidence level 1–10 |
| description | TEXT | No | Sighting description |
| reporterName | VARCHAR(255) | No | Name of person reporting |
| reporterContact | VARCHAR(255) | No | Contact information |
| photoUrl | VARCHAR(512) | No | Photo evidence URL |
| verified | BOOLEAN | No | Whether sighting has been verified |
| createdBy | INT | No (FK) | User who entered the report |
| createdAt | TIMESTAMP | Yes | Record creation time |

---

## Table: `search_teams`

Teams assigned to search operations.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Team identifier |
| name | VARCHAR(128) | Yes | Team name |
| teamType | ENUM('ground','k9','aerial','marine','technical','gpr','drone','mounted') | Yes | Team specialization |
| status | ENUM('available','deployed','returning','off_duty') | Yes | Current status |
| memberCount | INT | No | Number of team members |
| operationId | INT | No (FK) | Currently assigned operation |
| currentLat | DECIMAL(10,7) | No | Current position latitude |
| currentLng | DECIMAL(10,7) | No | Current position longitude |
| assignedZoneId | INT | No (FK) | Assigned probability zone |
| equipment | JSON | No | Equipment list |
| contactInfo | VARCHAR(255) | No | Primary contact |
| notes | TEXT | No | Team notes |
| createdAt | TIMESTAMP | Yes | Record creation time |
| updatedAt | TIMESTAMP | Yes | Last update time |

---

## Table: `timeline_events`

Chronological log of all events in a search operation.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Event identifier |
| operationId | INT | Yes (FK) | Associated operation |
| eventType | ENUM('status_change','sighting','team_deployed','team_recalled','probability_update','weather_update','evidence_found','note','decision','resource_change') | Yes | Event classification |
| title | VARCHAR(255) | Yes | Event title |
| description | TEXT | No | Event details |
| lat | DECIMAL(10,7) | No | Event location latitude |
| lng | DECIMAL(10,7) | No | Event location longitude |
| metadata | JSON | No | Additional event data |
| createdBy | INT | No (FK) | User who created the event |
| createdAt | TIMESTAMP | Yes | Event timestamp |

---

## Table: `evidence`

Evidence items associated with search operations.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Evidence identifier |
| operationId | INT | Yes (FK) | Associated operation |
| subjectId | INT | No (FK) | Associated subject |
| evidenceType | ENUM('photo','document','physical','digital','forensic','sensor_data','video','audio') | Yes | Evidence classification |
| title | VARCHAR(255) | Yes | Evidence title |
| description | TEXT | No | Evidence description |
| fileUrl | VARCHAR(512) | No | S3 URL to evidence file |
| fileType | VARCHAR(64) | No | MIME type |
| fileSize | INT | No | File size in bytes |
| collectedAt | TIMESTAMP | No | When evidence was collected |
| collectedBy | VARCHAR(255) | No | Who collected the evidence |
| lat | DECIMAL(10,7) | No | Collection location latitude |
| lng | DECIMAL(10,7) | No | Collection location longitude |
| chainOfCustody | JSON | No | Array of custody transfer records |
| metadata | JSON | No | Additional metadata |
| createdBy | INT | No (FK) | User who entered the record |
| createdAt | TIMESTAMP | Yes | Record creation time |

---

## Table: `sensor_data`

Data from advanced sensors (drones, GPR, acoustic, thermal, etc.).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | INT AUTO_INCREMENT | Yes (PK) | Record identifier |
| operationId | INT | Yes (FK) | Associated operation |
| sensorType | ENUM('drone_thermal','drone_lidar','drone_visual','gpr','acoustic','seismic','trail_camera','sonar','cell_ping','satellite') | Yes | Sensor type |
| lat | DECIMAL(10,7) | Yes | Data point latitude |
| lng | DECIMAL(10,7) | Yes | Data point longitude |
| altitude | DECIMAL(8,2) | No | Altitude in meters |
| reading | JSON | Yes | Sensor-specific reading data |
| anomalyDetected | BOOLEAN | No | Whether an anomaly was flagged |
| anomalyConfidence | DECIMAL(5,4) | No | Anomaly confidence (0–1) |
| capturedAt | TIMESTAMP | Yes | When data was captured |
| processedAt | TIMESTAMP | No | When data was processed |
| notes | TEXT | No | Analyst notes |
| createdAt | TIMESTAMP | Yes | Record creation time |

---

## Entity Relationship Summary

The database follows a star schema centered on `search_operations`:

- **search_operations** 1:N **subjects** (one operation can search for multiple subjects)
- **search_operations** 1:N **probability_zones** (one operation has many probability zones)
- **search_operations** 1:N **sightings** (one operation receives many sighting reports)
- **search_operations** 1:N **search_teams** (one operation deploys many teams)
- **search_operations** 1:N **timeline_events** (one operation has a chronological event log)
- **search_operations** 1:N **evidence** (one operation collects many evidence items)
- **search_operations** 1:N **sensor_data** (one operation receives many sensor readings)
- **subjects** 1:N **sightings** (one subject can have many sightings)
- **subjects** 1:N **evidence** (one subject can have associated evidence)
- **probability_zones** 1:N **search_teams** (teams are assigned to zones)
- **users** 1:N **search_operations** (users create operations)
- **users** 1:N **subjects** (users create subject records)
- **users** 1:N **timeline_events** (users create events)
