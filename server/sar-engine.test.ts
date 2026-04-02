import { describe, expect, it } from "vitest";
import {
  computeConvexHull,
  getMovementProfile,
  analyzeSnowBridge,
  haversineDistance,
  type SubjectProfile,
  type GeoPoint,
} from "./algorithms/sar-engine";

describe("SAR Engine — Haversine Distance", () => {
  it("calculates distance between two known points", () => {
    // Sun Peaks Resort to Kamloops (~55 km)
    const d = haversineDistance(
      { lat: 50.8833, lng: -119.9167 },
      { lat: 50.6745, lng: -120.3273 }
    );
    expect(d).toBeGreaterThan(25);
    expect(d).toBeLessThan(60);
  });

  it("returns 0 for same point", () => {
    const d = haversineDistance(
      { lat: 51.0, lng: -119.0 },
      { lat: 51.0, lng: -119.0 }
    );
    expect(d).toBe(0);
  });
});

describe("SAR Engine — Convex Hull", () => {
  it("computes hull for 3 non-collinear points", () => {
    const points: GeoPoint[] = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 0, lng: 1 },
    ];
    const hull = computeConvexHull(points);
    expect(hull.length).toBe(3);
  });

  it("computes hull for 4 points with one interior", () => {
    const points: GeoPoint[] = [
      { lat: 0, lng: 0 },
      { lat: 2, lng: 0 },
      { lat: 2, lng: 2 },
      { lat: 0, lng: 2 },
      { lat: 1, lng: 1 }, // interior point
    ];
    const hull = computeConvexHull(points);
    expect(hull.length).toBe(4); // only corners
  });

  it("returns empty for fewer than 3 points", () => {
    const hull = computeConvexHull([{ lat: 0, lng: 0 }]);
    expect(hull.length).toBeLessThanOrEqual(1);
  });
});

describe("SAR Engine — Movement Profile", () => {
  it("returns hiker profile for human/hiker", () => {
    const profile: SubjectProfile = { type: "human", subtype: "hiker" };
    const mp = getMovementProfile(profile);
    expect(mp.typicalSpeed_kmh).toBeGreaterThan(0);
    expect(mp.p50_km).toBeGreaterThan(0);
    expect(mp.p95_km).toBeGreaterThan(mp.p50_km);
  });

  it("returns child profile for human/child", () => {
    const profile: SubjectProfile = { type: "human", subtype: "child" };
    const mp = getMovementProfile(profile);
    expect(mp.p50_km).toBeLessThan(5); // children travel less
  });

  it("returns dog profile for animal/dog", () => {
    const profile: SubjectProfile = { type: "animal", subtype: "dog" };
    const mp = getMovementProfile(profile);
    expect(mp.typicalSpeed_kmh).toBeGreaterThan(0);
    expect(mp.p50_km).toBeGreaterThan(0);
  });

  it("returns vehicle profile for vehicle type", () => {
    const profile: SubjectProfile = { type: "vehicle", subtype: "car" };
    const mp = getMovementProfile(profile);
    expect(mp.p50_km).toBeGreaterThan(20); // vehicles travel far
  });

  it("adjusts for age in human profiles", () => {
    const young: SubjectProfile = { type: "human", subtype: "hiker", attributes: { age: 25 } };
    const old: SubjectProfile = { type: "human", subtype: "hiker", attributes: { age: 75 } };
    const mpYoung = getMovementProfile(young);
    const mpOld = getMovementProfile(old);
    expect(mpYoung.p50_km).toBeGreaterThanOrEqual(mpOld.p50_km);
  });
});

describe("SAR Engine — Snow Bridge Analysis", () => {
  it("analyzes a thick bridge in cold conditions as safe", () => {
    const result = analyzeSnowBridge(3.0, -15, 1.0, 80);
    expect(result.riskLevel).toBe("low");
    expect(result.willCollapse).toBe(false);
    expect(result.safetyFactor).toBeGreaterThan(1);
  });

  it("analyzes a thin bridge in warm conditions as dangerous", () => {
    const result = analyzeSnowBridge(0.3, 2, 3.0, 85);
    expect(result.riskLevel).toBe("critical");
    expect(result.willCollapse).toBe(true);
    expect(result.safetyFactor).toBeLessThan(1);
  });

  it("returns correct structure", () => {
    const result = analyzeSnowBridge(1.5, -5, 1.5, 85);
    expect(result).toHaveProperty("bridgeThickness_m");
    expect(result).toHaveProperty("tensileStrength_Pa");
    expect(result).toHaveProperty("maxLoad_kg");
    expect(result).toHaveProperty("effectiveCapacity_kg");
    expect(result).toHaveProperty("riskLevel");
    expect(result).toHaveProperty("willCollapse");
    expect(result).toHaveProperty("safetyFactor");
    expect(result).toHaveProperty("details");
  });

  it("handles extreme cold correctly", () => {
    const result = analyzeSnowBridge(2.0, -30, 1.5, 80);
    // At extreme cold, snow is brittle but still has structure
    expect(result.tensileStrength_Pa).toBe(8000);
  });
});
