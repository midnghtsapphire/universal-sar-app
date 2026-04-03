# Field Mapping — Universal SAR Application

Explicit mapping of every UI form field to its database column for every form in the application. This document is the authoritative reference for understanding exactly what data flows from the user interface to the database.

---

## Form 1: New Operation Wizard

### Step 1 — Operation Details

```
UI Label              → React State   → tRPC Input Field       → DB Table.Column
─────────────────────────────────────────────────────────────────────────────────
"Operation Name"      → opName        → name                   → search_operations.name
"Priority"            → priority      → priority               → search_operations.priority
"Environment"         → environment   → environment            → search_operations.environment
"Notes"               → notes         → notes                  → search_operations.notes
```

### Step 2 — Subject Details (Common Fields)

```
UI Label              → React State     → tRPC Input Field         → DB Table.Column
───────────────────────────────────────────────────────────────────────────────────
"Subject Type"        → subjectType     → subject.subjectType      → subjects.subjectType
"Category"            → subjectSubtype  → subject.subjectSubtype   → subjects.subjectSubtype
"Subject Name"        → subjectName     → subject.name             → subjects.name
"Description"         → subjectDesc     → subject.description      → subjects.description
```

### Step 2 — Human Attributes (stored in `subjects.attributes` JSON)

```
UI Label                → attrs Key          → JSON Path in DB
──────────────────────────────────────────────────────────────────
"Age"                   → attrs.age          → subjects.attributes.age
"Gender"                → attrs.gender       → subjects.attributes.gender
"Height (cm)"           → attrs.height_cm    → subjects.attributes.height_cm
"Weight (kg)"           → attrs.weight_kg    → subjects.attributes.weight_kg
"Fitness Level"         → attrs.fitness_level → subjects.attributes.fitness_level
"Experience Level"      → attrs.experience_level → subjects.attributes.experience_level
"Clothing Description"  → attrs.clothing     → subjects.attributes.clothing
"Medical Conditions"    → attrs.medical_conditions → subjects.attributes.medical_conditions
```

### Step 2 — Animal Attributes (stored in `subjects.attributes` JSON)

```
UI Label              → attrs Key              → JSON Path in DB
────────────────────────────────────────────────────────────────────
"Breed"               → attrs.breed            → subjects.attributes.breed
"Color / Markings"    → attrs.color            → subjects.attributes.color
"Weight (kg)"         → attrs.weight_kg        → subjects.attributes.weight_kg
"Training Level"      → attrs.training_level   → subjects.attributes.training_level
"Temperament"         → attrs.temperament      → subjects.attributes.temperament
"Collar / Tags"       → attrs.collar           → subjects.attributes.collar
```

### Step 2 — Vehicle Attributes (stored in `subjects.attributes` JSON)

```
UI Label              → attrs Key              → JSON Path in DB
────────────────────────────────────────────────────────────────────
"Make"                → attrs.make             → subjects.attributes.make
"Model"               → attrs.model            → subjects.attributes.model
"Year"                → attrs.year             → subjects.attributes.year
"Color"               → attrs.color            → subjects.attributes.color
"License Plate"       → attrs.license_plate    → subjects.attributes.license_plate
"Fuel Range (km)"     → attrs.range_km         → subjects.attributes.range_km
```

### Step 2 — Object Attributes (stored in `subjects.attributes` JSON)

```
UI Label              → attrs Key              → JSON Path in DB
────────────────────────────────────────────────────────────────────
"Object Type"         → attrs.object_type      → subjects.attributes.object_type
"Color"               → attrs.color            → subjects.attributes.color
"Size"                → attrs.size             → subjects.attributes.size
"Serial Number"       → attrs.serial_number    → subjects.attributes.serial_number
```

### Step 3 — Location & Terrain

```
UI Label                    → React State    → tRPC Input Field        → DB Table.Column
─────────────────────────────────────────────────────────────────────────────────────────
"Last Known Latitude"       → lastKnownLat   → subject.lastKnownLat   → subjects.lastKnownLat
"Last Known Longitude"      → lastKnownLng   → subject.lastKnownLng   → subjects.lastKnownLng
"Temperature (°C)"          → temperatureC   → temperatureC           → (Python API only, not stored directly)
"Search Radius (m)"         → searchRadiusM  → searchRadiusM          → (Python API only, not stored directly)
"Circumstances / Context"   → circumstances  → subject.circumstances  → subjects.circumstances
```

### Auto-Derived Fields (not entered by user)

```
Source                          → DB Table.Column
────────────────────────────────────────────────────────────────────────────────
subjects.lastKnownLat           → search_operations.centerLat
subjects.lastKnownLng           → search_operations.centerLng
SAR engine: maxRadiusKm         → search_operations.radiusKm
SAR engine: boundaryGeoJson     → search_operations.boundaryGeoJson
Open-Meteo API response         → search_operations.weatherConditions
Python terrain analyst result   → search_operations.terrainData (async)
SAR engine: zones[0].probability → search_operations.probabilityScore
new Date() at submission        → subjects.lastSeenAt
ctx.user.id                     → subjects.createdBy
ctx.user.id                     → search_operations.createdBy
new Date() at submission        → search_operations.startedAt
"active"                        → search_operations.status
```

---

## Form 2: Sightings — Report Sighting Dialog

```
UI Label              → React State       → tRPC Input Field    → DB Table.Column
───────────────────────────────────────────────────────────────────────────────────
"Operation" (select)  → operationId       → operationId         → sightings.operationId
"Latitude"            → lat               → lat                 → sightings.lat
"Longitude"           → lng               → lng                 → sightings.lng
"Sighting Type"       → sightingType      → sightingType        → sightings.sightingType
"Confidence" (slider) → confidence[0]     → confidence          → sightings.confidence
"Description"         → description       → description         → sightings.description
"Reporter Name"       → reporterName      → reporterName        → sightings.reporterName
"Reporter Contact"    → reporterContact   → reporterContact     → sightings.reporterContact
(auto)                → new Date()        → sightedAt           → sightings.sightedAt
(auto)                → ctx.user.id       → (server)            → sightings.createdBy
```

---

## Form 3: Teams — Add Team Dialog

```
UI Label              → React State    → tRPC Input Field    → DB Table.Column
────────────────────────────────────────────────────────────────────────────────
"Team Name"           → name           → name                → search_teams.name
"Team Type"           → teamType       → teamType            → search_teams.teamType
"Member Count"        → memberCount    → memberCount         → search_teams.memberCount
"Contact Info"        → contactInfo    → contactInfo         → search_teams.contactInfo
```

**Fields in DB not yet in UI:** `operationId`, `currentLat`, `currentLng`, `assignedZoneId`, `equipment`, `notes`

---

## Form 4: Evidence — Log Evidence Dialog

```
UI Label              → React State    → tRPC Input Field    → DB Table.Column
────────────────────────────────────────────────────────────────────────────────
"Operation" (select)  → operationId    → operationId         → evidence.operationId
"Title"               → title          → title               → evidence.title
"Evidence Type"       → evidenceType   → evidenceType        → evidence.evidenceType
"Description"         → description    → description         → evidence.description
"Collected By"        → collectedBy    → collectedBy         → evidence.collectedBy
"Latitude"            → lat            → lat                 → evidence.lat
"Longitude"           → lng            → lng                 → evidence.lng
(auto)                → new Date()     → collectedAt         → evidence.collectedAt
(auto)                → ctx.user.id    → (server)            → evidence.createdBy
```

**Fields in DB not yet in UI:** `fileUrl`, `fileType`, `fileSize`, `subjectId`, `chainOfCustody`, `metadata`

---

## Form 5: Snow Bridge Analysis

```
UI Label                → React State     → tRPC Input Field    → Computed Output Field
──────────────────────────────────────────────────────────────────────────────────────
"Snow Depth (m)"        → snowDepth       → snowDepth_m         → (input to physics model)
"Temperature (°C)"      → temperature     → temperature_c       → tensileStrength_Pa
"Gap Width (m)"         → gapWidth        → gapWidth_m          → maxLoad_kg
"Subject Weight (kg)"   → subjectWeight   → subjectWeight_kg    → effectiveCapacity_kg
                                                                 → safetyFactor
                                                                 → willCollapse
                                                                 → riskLevel
                                                                 → bridgeThickness_m
                                                                 → details
```

*Note: Snow bridge analysis results are NOT stored in the database. They are computed on-demand and displayed in the UI only. To persist results, log them as evidence items.*

---

## Form 6: Terrain Analysis (Operation Detail — Manual Re-run)

```
UI Label                → Source                  → tRPC Input Field    → DB Table.Column
──────────────────────────────────────────────────────────────────────────────────────────
(auto from operation)   → operation.id            → operationId         → (FK for update)
(auto from operation)   → operation.centerLat     → lat                 → (passed to Python API)
(auto from operation)   → operation.centerLng     → lon                 → (passed to Python API)
"Radius (m)"            → user input              → radiusM             → (Python API only)
"Temperature (°C)"      → user input              → tempC               → (Python API only)
Python API result       → terrain analyst output  → (server writes)     → search_operations.terrainData
```

---

## Analytics — Movement Profile Calculator

```
UI Label              → React State    → tRPC Input Field    → Algorithm Input
────────────────────────────────────────────────────────────────────────────────
"Subject Type"        → subjectType    → subjectType         → Koester LPB table lookup
"Category"            → subjectSubtype → subjectSubtype      → Koester LPB sub-profile
"Age" (optional)      → age            → attributes.age      → fitness modifier
"Experience"          → experience     → attributes.experience_level → speed modifier
```

---

## Analytics — Weather Lookup

```
UI Label              → React State    → tRPC Input Field    → External API
────────────────────────────────────────────────────────────────────────────────
"Latitude"            → lat            → lat                 → Open-Meteo API
"Longitude"           → lng            → lng                 → Open-Meteo API
```

---

## Summary: Required vs Optional by Form

| Form | Required Fields | Optional Fields |
|---|---|---|
| New Operation Step 1 | Operation Name | Priority, Environment, Notes |
| New Operation Step 2 | Subject Type, Subject Name | Category, Description, all attributes |
| New Operation Step 3 | Last Known Lat, Last Known Lng | Temperature, Search Radius, Circumstances |
| Sightings | Operation, Lat, Lng, Confidence | Sighting Type, Description, Reporter Name/Contact |
| Teams | Team Name | Team Type, Member Count, Contact Info |
| Evidence | Operation, Title, Evidence Type | Description, Collected By, Lat/Lng |
| Snow Bridge | Snow Depth, Temperature | Gap Width, Subject Weight |
| Terrain Analysis | Operation ID, Lat, Lon | Radius, Temperature |
