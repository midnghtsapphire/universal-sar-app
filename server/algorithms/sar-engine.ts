/**
 * Universal SAR Algorithm Engine
 * Implements: Convex Hull, Bayesian Probability Mapping, Movement Prediction,
 * Terrain/Weather Impact, Lost Person Behavior Statistics (Koester data),
 * Snow Bridge Physics (ported from forensic Python code).
 *
 * All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.
 */

// ─── Types ──────────────────────────────────────────────
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SubjectProfile {
  type: 'human' | 'animal' | 'vehicle' | 'object';
  subtype?: string;
  attributes?: Record<string, any>;
}

export interface WeatherConditions {
  temperature_c: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  precipitation_mm: number;
  snow_depth_cm: number;
  visibility_m: number;
  humidity_pct: number;
}

export interface TerrainData {
  avg_slope_deg: number;
  max_slope_deg: number;
  vegetation_density: 'none' | 'sparse' | 'moderate' | 'dense';
  water_features: GeoPoint[];
  elevation_range_m: [number, number];
}

export interface MovementProfile {
  typicalSpeed_kmh: number;
  p25_km: number;
  p50_km: number;
  p75_km: number;
  p95_km: number;
}

export interface ProbabilityZoneResult {
  zoneName: string;
  zoneType: 'primary' | 'secondary' | 'tertiary';
  probability: number;
  geoJson: any;
  centerLat: number;
  centerLng: number;
  areaKm2: number;
  algorithm: string;
  confidence: number;
}

export interface SightingInput {
  lat: number;
  lng: number;
  confidence: number; // 1-10
  sightingType: string;
  sightedAt: Date;
}

// ─── Constants ──────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// ─── Geo Utilities ──────────────────────────────────────
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * DEG_TO_RAD) * Math.cos(b.lat * DEG_TO_RAD) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function offsetPoint(origin: GeoPoint, distanceKm: number, bearingDeg: number): GeoPoint {
  const d = distanceKm / EARTH_RADIUS_KM;
  const brng = bearingDeg * DEG_TO_RAD;
  const lat1 = origin.lat * DEG_TO_RAD;
  const lng1 = origin.lng * DEG_TO_RAD;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
  const lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: lat2 * RAD_TO_DEG, lng: lng2 * RAD_TO_DEG };
}

function polygonArea(points: GeoPoint[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const xi = points[i].lng * DEG_TO_RAD * EARTH_RADIUS_KM * Math.cos(points[i].lat * DEG_TO_RAD);
    const yi = points[i].lat * DEG_TO_RAD * EARTH_RADIUS_KM;
    const xj = points[j].lng * DEG_TO_RAD * EARTH_RADIUS_KM * Math.cos(points[j].lat * DEG_TO_RAD);
    const yj = points[j].lat * DEG_TO_RAD * EARTH_RADIUS_KM;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area) / 2;
}

function centroid(points: GeoPoint[]): GeoPoint {
  const n = points.length;
  if (n === 0) return { lat: 0, lng: 0 };
  const sumLat = points.reduce((s, p) => s + p.lat, 0);
  const sumLng = points.reduce((s, p) => s + p.lng, 0);
  return { lat: sumLat / n, lng: sumLng / n };
}

// ─── Algorithm 1: Convex Hull (Graham Scan) ─────────────
export function computeConvexHull(points: GeoPoint[]): GeoPoint[] {
  if (points.length < 3) return [...points];

  // Find the lowest point (min lat, then min lng)
  let anchor = points[0];
  for (const p of points) {
    if (p.lat < anchor.lat || (p.lat === anchor.lat && p.lng < anchor.lng)) {
      anchor = p;
    }
  }

  // Sort by polar angle relative to anchor
  const sorted = points
    .filter(p => p !== anchor)
    .sort((a, b) => {
      const angleA = Math.atan2(a.lat - anchor.lat, a.lng - anchor.lng);
      const angleB = Math.atan2(b.lat - anchor.lat, b.lng - anchor.lng);
      if (Math.abs(angleA - angleB) < 1e-10) {
        return haversineDistance(anchor, a) - haversineDistance(anchor, b);
      }
      return angleA - angleB;
    });

  const stack: GeoPoint[] = [anchor];
  for (const p of sorted) {
    while (stack.length > 1) {
      const top = stack[stack.length - 1];
      const below = stack[stack.length - 2];
      const cross = (top.lng - below.lng) * (p.lat - below.lat) - (top.lat - below.lat) * (p.lng - below.lng);
      if (cross <= 0) stack.pop();
      else break;
    }
    stack.push(p);
  }

  return stack;
}

export function generateSearchBoundary(
  anchorPoints: GeoPoint[],
  maxRadiusKm: number
): GeoPoint[] {
  const bufferedPoints: GeoPoint[] = [...anchorPoints];
  for (const anchor of anchorPoints) {
    for (let angle = 0; angle < 360; angle += 15) {
      bufferedPoints.push(offsetPoint(anchor, maxRadiusKm, angle));
    }
  }
  return computeConvexHull(bufferedPoints);
}

export function hullToGeoJson(hull: GeoPoint[]): any {
  const coords = hull.map(p => [p.lng, p.lat]);
  if (coords.length > 0) coords.push(coords[0]); // Close the polygon
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

// ─── Algorithm 2: Lost Person Behavior (Koester Data) ───
export function getMovementProfile(subject: SubjectProfile): MovementProfile {
  const attrs = subject.attributes || {};
  const key = `${subject.type}/${subject.subtype || 'default'}`;

  switch (key) {
    // Children by age
    case 'human/child':
      if (attrs.age && attrs.age <= 3) return { typicalSpeed_kmh: 0.5, p25_km: 0.2, p50_km: 0.4, p75_km: 0.8, p95_km: 1.6 };
      if (attrs.age && attrs.age <= 6) return { typicalSpeed_kmh: 1.0, p25_km: 0.4, p50_km: 0.9, p75_km: 1.8, p95_km: 3.2 };
      if (attrs.age && attrs.age <= 12) return { typicalSpeed_kmh: 2.0, p25_km: 0.6, p50_km: 1.4, p75_km: 2.8, p95_km: 5.0 };
      return { typicalSpeed_kmh: 2.5, p25_km: 0.8, p50_km: 2.0, p75_km: 4.0, p95_km: 7.0 };

    case 'human/hiker':
      if (attrs.experience_level === 'expert') return { typicalSpeed_kmh: 4.0, p25_km: 2.0, p50_km: 5.0, p75_km: 10.0, p95_km: 20.0 };
      if (attrs.experience_level === 'intermediate') return { typicalSpeed_kmh: 3.0, p25_km: 1.5, p50_km: 3.5, p75_km: 7.0, p95_km: 14.0 };
      return { typicalSpeed_kmh: 2.5, p25_km: 1.0, p50_km: 2.5, p75_km: 5.0, p95_km: 10.0 }; // novice

    case 'human/elderly':
      return { typicalSpeed_kmh: 1.0, p25_km: 0.2, p50_km: 0.6, p75_km: 1.2, p95_km: 2.5 };

    case 'human/fugitive':
      return { typicalSpeed_kmh: 5.0, p25_km: 5.0, p50_km: 15.0, p75_km: 50.0, p95_km: 200.0 };

    case 'human/despondent':
      return { typicalSpeed_kmh: 1.5, p25_km: 0.1, p50_km: 0.5, p75_km: 1.5, p95_km: 4.0 };

    case 'human/alzheimers':
      return { typicalSpeed_kmh: 1.2, p25_km: 0.3, p50_km: 0.8, p75_km: 2.0, p95_km: 5.0 };

    case 'human/autistic':
      return { typicalSpeed_kmh: 2.0, p25_km: 0.3, p50_km: 1.0, p75_km: 2.5, p95_km: 6.0 };

    case 'human/hunter':
      return { typicalSpeed_kmh: 3.0, p25_km: 1.0, p50_km: 3.0, p75_km: 6.0, p95_km: 12.0 };

    case 'human/snowboarder':
    case 'human/skier':
      return { typicalSpeed_kmh: 3.5, p25_km: 0.5, p50_km: 1.5, p75_km: 3.0, p95_km: 8.0 };

    // Animals
    case 'animal/dog':
      if (attrs.temperament === 'fearful') return { typicalSpeed_kmh: 0.5, p25_km: 0.1, p50_km: 0.3, p75_km: 0.8, p95_km: 2.0 };
      if (attrs.training_level === 'advanced' || attrs.training_level === 'service')
        return { typicalSpeed_kmh: 2.0, p25_km: 0.3, p50_km: 1.0, p75_km: 2.5, p95_km: 5.0 };
      return { typicalSpeed_kmh: 3.0, p25_km: 0.5, p50_km: 2.0, p75_km: 5.0, p95_km: 10.0 };

    case 'animal/cat':
      return { typicalSpeed_kmh: 0.5, p25_km: 0.05, p50_km: 0.15, p75_km: 0.5, p95_km: 1.5 };

    case 'animal/horse':
      return { typicalSpeed_kmh: 6.0, p25_km: 2.0, p50_km: 5.0, p75_km: 15.0, p95_km: 40.0 };

    // Vehicles
    case 'vehicle/car':
    case 'vehicle/truck':
      const range = attrs.range_km || 500;
      return { typicalSpeed_kmh: 60, p25_km: range * 0.1, p50_km: range * 0.3, p75_km: range * 0.6, p95_km: range };

    case 'vehicle/boat':
      return { typicalSpeed_kmh: 15, p25_km: 5, p50_km: 20, p75_km: 50, p95_km: 150 };

    // Objects (don't move on their own)
    case 'object/default':
      return { typicalSpeed_kmh: 0, p25_km: 0, p50_km: 0, p75_km: 0.01, p95_km: 0.05 };

    default:
      return { typicalSpeed_kmh: 2.0, p25_km: 0.5, p50_km: 1.5, p75_km: 3.0, p95_km: 6.0 };
  }
}

// ─── Algorithm 3: Condition Adjustments ─────────────────
export function adjustSpeedForConditions(
  baseSpeed: number,
  weather: Partial<WeatherConditions>,
  terrain: Partial<TerrainData>,
  subject: SubjectProfile
): number {
  let factor = 1.0;

  // Terrain
  const slope = terrain.avg_slope_deg ?? 0;
  if (slope > 30) factor *= 0.3;
  else if (slope > 20) factor *= 0.5;
  else if (slope > 10) factor *= 0.7;

  const veg = terrain.vegetation_density ?? 'none';
  if (veg === 'dense') factor *= 0.4;
  else if (veg === 'moderate') factor *= 0.7;
  else if (veg === 'sparse') factor *= 0.9;

  // Weather
  const temp = weather.temperature_c ?? 15;
  if (temp < -20) factor *= 0.3;
  else if (temp < -10) factor *= 0.5;
  else if (temp < 0) factor *= 0.7;
  else if (temp > 40) factor *= 0.5;

  if ((weather.precipitation_mm ?? 0) > 0) factor *= 0.8;
  if ((weather.wind_speed_kmh ?? 0) > 50) factor *= 0.5;
  if ((weather.visibility_m ?? 10000) < 100) factor *= 0.4;

  const snow = weather.snow_depth_cm ?? 0;
  if (snow > 100) factor *= 0.3;
  else if (snow > 50) factor *= 0.5;
  else if (snow > 20) factor *= 0.7;

  // Subject condition
  const attrs = subject.attributes || {};
  if (subject.type === 'human') {
    if (attrs.fitness_level === 'poor') factor *= 0.5;
    if (attrs.intoxication_level === 'severe') factor *= 0.3;
    else if (attrs.intoxication_level === 'moderate') factor *= 0.5;
    if (attrs.age && attrs.age > 70) factor *= 0.5;
    if (attrs.age && attrs.age < 6) factor *= 0.4;
  }

  return baseSpeed * Math.max(factor, 0.05); // Floor at 5% of base
}

// ─── Algorithm 4: Maximum Travel Radius ─────────────────
export function calculateMaxTravelRadius(
  subject: SubjectProfile,
  hoursElapsed: number,
  weather: Partial<WeatherConditions>,
  terrain: Partial<TerrainData>
): number {
  const profile = getMovementProfile(subject);
  const adjustedSpeed = adjustSpeedForConditions(profile.typicalSpeed_kmh, weather, terrain, subject);

  // Time factor: scale up over first 72 hours then cap
  const cappedHours = Math.min(hoursElapsed, 72);
  const timeFactor = Math.min(cappedHours / 24, 1.0);

  // Base max from 95th percentile scaled by time
  let maxRadius = profile.p95_km * timeFactor;

  // Also consider speed-based distance
  const speedBasedMax = adjustedSpeed * cappedHours;
  maxRadius = Math.max(maxRadius, speedBasedMax * 0.5); // Use 50% of theoretical max

  // Vehicle override
  if (subject.type === 'vehicle') {
    const range = subject.attributes?.range_km || 500;
    maxRadius = Math.max(maxRadius, range);
  }

  return Math.max(maxRadius, 0.1); // Minimum 100m
}

// ─── Algorithm 5: Bayesian Probability Zones ────────────
export function generateProbabilityZones(
  lastKnown: GeoPoint,
  subject: SubjectProfile,
  hoursElapsed: number,
  weather: Partial<WeatherConditions>,
  terrain: Partial<TerrainData>,
  existingSightings: SightingInput[] = []
): ProbabilityZoneResult[] {
  const profile = getMovementProfile(subject);
  const maxRadius = calculateMaxTravelRadius(subject, hoursElapsed, weather, terrain);

  // Generate three concentric probability zones
  const zones: ProbabilityZoneResult[] = [];

  // Primary zone: 25th percentile distance — highest probability
  const p25Radius = Math.max(profile.p25_km * Math.min(hoursElapsed / 24, 1), 0.05);
  const primaryHull = generateSearchBoundary([lastKnown], p25Radius);
  const primaryCenter = centroid(primaryHull);
  zones.push({
    zoneName: "Primary Search Zone (25th percentile)",
    zoneType: "primary",
    probability: 0.50,
    geoJson: hullToGeoJson(primaryHull),
    centerLat: primaryCenter.lat,
    centerLng: primaryCenter.lng,
    areaKm2: polygonArea(primaryHull),
    algorithm: "bayesian_koester_lpb",
    confidence: 0.75,
  });

  // Secondary zone: 50th–75th percentile
  const p75Radius = Math.max(profile.p75_km * Math.min(hoursElapsed / 24, 1), 0.1);
  const secondaryHull = generateSearchBoundary([lastKnown], p75Radius);
  const secondaryCenter = centroid(secondaryHull);
  zones.push({
    zoneName: "Secondary Search Zone (75th percentile)",
    zoneType: "secondary",
    probability: 0.35,
    geoJson: hullToGeoJson(secondaryHull),
    centerLat: secondaryCenter.lat,
    centerLng: secondaryCenter.lng,
    areaKm2: polygonArea(secondaryHull),
    algorithm: "bayesian_koester_lpb",
    confidence: 0.60,
  });

  // Tertiary zone: 95th percentile — outer boundary
  const tertiaryHull = generateSearchBoundary([lastKnown], maxRadius);
  const tertiaryCenter = centroid(tertiaryHull);
  zones.push({
    zoneName: "Tertiary Search Zone (95th percentile)",
    zoneType: "tertiary",
    probability: 0.15,
    geoJson: hullToGeoJson(tertiaryHull),
    centerLat: tertiaryCenter.lat,
    centerLng: tertiaryCenter.lng,
    areaKm2: polygonArea(tertiaryHull),
    algorithm: "bayesian_koester_lpb",
    confidence: 0.40,
  });

  // Apply Bayesian updates from sightings
  if (existingSightings.length > 0) {
    return applyBayesianUpdates(zones, lastKnown, existingSightings);
  }

  return zones;
}

// ─── Algorithm 6: Bayesian Update from Sightings ────────
function sightingBaseUncertaintyKm(type: string): number {
  switch (type) {
    case 'visual': return 0.1;
    case 'auditory': return 0.5;
    case 'physical_evidence': return 0.05;
    case 'electronic': return 0.2;
    case 'scent': return 0.3;
    case 'footprint': return 0.025;
    default: return 0.5;
  }
}

function gaussianLikelihood(distanceKm: number, sigmaKm: number): number {
  return Math.exp(-(distanceKm * distanceKm) / (2 * sigmaKm * sigmaKm));
}

export function applyBayesianUpdates(
  zones: ProbabilityZoneResult[],
  lastKnown: GeoPoint,
  sightings: SightingInput[]
): ProbabilityZoneResult[] {
  const updated = zones.map(z => ({ ...z }));

  for (const sighting of sightings) {
    const sightingPoint: GeoPoint = { lat: sighting.lat, lng: sighting.lng };
    const sigma = sightingBaseUncertaintyKm(sighting.sightingType) / (sighting.confidence / 10);

    let totalLikelihood = 0;
    const likelihoods: number[] = [];

    for (const zone of updated) {
      const zoneCenter: GeoPoint = { lat: zone.centerLat, lng: zone.centerLng };
      const dist = haversineDistance(sightingPoint, zoneCenter);
      const likelihood = gaussianLikelihood(dist, sigma);
      likelihoods.push(likelihood);
      totalLikelihood += likelihood * zone.probability;
    }

    // Update probabilities using Bayes' theorem
    if (totalLikelihood > 0) {
      for (let i = 0; i < updated.length; i++) {
        updated[i].probability = (updated[i].probability * likelihoods[i]) / totalLikelihood;
      }
    }

    // Normalize
    const total = updated.reduce((s, z) => s + z.probability, 0);
    if (total > 0) {
      for (const zone of updated) {
        zone.probability = zone.probability / total;
      }
    }
  }

  return updated;
}

// ─── Algorithm 7: Snow Bridge Physics ───────────────────
// Ported from snow_bridge_forensic.py (Sun Peaks Feb 2018 case)
export interface SnowBridgeAnalysis {
  bridgeThickness_m: number;
  tensileStrength_Pa: number;
  maxLoad_kg: number;
  effectiveCapacity_kg: number;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  willCollapse: boolean;
  safetyFactor: number;
  details: string;
}

export function analyzeSnowBridge(
  snowDepth_m: number,
  temperature_c: number,
  gapWidth_m: number = 1.5,
  subjectWeight_kg: number = 85,
  footContactWidth_m: number = 0.5
): SnowBridgeAnalysis {
  // Erosion factor: creek water erodes underside of snow bridge
  const erosionFactor = 0.35; // Only 35% structural integrity
  const bridgeThickness = snowDepth_m * erosionFactor;

  // Tensile strength varies with temperature (Pa)
  let tensileStrength: number;
  if (temperature_c < -25) tensileStrength = 8000;     // Brittle, catastrophic failure
  else if (temperature_c < -15) tensileStrength = 10000;
  else if (temperature_c < -5) tensileStrength = 15000;  // Optimal
  else if (temperature_c < 0) tensileStrength = 12000;
  else tensileStrength = 8000; // Above freezing — weakened

  // Beam capacity calculation (simple beam model)
  const maxLoad = (4 * tensileStrength * footContactWidth_m * bridgeThickness * bridgeThickness) /
    (gapWidth_m * 9.81);

  // Dynamic impact factor (walking/stepping = 1.5x static load)
  const dynamicFactor = 1.5;
  const effectiveCapacity = maxLoad / dynamicFactor;

  const safetyFactor = effectiveCapacity / subjectWeight_kg;

  let riskLevel: SnowBridgeAnalysis['riskLevel'];
  let willCollapse: boolean;
  if (effectiveCapacity < subjectWeight_kg * 0.8) {
    riskLevel = 'critical';
    willCollapse = true;
  } else if (effectiveCapacity < subjectWeight_kg * 1.2) {
    riskLevel = 'high';
    willCollapse = true; // Marginal — likely fails
  } else if (effectiveCapacity < subjectWeight_kg * 2.0) {
    riskLevel = 'moderate';
    willCollapse = false;
  } else {
    riskLevel = 'low';
    willCollapse = false;
  }

  const details = [
    `Snow depth: ${snowDepth_m.toFixed(2)}m`,
    `Effective bridge thickness (after erosion): ${bridgeThickness.toFixed(2)}m`,
    `Temperature: ${temperature_c}°C → Tensile strength: ${tensileStrength} Pa`,
    `Gap width: ${gapWidth_m}m`,
    `Max static load: ${maxLoad.toFixed(1)} kg`,
    `Effective capacity (with dynamic factor): ${effectiveCapacity.toFixed(1)} kg`,
    `Subject weight: ${subjectWeight_kg} kg`,
    `Safety factor: ${safetyFactor.toFixed(2)}`,
    `Risk level: ${riskLevel.toUpperCase()}`,
    willCollapse ? "BRIDGE WILL COLLAPSE" : "Bridge should hold",
  ].join('\n');

  return {
    bridgeThickness_m: bridgeThickness,
    tensileStrength_Pa: tensileStrength,
    maxLoad_kg: maxLoad,
    effectiveCapacity_kg: effectiveCapacity,
    riskLevel,
    willCollapse,
    safetyFactor,
    details,
  };
}

// ─── Algorithm 8: Weather Fetch (Open-Meteo) ────────────
export async function fetchWeather(lat: number, lng: number): Promise<WeatherConditions> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,snow_depth&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();
    const c = data.current;
    return {
      temperature_c: c.temperature_2m ?? 15,
      wind_speed_kmh: c.wind_speed_10m ?? 0,
      wind_direction_deg: c.wind_direction_10m ?? 0,
      precipitation_mm: c.precipitation ?? 0,
      snow_depth_cm: (c.snow_depth ?? 0) * 100, // API returns meters
      visibility_m: 10000, // Open-Meteo doesn't provide visibility in free tier
      humidity_pct: c.relative_humidity_2m ?? 50,
    };
  } catch (err) {
    console.warn("[SAR Engine] Weather fetch failed, using defaults:", err);
    return {
      temperature_c: 15, wind_speed_kmh: 10, wind_direction_deg: 0,
      precipitation_mm: 0, snow_depth_cm: 0, visibility_m: 10000, humidity_pct: 50,
    };
  }
}

// ─── Algorithm 9: Elevation Fetch (Open-Meteo) ─────────
export async function fetchElevation(lat: number, lng: number): Promise<number> {
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Elevation API returned ${res.status}`);
    const data = await res.json();
    return data.elevation?.[0] ?? 0;
  } catch (err) {
    console.warn("[SAR Engine] Elevation fetch failed:", err);
    return 0;
  }
}

// ─── Master Orchestrator ────────────────────────────────
export async function runSARAnalysis(
  lastKnown: GeoPoint,
  subject: SubjectProfile,
  lastSeenAt: Date,
  sightingsList: SightingInput[] = []
): Promise<{
  zones: ProbabilityZoneResult[];
  boundary: GeoPoint[];
  boundaryGeoJson: any;
  maxRadiusKm: number;
  movementProfile: MovementProfile;
  weather: WeatherConditions;
  elevation: number;
}> {
  // Fetch real environmental data
  const [weather, elevation] = await Promise.all([
    fetchWeather(lastKnown.lat, lastKnown.lng),
    fetchElevation(lastKnown.lat, lastKnown.lng),
  ]);

  const terrain: Partial<TerrainData> = {
    avg_slope_deg: 10, // Default moderate slope
    vegetation_density: 'moderate',
    water_features: [],
    elevation_range_m: [elevation - 200, elevation + 200],
  };

  const hoursElapsed = (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60);
  const movementProfile = getMovementProfile(subject);
  const maxRadiusKm = calculateMaxTravelRadius(subject, hoursElapsed, weather, terrain);

  // Generate search boundary (convex hull)
  const boundary = generateSearchBoundary([lastKnown], maxRadiusKm);
  const boundaryGeoJson = hullToGeoJson(boundary);

  // Generate probability zones with Bayesian updates
  const zones = generateProbabilityZones(lastKnown, subject, hoursElapsed, weather, terrain, sightingsList);

  return { zones, boundary, boundaryGeoJson, maxRadiusKm, movementProfile, weather, elevation };
}
