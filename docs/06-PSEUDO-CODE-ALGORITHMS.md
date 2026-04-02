# Universal SAR Application — Pseudo Code & Core Algorithms

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## Algorithm 1: Convex Hull Generation (Graham Scan)

The convex hull defines the outer boundary of the search area — the "rubber band" stretched around all known data points (last known position, sightings, known locations, maximum travel radius points).

```
FUNCTION generateConvexHull(points[]):
    IF points.length < 3:
        RETURN points  // Cannot form a hull

    // Step 1: Find the lowest point (anchor)
    anchor = point with minimum latitude (break ties by minimum longitude)

    // Step 2: Sort remaining points by polar angle relative to anchor
    sorted = SORT points by polarAngle(anchor, point) ascending
    // If same angle, sort by distance from anchor (nearest first)

    // Step 3: Graham Scan
    stack = [anchor, sorted[0], sorted[1]]

    FOR i = 2 TO sorted.length - 1:
        WHILE stack.length > 1 AND crossProduct(stack[-2], stack[-1], sorted[i]) <= 0:
            stack.POP()  // Remove point that makes clockwise turn
        stack.PUSH(sorted[i])

    RETURN stack  // Ordered vertices of convex hull

FUNCTION crossProduct(O, A, B):
    RETURN (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng)

FUNCTION polarAngle(origin, point):
    RETURN ATAN2(point.lat - origin.lat, point.lng - origin.lng)
```

### Convex Hull with Maximum Travel Radius

For SAR operations, the convex hull is expanded by the subject's maximum possible travel distance, which varies by subject type, conditions, and time elapsed.

```
FUNCTION generateSearchBoundary(anchorPoints[], subject, conditions):
    // Step 1: Calculate maximum travel radius
    maxRadius = calculateMaxTravelRadius(subject, conditions)

    // Step 2: Generate buffer points around each anchor
    bufferedPoints = []
    FOR EACH anchor IN anchorPoints:
        FOR angle = 0 TO 360 STEP 15:
            bufferedPoint = offsetPoint(anchor, maxRadius, angle)
            bufferedPoints.PUSH(bufferedPoint)

    // Step 3: Combine anchor points and buffer points
    allPoints = anchorPoints + bufferedPoints

    // Step 4: Generate convex hull
    hull = generateConvexHull(allPoints)

    // Step 5: Apply terrain erosion (remove uphill zones if applicable)
    IF subject.type == 'human' AND conditions.disoriented:
        hull = erodeUphillZones(hull, terrainData)

    RETURN hull
```

---

## Algorithm 2: Bayesian Probability Mapping

The Bayesian engine maintains a probability distribution across the search area and updates it as new evidence arrives. This is the core intelligence of the system.

```
FUNCTION initializeProbabilityGrid(searchBoundary, resolution_m):
    // Create grid of cells covering the search boundary
    grid = createGrid(searchBoundary, resolution_m)  // e.g., 50m cells

    FOR EACH cell IN grid:
        // Prior probability based on subject type + Lost Person Behavior data
        cell.prior = calculatePrior(cell, subject, terrain, weather)

    // Normalize so all priors sum to 1.0
    totalPrior = SUM(cell.prior FOR cell IN grid)
    FOR EACH cell IN grid:
        cell.probability = cell.prior / totalPrior

    RETURN grid

FUNCTION calculatePrior(cell, subject, terrain, weather):
    prior = 1.0

    // Distance decay from Last Known Position
    distFromLKP = haversineDistance(cell.center, subject.lastKnownPosition)
    distanceFactor = lookupDistanceDistribution(subject.type, subject.subtype, distFromLKP)
    prior *= distanceFactor

    // Terrain factor
    slope = terrain.getSlopeAt(cell.center)
    vegetation = terrain.getVegetationDensityAt(cell.center)
    waterProximity = terrain.getWaterProximityAt(cell.center)

    IF subject.type == 'human':
        // Humans avoid steep slopes when lost (>30° reduces probability)
        prior *= slopePenalty(slope, subject.fitness_level)
        // Dense vegetation reduces travel probability
        prior *= vegetationPenalty(vegetation)
        // Water features are attractors (people follow water) AND hazards
        prior *= waterFactor(waterProximity, subject.subtype)

    IF subject.type == 'animal' AND subject.subtype == 'dog':
        // Dogs follow scent trails, less affected by slope
        prior *= dogMovementFactor(cell, subject.attributes)

    // Weather factor
    tempFactor = temperatureImpact(weather.temperature, subject)
    windFactor = windImpact(weather.windSpeed, weather.windDirection, cell)
    prior *= tempFactor * windFactor

    // Elevation factor (downhill bias for disoriented subjects)
    IF subject.circumstances == 'involuntary' OR subject.behavioral_flags.includes('intoxicated'):
        elevDiff = terrain.getElevationAt(cell.center) - terrain.getElevationAt(subject.lastKnownPosition)
        IF elevDiff > 0:  // Uphill
            prior *= 0.1  // Heavily penalize uphill for disoriented subjects
        ELSE:
            prior *= 1.0 + (ABS(elevDiff) / 100) * 0.5  // Boost downhill

    RETURN prior

FUNCTION updateProbabilityWithSighting(grid, sighting):
    // Bayesian update: P(location|sighting) ∝ P(sighting|location) × P(location)

    FOR EACH cell IN grid:
        // Likelihood: probability of this sighting given subject is at this cell
        distance = haversineDistance(cell.center, sighting.position)
        likelihood = sightingLikelihood(distance, sighting.confidence, sighting.type)

        // Posterior = Prior × Likelihood
        cell.probability = cell.probability * likelihood

    // Normalize
    total = SUM(cell.probability FOR cell IN grid)
    FOR EACH cell IN grid:
        cell.probability = cell.probability / total

    RETURN grid

FUNCTION sightingLikelihood(distance_m, confidence, sightingType):
    // Higher confidence sightings create sharper probability peaks
    sigma = baseUncertainty(sightingType) / (confidence / 10)
    // Gaussian likelihood centered on sighting location
    RETURN EXP(-(distance_m^2) / (2 * sigma^2))

FUNCTION baseUncertainty(sightingType):
    SWITCH sightingType:
        'visual': RETURN 100      // 100m uncertainty for visual sighting
        'auditory': RETURN 500    // 500m for auditory
        'physical_evidence': RETURN 50   // 50m for physical evidence
        'electronic': RETURN 200  // 200m for electronic signal
        'scent': RETURN 300       // 300m for scent detection
        'footprint': RETURN 25    // 25m for footprint
        DEFAULT: RETURN 500
```

---

## Algorithm 3: Movement Prediction by Subject Type

Movement prediction uses Lost Person Behavior (LPB) statistics from Robert Koester's research, adapted per subject type.

```
FUNCTION predictMovement(subject, timeElapsed_hours, terrain, weather):
    // Get statistical movement profile for subject type
    profile = getMovementProfile(subject)

    // Calculate expected distance traveled
    baseSpeed = profile.typicalSpeed_kmh
    adjustedSpeed = adjustForConditions(baseSpeed, terrain, weather, subject)
    expectedDistance = adjustedSpeed * timeElapsed_hours

    // Generate movement probability distribution
    distribution = {
        p25: expectedDistance * profile.p25_factor,  // 25th percentile
        p50: expectedDistance * profile.p50_factor,  // Median
        p75: expectedDistance * profile.p75_factor,  // 75th percentile
        p95: expectedDistance * profile.p95_factor,  // 95th percentile — outer search limit
    }

    RETURN distribution

FUNCTION getMovementProfile(subject):
    // Based on Koester's Lost Person Behavior data
    SWITCH subject.type + '/' + subject.subtype:
        'human/child':
            IF subject.attributes.age <= 3:
                RETURN { typicalSpeed: 0.5, p25: 0.4, p50: 0.7, p75: 1.2, p95: 2.0 }
            IF subject.attributes.age <= 6:
                RETURN { typicalSpeed: 1.0, p25: 0.5, p50: 1.0, p75: 2.0, p95: 3.5 }
            IF subject.attributes.age <= 12:
                RETURN { typicalSpeed: 2.0, p25: 0.8, p50: 1.5, p75: 3.0, p95: 5.0 }

        'human/hiker':
            IF subject.attributes.experience == 'novice':
                RETURN { typicalSpeed: 2.5, p25: 1.0, p50: 2.5, p75: 5.0, p95: 10.0 }
            IF subject.attributes.experience == 'expert':
                RETURN { typicalSpeed: 4.0, p25: 2.0, p50: 5.0, p75: 10.0, p95: 20.0 }

        'human/elderly':
            RETURN { typicalSpeed: 1.0, p25: 0.3, p50: 0.8, p75: 1.5, p95: 3.0 }

        'human/fugitive':
            RETURN { typicalSpeed: 5.0, p25: 5.0, p50: 15.0, p75: 50.0, p95: 200.0 }

        'animal/dog':
            IF subject.attributes.temperament == 'fearful':
                RETURN { typicalSpeed: 0.5, p25: 0.1, p50: 0.3, p75: 0.8, p95: 2.0 }
            IF subject.attributes.breed IN ['husky','labrador','german_shepherd']:
                RETURN { typicalSpeed: 5.0, p25: 1.0, p50: 3.0, p75: 8.0, p95: 15.0 }
            DEFAULT:
                RETURN { typicalSpeed: 3.0, p25: 0.5, p50: 2.0, p75: 5.0, p95: 10.0 }

        'vehicle/*':
            fuelRange = subject.attributes.range_km OR 500
            RETURN { typicalSpeed: 60, p25: fuelRange*0.1, p50: fuelRange*0.3, p75: fuelRange*0.6, p95: fuelRange }

        DEFAULT:
            RETURN { typicalSpeed: 2.0, p25: 0.5, p50: 1.5, p75: 3.0, p95: 5.0 }

FUNCTION adjustForConditions(baseSpeed, terrain, weather, subject):
    factor = 1.0

    // Terrain adjustment
    avgSlope = terrain.getAverageSlope()
    IF avgSlope > 30: factor *= 0.3
    ELSE IF avgSlope > 20: factor *= 0.5
    ELSE IF avgSlope > 10: factor *= 0.7

    // Vegetation adjustment
    vegDensity = terrain.getAverageVegetation()
    IF vegDensity == 'dense': factor *= 0.4
    ELSE IF vegDensity == 'moderate': factor *= 0.7

    // Weather adjustment
    IF weather.temperature < -20: factor *= 0.3  // Extreme cold
    ELSE IF weather.temperature < -10: factor *= 0.5
    ELSE IF weather.temperature < 0: factor *= 0.7
    IF weather.precipitation > 0: factor *= 0.8
    IF weather.windSpeed > 50: factor *= 0.5  // High wind
    IF weather.visibility < 100: factor *= 0.4  // Poor visibility

    // Snow depth adjustment
    IF weather.snowDepth > 100: factor *= 0.3
    ELSE IF weather.snowDepth > 50: factor *= 0.5
    ELSE IF weather.snowDepth > 20: factor *= 0.7

    // Subject condition adjustment
    IF subject.type == 'human':
        IF subject.attributes.fitness_level == 'poor': factor *= 0.5
        IF subject.attributes.intoxication_level == 'severe': factor *= 0.3
        IF subject.attributes.age > 70: factor *= 0.5
        IF subject.attributes.age < 6: factor *= 0.4

    RETURN baseSpeed * factor
```

---

## Algorithm 4: Terrain & Weather Impact Analysis

```
FUNCTION analyzeTerrainImpact(searchArea, subject):
    // Fetch elevation data for search area
    elevationGrid = fetchElevationData(searchArea.boundary)

    // Calculate slope for each cell
    FOR EACH cell IN elevationGrid:
        cell.slope = calculateSlope(cell, neighbors)
        cell.aspect = calculateAspect(cell, neighbors)  // Direction slope faces

    // Identify terrain traps
    traps = []
    FOR EACH cell IN elevationGrid:
        IF cell.slope > 35 AND hasCliffBelow(cell):
            traps.PUSH({type: 'cliff', location: cell, severity: 'critical'})
        IF isCreekCrossing(cell) AND subject.type == 'human':
            bridgeRisk = calculateSnowBridgeRisk(cell, weather)
            traps.PUSH({type: 'creek_crossing', location: cell, severity: bridgeRisk})
        IF isTreeWell(cell) AND weather.snowDepth > 50:
            traps.PUSH({type: 'tree_well', location: cell, severity: 'high'})
        IF isDrainageConvergence(cell):
            traps.PUSH({type: 'drainage_trap', location: cell, severity: 'high'})

    RETURN { elevationGrid, traps }

FUNCTION calculateSnowBridgeRisk(creekCell, weather):
    // Port of snow_bridge_forensic.py logic
    snowDepth_m = weather.snowDepth / 100
    temp_c = weather.temperature

    // Erosion factor: creek water erodes underside
    erosionFactor = 0.35  // Only 35% structural
    bridgeThickness = snowDepth_m * erosionFactor

    // Tensile strength varies with temperature
    IF temp_c < -25: tensileStrength = 8000   // Brittle, catastrophic failure
    ELSE IF temp_c < -15: tensileStrength = 10000
    ELSE IF temp_c < -5: tensileStrength = 15000
    ELSE: tensileStrength = 12000

    // Beam capacity calculation
    width = 0.5  // Foot contact area
    gapWidth = creekCell.estimatedGap OR 1.5  // meters
    maxLoad = (4 * tensileStrength * width * bridgeThickness^2) / (gapWidth * 9.81)
    effectiveCapacity = maxLoad / 1.5  // Dynamic factor

    IF effectiveCapacity < 85: RETURN 'critical'  // Will collapse
    IF effectiveCapacity < 120: RETURN 'high'      // Marginal
    RETURN 'moderate'
```

---

## Algorithm 5: Path of Least Resistance (Downhill Drift Model)

Used for disoriented subjects in mountainous terrain — models gravity-driven movement along drainage vectors.

```
FUNCTION calculatePathOfLeastResistance(startPoint, elevationGrid, maxDistance):
    paths = []
    currentPoints = [startPoint]

    FOR step = 0 TO maxDistance / stepSize:
        nextPoints = []
        FOR EACH point IN currentPoints:
            // Find steepest downhill direction from current point
            neighbors = getNeighborCells(point, elevationGrid)
            downhillNeighbors = FILTER neighbors WHERE elevation < point.elevation

            IF downhillNeighbors.length == 0:
                // Reached a local minimum — terrain trap
                paths.PUSH({endpoint: point, type: 'terrain_trap', step: step})
                CONTINUE

            // Weight neighbors by slope steepness (steeper = more likely path)
            FOR EACH neighbor IN downhillNeighbors:
                slopeWeight = (point.elevation - neighbor.elevation) / cellSize
                neighbor.weight = slopeWeight

            // Select top 3 most likely paths (branching)
            topPaths = TOP_N(downhillNeighbors, 3, BY weight)
            nextPoints.APPEND(topPaths)

        currentPoints = nextPoints

    RETURN paths  // Array of probable endpoints (terrain traps, drainage convergences)
```

---

## Algorithm 6: Maximum Travel Radius by Conditions

```
FUNCTION calculateMaxTravelRadius(subject, conditions):
    // Base maximum distance from Lost Person Behavior statistics
    profile = getMovementProfile(subject)
    baseMax = profile.p95  // 95th percentile as outer limit

    // Time-based scaling
    hoursElapsed = (NOW - subject.lastSeenAt) / 3600
    IF hoursElapsed > 72: timeFactor = 1.0  // Capped at 72 hours
    ELSE: timeFactor = hoursElapsed / 24  // Scale up over first 24 hours

    // Survival time limit for extreme conditions
    IF conditions.temperature < -20 AND subject.attributes.clothing != 'winter_gear':
        survivalHours = calculateHypothermiaOnset(conditions.temperature, conditions.windSpeed)
        timeFactor = MIN(timeFactor, survivalHours / 24)

    // Vehicle access multiplier
    IF subject.type == 'vehicle' OR subject.attributes.has_vehicle:
        vehicleRange = subject.attributes.range_km OR 500
        baseMax = MAX(baseMax, vehicleRange)

    maxRadius = baseMax * timeFactor
    RETURN maxRadius
```
