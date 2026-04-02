# Universal SAR Application — Comprehensive Use Cases

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## UC-01: Missing Child (Urban)

**Actor:** SAR Coordinator, Field Teams, Law Enforcement

**Precondition:** Child reported missing from known location within an urban area.

**Trigger:** Parent/guardian reports child missing; 911 dispatch initiates SAR protocol.

| Field | Input |
|-------|-------|
| Subject Type | Human — Child |
| Required Data | Name, age, last known location (GPS or address), time last seen |
| Optional Data | Photo, height, weight, clothing description, medical conditions, behavioral tendencies (autism, ADHD — affects movement patterns), companion (friend, pet), familiar locations (school, friend's house, park) |
| Movement Model | Child-specific Koester data: ages 1–3 wander 0.2–1.0 km; ages 4–6 wander 0.5–2.0 km; ages 7–12 wander 1.0–4.0 km. Children with autism have different patterns (route-following, attraction to water) |
| Probability Factors | Time of day, familiarity with area, presence of water features (drowning risk), road density (traffic risk), known attractions (playgrounds, stores) |
| Search Strategy | Expanding concentric zones from LKP; prioritize water features within 500m; check all familiar locations; door-to-door canvass |

**Flow:**
1. Operator creates new search operation, selects "Human — Child" subject type.
2. System presents child-specific input form (age-appropriate fields, behavioral flags).
3. Operator enters last known position (LKP) — system geocodes address if needed.
4. System generates initial convex hull from LKP + known locations (home, school, friends).
5. Bayesian probability map generated using child age-group statistics.
6. Map displays probability zones with color-coded urgency.
7. Teams deployed to highest-probability zones first.
8. Each sighting/evidence report triggers Bayesian update, shifting probability zones.
9. Timeline tracks all events, decisions, and status changes.

---

## UC-02: Lost Hiker (Wilderness)

**Actor:** SAR Coordinator, Ground Teams, Helicopter Support

**Precondition:** Hiker reported overdue from planned route in wilderness area.

| Field | Input |
|-------|-------|
| Subject Type | Human — Hiker |
| Required Data | Name, last known location (trailhead or GPS waypoint), planned route, departure time |
| Optional Data | Age, fitness level, experience level (novice/intermediate/expert), equipment carried (GPS, phone, emergency beacon), food/water supply, medical conditions, solo vs group, vehicle at trailhead |
| Movement Model | Koester hiker data: day hikers average 3–5 km from LKP; experienced hikers 5–15 km. Downhill bias in fatigue. Trail-following tendency varies by experience. |
| Probability Factors | Terrain (slope, vegetation, water crossings), weather (temperature, precipitation, visibility), daylight remaining, experience level, equipment, physical fitness |
| Search Strategy | Route-based probability along planned trail; expanding zones at decision points (trail junctions); terrain trap analysis (cliffs, ravines, water crossings) |

**Flow:**
1. Operator creates search, enters planned route waypoints.
2. System calculates convex hull encompassing planned route + maximum deviation radius.
3. Terrain analysis identifies hazard zones (cliffs, water, dense vegetation).
4. Weather data pulled from NOAA for search area — adjusts mobility estimates.
5. Probability zones weighted by trail proximity, terrain difficulty, and time elapsed.
6. Teams assigned to trail segments and high-probability off-trail zones.
7. Sighting reports (footprints, gear, trail register entries) trigger Bayesian updates.

---

## UC-03: Missing Person — Winter/Extreme Cold (Ryan Shtuka Scenario)

**Actor:** SAR Coordinator, Ground Teams, K9 Units, GPR Teams, Forensic Analysts

**Precondition:** Person missing in extreme winter conditions with limited last-known data.

| Field | Input |
|-------|-------|
| Subject Type | Human — Missing Person (Winter) |
| Required Data | Name, last confirmed sighting location, time, ambient temperature |
| Optional Data | Clothing (winter gear or not), intoxication level, destination, route options, physical build (weight affects snow bridge capacity), familiarity with area |
| Movement Model | Extreme cold model: maximum travel time before incapacitation (45 min at -26°C without gear). Downhill-only drift. Path of least resistance to drainage lines. No uphill movement when disoriented. |
| Probability Factors | Temperature (survival time calculation), snow depth (snow bridge risk), terrain slope (gravity-driven movement), creek/ravine proximity (terrain traps), construction barriers (path deviation), time of night (visibility), intoxication (impaired navigation) |
| Special Algorithms | Snow bridge physics calculation, Phase 2/3 anomaly detection zones, GPR target prioritization, construction barrier path deviation analysis |
| Search Strategy | Convex hull from party location + sighting + destination. Erode uphill zones. Prioritize downhill drainage vectors. Identify terrain traps (tree wells, creek crossings, ravines). GPR point-target verification at Sub-Surface Anomaly Targets (SSATs). |

**Flow:**
1. Operator creates cold case search operation with historical data.
2. System plots anchor points: party location (Burfield Dr), sighting (Fairways Dr), destination (home).
3. Maximum travel radius calculated from temperature + clothing + physical condition.
4. Convex hull generated; uphill zones eroded per "no climb" rule.
5. Snow bridge physics engine calculates collapse probability for creek crossings.
6. Terrain trap analysis identifies tree wells, ravines, drainage convergence points.
7. Phase 2/3 anomaly zones marked for GPR survey prioritization.
8. Construction barrier analysis models path deviation from normal routes.
9. Probability map shows Sub-Surface Anomaly Targets (SSATs) for ground teams.

---

## UC-04: Fugitive Search (Law Enforcement)

**Actor:** Law Enforcement, Tactical Teams, Intelligence Analysts

**Precondition:** Warrant issued; subject's last known location established.

| Field | Input |
|-------|-------|
| Subject Type | Human — Fugitive |
| Required Data | Name, last known location, physical description, warrant information |
| Optional Data | Known associates, known vehicles, financial records (last transactions), phone records, social media accounts, criminal history (escape patterns), skills (survival, evasion), known hideouts |
| Movement Model | Evasion model: intentional avoidance of populated areas OR blending into urban environment. Vehicle-based flight radius. Known associate proximity weighting. Financial transaction tracking. |
| Probability Factors | Access to vehicle, financial resources, social network geography, criminal sophistication, terrain knowledge, time elapsed, media coverage (affects behavior) |
| Search Strategy | Intelligence-driven zones around known associates, financial activity, vehicle sightings. Expanding perimeter based on elapsed time and transportation access. |

---

## UC-05: Lost Dog

**Actor:** Pet Owner, Volunteer Search Teams, Animal Control

**Precondition:** Dog missing from known location.

| Field | Input |
|-------|-------|
| Subject Type | Animal — Dog |
| Required Data | Breed (or description), last known location, time missing |
| Optional Data | Name, age, weight, color/markings, microchip ID, collar description, temperament (friendly/fearful/aggressive), training level, medical conditions, spayed/neutered, photo, known hangout spots |
| Movement Model | Dog behavior varies dramatically by breed and temperament. Fearful dogs: hide within 0.5 km, move at night. Friendly dogs: approach people, travel 2–5 km following scent trails. Hunting breeds: follow prey scent 5–15 km. Small dogs: limited range 0.5–2 km. Large dogs: range 2–10 km. |
| Probability Factors | Breed-specific range, temperament (fear vs curiosity), urban vs rural, traffic density, water sources, food sources (restaurants, garbage), other animals, weather, time of day |
| Search Strategy | Scent-based zones from LKP. Feeding station placement at high-probability locations. Trail camera deployment. Social media alerts with photo. Check shelters and vet offices. |

---

## UC-06: Missing Vehicle

**Actor:** Law Enforcement, Insurance Investigators, Owner

**Precondition:** Vehicle reported stolen or missing.

| Field | Input |
|-------|-------|
| Subject Type | Vehicle |
| Required Data | Make, model, year, color, license plate, last known location |
| Optional Data | VIN, GPS tracker data, dashcam footage, fuel level (range estimate), distinguishing features (damage, stickers, modifications), owner's typical routes, theft method (keys vs hotwire) |
| Movement Model | Road-network constrained. Maximum range from fuel level. Highway vs surface street probability. Chop shop proximity. Border crossing analysis. Parking structure/lot probability. |
| Probability Factors | Road network connectivity, fuel range, time elapsed, traffic camera coverage, ALPR (Automated License Plate Reader) data, chop shop locations, border proximity |
| Search Strategy | Road-network-based expanding perimeter. ALPR alert zones. Traffic camera review corridors. Known vehicle disposal sites. |

---

## UC-07: Maritime Search (Person Overboard / Vessel)

**Actor:** Coast Guard, Maritime SAR, Vessel Operators

**Precondition:** Person or vessel reported missing at sea.

| Field | Input |
|-------|-------|
| Subject Type | Human — Maritime / Vessel |
| Required Data | Last known position, time, vessel type (if applicable) |
| Optional Data | Sea state, water temperature, current data, wind speed/direction, survival equipment (PFD, life raft, EPIRB), number of persons, vessel specifications, drift objects deployed |
| Movement Model | Drift model: wind + current vectors. Leeway calculation based on object profile (person in water vs life raft vs vessel). Survival time from water temperature (hypothermia curve). |
| Probability Factors | Current speed/direction, wind speed/direction, sea state, water temperature, survival equipment, time in water, object leeway characteristics |
| Search Strategy | Expanding drift-based search patterns (sector, parallel track, expanding square). Probability zones shift with current/wind over time. |

---

## UC-08: Wilderness SAR — Wildlife Tracking

**Actor:** Wildlife Officers, Conservation Teams, Researchers

**Precondition:** Tagged/collared animal signal lost or animal reported in distress.

| Field | Input |
|-------|-------|
| Subject Type | Animal — Wildlife |
| Required Data | Species, last known location (collar GPS or sighting), time |
| Optional Data | Collar/tag ID, frequency, age, sex, health status, migration pattern data, territory boundaries, den/nest locations, seasonal behavior |
| Movement Model | Species-specific home range and movement patterns. Seasonal migration corridors. Territory boundaries. Denning/nesting behavior. Water/food source proximity. Human avoidance zones. |
| Probability Factors | Species behavior, season, time of day, terrain, water sources, food availability, human activity, weather, breeding season |
| Search Strategy | Territory-based probability zones. Migration corridor monitoring. Telemetry signal triangulation. Camera trap deployment. |

---

## UC-09: Missing Object / Equipment

**Actor:** Owner, Security Personnel, Investigators

**Precondition:** Valuable object or equipment missing from known location.

| Field | Input |
|-------|-------|
| Subject Type | Object |
| Required Data | Description, last known location, time last seen |
| Optional Data | Value, size/weight, GPS tracker, serial number, photo, transport method (carried, vehicle, shipped), tracking number, security footage |
| Movement Model | Objects do not self-propel — model based on human/vehicle transport. If GPS-tracked, use track history. If shipped, use carrier tracking. If stolen, use theft pattern analysis. |
| Probability Factors | Transport method, time elapsed, value (motivation for distance), size (concealment difficulty), tracking capability |
| Search Strategy | Surveillance review, transport route analysis, pawn shop / resale monitoring, GPS track following. |

---

## UC-10: Mass Casualty / Disaster Search

**Actor:** Emergency Management, USAR Teams, Multiple Agencies

**Precondition:** Natural disaster or mass casualty event with multiple missing persons.

| Field | Input |
|-------|-------|
| Subject Type | Multiple — Mixed |
| Required Data | Event location, event type, estimated number of missing, affected area boundary |
| Optional Data | Building occupancy data, event attendance lists, cell tower data, social media check-ins, hospital admission records |
| Movement Model | Displacement model based on event type (earthquake: structural collapse zones; flood: water flow + elevation; wildfire: evacuation route + fire spread; avalanche: debris field). |
| Probability Factors | Event type, structural integrity, terrain, weather, time elapsed, resource availability, access routes |
| Search Strategy | Grid-based systematic search of affected area. Triage zones. Structural assessment. Canine deployment. Technical rescue equipment. |
