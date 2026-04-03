# Data Dictionary — Universal SAR Application

Every field in every form, mapped to its exact database column, data type, constraints, and description. Organized by form/screen, then by database table.

---

## 1. New Operation Wizard — Form Fields to Database Mapping

### Step 1: Operation Details

| UI Label | React State | DB Table | DB Column | Type | Required | Description |
|---|---|---|---|---|---|---|
| Operation Name | `opName` | `search_operations` | `name` | `VARCHAR(255)` | **Required** | Human-readable name for the search operation |
| Priority | `priority` | `search_operations` | `priority` | `ENUM('critical','high','medium','low')` | Optional (default: `medium`) | Urgency level of the operation |
| Environment | `environment` | `search_operations` | `environment` | `ENUM('urban','suburban','wilderness','maritime','mountain','desert','arctic')` | Optional (default: `wilderness`) | Terrain/environment type affects movement profiles |
| Notes | `notes` | `search_operations` | `notes` | `TEXT` | Optional | Free-text operational notes |

### Step 2: Subject Details

| UI Label | React State | DB Table | DB Column | Type | Required | Description |
|---|---|---|---|---|---|---|
| Subject Type | `subjectType` | `subjects` | `subjectType` | `ENUM('human','animal','vehicle','object')` | **Required** | Discriminator for polymorphic subject model |
| Category | `subjectSubtype` | `subjects` | `subjectSubtype` | `VARCHAR(64)` | Optional | Subtype within the subject type (e.g. `hiker`, `dog`, `car`) |
| Subject Name | `subjectName` | `subjects` | `name` | `VARCHAR(255)` | **Required** | Name of the missing subject |
| Description | `subjectDesc` | `subjects` | `description` | `TEXT` | Optional | Physical description or identifying details |

#### Human-Specific Attributes (stored in `subjects.attributes` JSON)

| UI Label | JSON Key | Type | Required | Description |
|---|---|---|---|---|
| Age | `age` | `INTEGER` | Optional | Age in years |
| Gender | `gender` | `ENUM('male','female','other')` | Optional | Gender identity |
| Height (cm) | `height_cm` | `INTEGER` | Optional | Height in centimetres |
| Weight (kg) | `weight_kg` | `INTEGER` | Optional | Weight in kilograms |
| Fitness Level | `fitness_level` | `ENUM('excellent','good','average','poor')` | Optional | Physical fitness level; affects movement radius |
| Experience Level | `experience_level` | `ENUM('expert','intermediate','novice','none')` | Optional | Outdoor/terrain experience; affects survival probability |
| Clothing Description | `clothing` | `STRING` | Optional | Description of clothing worn at time of disappearance |
| Medical Conditions | `medical_conditions` | `STRING` | Optional | Known medical conditions affecting search urgency |

#### Animal-Specific Attributes (stored in `subjects.attributes` JSON)

| UI Label | JSON Key | Type | Required | Description |
|---|---|---|---|---|
| Breed | `breed` | `STRING` | Optional | Breed of animal (e.g. Golden Retriever) |
| Color / Markings | `color` | `STRING` | Optional | Coat color and distinguishing markings |
| Weight (kg) | `weight_kg` | `INTEGER` | Optional | Weight in kilograms |
| Training Level | `training_level` | `ENUM('service','advanced','basic','none')` | Optional | Training level affects return-to-owner probability |
| Temperament | `temperament` | `ENUM('friendly','fearful','aggressive','calm')` | Optional | Affects approach strategy for field teams |
| Collar / Tags | `collar` | `STRING` | Optional | Collar description and tag/chip numbers |

#### Vehicle-Specific Attributes (stored in `subjects.attributes` JSON)

| UI Label | JSON Key | Type | Required | Description |
|---|---|---|---|---|
| Make | `make` | `STRING` | Optional | Vehicle manufacturer (e.g. Toyota) |
| Model | `model` | `STRING` | Optional | Vehicle model (e.g. 4Runner) |
| Year | `year` | `INTEGER` | Optional | Model year |
| Color | `color` | `STRING` | Optional | Exterior color |
| License Plate | `license_plate` | `STRING` | Optional | Plate number and jurisdiction |
| Fuel Range (km) | `range_km` | `INTEGER` | Optional | Maximum range on full tank; constrains search radius |

#### Object-Specific Attributes (stored in `subjects.attributes` JSON)

| UI Label | JSON Key | Type | Required | Description |
|---|---|---|---|---|
| Object Type | `object_type` | `STRING` | Optional | Type of object (e.g. Backpack, GPS device) |
| Color | `color` | `STRING` | Optional | Primary color |
| Size | `size` | `STRING` | Optional | Dimensions or size description |
| Serial Number | `serial_number` | `STRING` | Optional | Manufacturer serial number for identification |

### Step 3: Location & Terrain

| UI Label | React State | DB Table | DB Column | Type | Required | Description |
|---|---|---|---|---|---|---|
| Last Known Latitude | `lastKnownLat` | `subjects` | `lastKnownLat` | `DECIMAL(10,7)` | **Required** | WGS84 latitude of last known position (LKP) |
| Last Known Longitude | `lastKnownLng` | `subjects` | `lastKnownLng` | `DECIMAL(10,7)` | **Required** | WGS84 longitude of last known position (LKP) |
| Temperature (°C) | `temperatureC` | Passed to Python API | — | `FLOAT` | Optional (default: `-18`) | Ambient temperature; affects GPR dielectric constant and snow bridge analysis |
| Search Radius (m) | `searchRadiusM` | Passed to Python API | — | `INTEGER` | Optional (default: `500`) | Radius in metres for terrain analysis grid |
| Circumstances | `circumstances` | `subjects` | `circumstances` | `TEXT` | Optional | Narrative of how the subject came to be missing |

**Derived fields written automatically on operation creation:**

| DB Table | DB Column | Source | Description |
|---|---|---|---|
| `search_operations` | `centerLat` | `subjects.lastKnownLat` | Operation center point (copied from LKP) |
| `search_operations` | `centerLng` | `subjects.lastKnownLng` | Operation center point (copied from LKP) |
| `search_operations` | `radiusKm` | SAR engine output | Calculated maximum travel radius |
| `search_operations` | `boundaryGeoJson` | SAR engine output | Convex hull GeoJSON polygon |
| `search_operations` | `weatherConditions` | Open-Meteo API | Current weather at LKP |
| `search_operations` | `terrainData` | Python terrain analyst | Full terrain analysis result (async) |
| `probability_zones` | (3 rows) | SAR engine output | Primary, secondary, tertiary probability zones |
| `timeline_events` | (1 row) | Auto-generated | "Search Operation Launched" event |

---

## 2. Sightings Form

| UI Label | React State | DB Table | DB Column | Type | Required | Description |
|---|---|---|---|---|---|---|
| Operation | `operationId` | `sightings` | `operationId` | `INT` | **Required** | FK to `search_operations.id` |
| Latitude | `lat` | `sightings` | `lat` | `DECIMAL(10,7)` | **Required** | WGS84 latitude of sighting location |
| Longitude | `lng` | `sightings` | `lng` | `DECIMAL(10,7)` | **Required** | WGS84 longitude of sighting location |
| Sighting Type | `sightingType` | `sightings` | `sightingType` | `ENUM('visual','auditory','physical_evidence','electronic','scent','footprint','other')` | Optional (default: `visual`) | Type of sighting evidence |
| Confidence (1–10) | `confidence[0]` | `sightings` | `confidence` | `INT` | **Required** | Confidence level 1–10; used as Bayesian likelihood weight |
| Description | `description` | `sightings` | `description` | `TEXT` | Optional | Narrative description of the sighting |
| Reporter Name | `reporterName` | `sightings` | `reporterName` | `VARCHAR(255)` | Optional | Name of person reporting the sighting |
| Reporter Contact | `reporterContact` | `sightings` | `reporterContact` | `VARCHAR(255)` | Optional | Phone or email of reporter |
| Sighted At | Auto: `new Date()` | `sightings` | `sightedAt` | `TIMESTAMP` | **Required** | Timestamp of sighting (set to current time on submission) |

**Side effects on submission:** Bayesian probability zones are recalculated for the operation. All existing zones are deleted and replaced with updated zones incorporating the new sighting's location and confidence weight. A timeline event of type `sighting` is created.

---

## 3. Teams Form

| UI Label | React State | DB Table | DB Column | Type | Required | Description |
|---|---|---|---|---|---|---|
| Team Name | `name` | `search_teams` | `name` | `VARCHAR(128)` | **Required** | Identifier for the search team |
| Team Type | `teamType` | `search_teams` | `teamType` | `ENUM('ground','k9','aerial','marine','technical','gpr','drone','mounted')` | Optional (default: `ground`) | Type of team; determines equipment and capabilities |
| Member Count | `memberCount` | `search_teams` | `memberCount` | `INT` | Optional | Number of personnel on the team |
| Contact Info | `contactInfo` | `search_teams` | `contactInfo` | `VARCHAR(255)` | Optional | Radio channel, phone number, or call sign |

**Fields available in DB but not yet in UI:** `operationId`, `currentLat`, `currentLng`, `assignedZoneId`, `equipment` (JSON), `notes`.

---

## 4. Evidence Form

| UI Label | React State | DB Table | DB Column | Type | Required | Description |
|---|---|---|---|---|---|---|
| Operation | `operationId` | `evidence` | `operationId` | `INT` | **Required** | FK to `search_operations.id` |
| Title | `title` | `evidence` | `title` | `VARCHAR(255)` | **Required** | Short descriptive title for the evidence item |
| Evidence Type | `evidenceType` | `evidence` | `evidenceType` | `ENUM('photo','document','physical','digital','forensic','sensor_data','video','audio')` | **Required** | Classification of evidence |
| Description | `description` | `evidence` | `description` | `TEXT` | Optional | Detailed description of the evidence |
| Collected By | `collectedBy` | `evidence` | `collectedBy` | `VARCHAR(255)` | Optional | Name of person who collected the evidence |
| Latitude | `lat` | `evidence` | `lat` | `DECIMAL(10,7)` | Optional | WGS84 latitude where evidence was found |
| Longitude | `lng` | `evidence` | `lng` | `DECIMAL(10,7)` | Optional | WGS84 longitude where evidence was found |
| Collected At | Auto: `new Date()` | `evidence` | `collectedAt` | `TIMESTAMP` | Optional | Timestamp of collection (set to current time on submission) |

**Side effects on submission:** A timeline event of type `evidence_found` is created for the operation.

---

## 5. Snow Bridge Analysis Form

| UI Label | React State | tRPC Input | Type | Required | Description |
|---|---|---|---|---|---|
| Snow Depth (m) | `snowDepth` | `snowDepth_m` | `FLOAT` | **Required** | Depth of snow bridge in metres |
| Temperature (°C) | `temperature` | `temperature_c` | `FLOAT` | **Required** | Ambient temperature; affects snow tensile strength |
| Gap Width (m) | `gapWidth` | `gapWidth_m` | `FLOAT` | Optional (default: `2.0`) | Width of the gap the bridge spans |
| Subject Weight (kg) | `subjectWeight` | `subjectWeight_kg` | `FLOAT` | Optional (default: `75.0`) | Weight of subject on the bridge |

**Output fields from `analytics.snowBridge` query:**

| Field | Type | Description |
|---|---|---|
| `safetyFactor` | `FLOAT` | Ratio of bridge capacity to applied load (>1.5 = safe) |
| `willCollapse` | `BOOLEAN` | True if safety factor < 1.0 |
| `riskLevel` | `ENUM('safe','caution','danger','critical')` | Risk classification |
| `bridgeThickness_m` | `FLOAT` | Effective structural thickness |
| `tensileStrength_Pa` | `FLOAT` | Snow tensile strength at given temperature |
| `maxLoad_kg` | `FLOAT` | Maximum load bridge can sustain |
| `effectiveCapacity_kg` | `FLOAT` | Capacity after erosion factor applied |
| `details` | `STRING` | Human-readable analysis summary |

---

## 6. Terrain Analysis (Operation Detail — Manual Re-run)

| UI Label | tRPC Input | Type | Required | Description |
|---|---|---|---|---|
| Operation ID | `operationId` | `INT` | **Required** | FK to `search_operations.id` |
| Latitude | `lat` | `FLOAT` | **Required** | Centre point latitude for analysis |
| Longitude | `lon` | `FLOAT` | **Required** | Centre point longitude for analysis |
| Radius (m) | `radiusM` | `INT` | Optional (default: `500`) | Analysis radius in metres |
| Temperature (°C) | `tempC` | `FLOAT` | Optional (default: `-18`) | Ambient temperature for GPR protocol |
