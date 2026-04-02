import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database module to avoid real DB calls in tests
vi.mock("./db", () => ({
  createSubject: vi.fn().mockResolvedValue({ id: 1 }),
  getSubjectById: vi.fn().mockResolvedValue({
    id: 1,
    subjectType: "human",
    subjectSubtype: "hiker",
    name: "Test Subject",
    status: "missing",
  }),
  listSubjects: vi.fn().mockResolvedValue([]),
  getSubjectsByOperation: vi.fn().mockResolvedValue([]),
  createOperation: vi.fn().mockResolvedValue({ id: 1 }),
  getOperationById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Op",
    status: "active",
    priority: "high",
    environment: "wilderness",
    centerLat: "50.88",
    centerLng: "-119.92",
    radiusKm: "10",
  }),
  listOperations: vi.fn().mockResolvedValue([]),
  updateOperation: vi.fn().mockResolvedValue(undefined),
  createSighting: vi.fn().mockResolvedValue({ id: 1 }),
  getSightingsByOperation: vi.fn().mockResolvedValue([]),
  createTeam: vi.fn().mockResolvedValue({ id: 1 }),
  listTeams: vi.fn().mockResolvedValue([]),
  getTeamsByOperation: vi.fn().mockResolvedValue([]),
  updateTeam: vi.fn().mockResolvedValue(undefined),
  createEvidence: vi.fn().mockResolvedValue({ id: 1 }),
  getEvidenceByOperation: vi.fn().mockResolvedValue([]),
  createTimelineEvent: vi.fn().mockResolvedValue({ id: 1 }),
  getTimelineByOperation: vi.fn().mockResolvedValue([]),
  createProbabilityZone: vi.fn().mockResolvedValue({ id: 1 }),
  getZonesByOperation: vi.fn().mockResolvedValue([]),
  deleteZonesByOperation: vi.fn().mockResolvedValue(undefined),
  getOperationStats: vi.fn().mockResolvedValue({
    totalOperations: 5,
    activeSearches: 2,
    totalSubjects: 10,
    totalTeams: 3,
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Happy Path Tests ────────────────────────────────────

describe("API — Subjects", () => {
  it("creates a subject (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subjects.create({
      subjectType: "human",
      subjectSubtype: "hiker",
      name: "John Doe",
      description: "Lost hiker in Sun Peaks area",
      circumstances: "Went hiking alone, did not return",
    });
    expect(result).toHaveProperty("id");
  });

  it("gets a subject by id (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subjects.getById({ id: 1 });
    expect(result).toHaveProperty("name", "Test Subject");
    expect(result).toHaveProperty("subjectType", "human");
  });

  it("lists subjects (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subjects.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("API — Operations", () => {
  it("creates an operation (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.operations.create({
      name: "Sun Peaks SAR",
      priority: "critical",
      environment: "wilderness",
      centerLat: "50.8833",
      centerLng: "-119.9167",
      radiusKm: "15",
    });
    expect(result).toHaveProperty("id");
  });

  it("gets an operation by id (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.operations.getById({ id: 1 });
    expect(result).toHaveProperty("name", "Test Op");
    expect(result).toHaveProperty("status", "active");
  });

  it("lists operations (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.operations.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("API — Sightings", () => {
  it("creates a sighting (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sightings.create({
      operationId: 1,
      lat: "50.89",
      lng: "-119.91",
      sightedAt: new Date(),
      sightingType: "visual",
      confidence: 7,
      description: "Saw figure on trail",
      reporterName: "Ranger Smith",
    });
    expect(result).toHaveProperty("id");
  });

  it("lists sightings by operation (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sightings.getByOperation({ operationId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("API — Teams", () => {
  it("creates a team (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.teams.create({
      name: "Alpha Team",
      teamType: "ground",
      memberCount: 6,
      capabilities: "Wilderness SAR certified",
      contactInfo: "radio ch 5",
    });
    expect(result).toHaveProperty("id");
  });

  it("lists teams (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.teams.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("API — Evidence", () => {
  it("creates evidence (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evidence.create({
      operationId: 1,
      title: "Footprint found",
      evidenceType: "physical",
      description: "Boot print matching subject's size",
      lat: "50.885",
      lng: "-119.918",
      collectedBy: "CSI Team",
    });
    expect(result).toHaveProperty("id");
  });
});

describe("API — Analytics", () => {
  it("returns stats (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.stats();
    expect(result).toHaveProperty("totalOperations");
    expect(result).toHaveProperty("activeSearches");
  });

  it("returns movement profile (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.movementProfile({
      subjectType: "human",
      subjectSubtype: "hiker",
    });
    expect(result).toHaveProperty("typicalSpeed_kmh");
    expect(result).toHaveProperty("p50_km");
    expect(result).toHaveProperty("p95_km");
  });

  it("returns snow bridge analysis (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.snowBridge({
      snowDepth_m: 1.5,
      temperature_c: -5,
    });
    expect(result).toHaveProperty("safetyFactor");
    expect(result).toHaveProperty("riskLevel");
    expect(result).toHaveProperty("willCollapse");
  });
});

// ─── Negative Path / Edge Case Tests ─────────────────────

describe("API — Input Validation (Negative Paths)", () => {
  it("rejects subject creation without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subjects.create({
        subjectType: "human",
        subjectSubtype: "hiker",
        name: "Unauthorized Subject",
      })
    ).rejects.toThrow();
  });

  it("rejects operation creation without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.operations.create({
        name: "Unauthorized Op",
        priority: "medium",
        environment: "wilderness",
        centerLat: "50.88",
        centerLng: "-119.92",
        radiusKm: "10",
      })
    ).rejects.toThrow();
  });

  it("rejects sighting creation without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.sightings.create({
        operationId: 1,
        lat: "50.89",
        lng: "-119.91",
        sightedAt: new Date(),
        sightingType: "visual",
        confidence: 5,
      })
    ).rejects.toThrow();
  });

  it("rejects team creation without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.teams.create({
        name: "Unauthorized Team",
        teamType: "ground",
        memberCount: 4,
      })
    ).rejects.toThrow();
  });

  it("rejects evidence creation without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evidence.create({
        operationId: 1,
        title: "Unauthorized Evidence",
        evidenceType: "physical",
      })
    ).rejects.toThrow();
  });
});

describe("API — Edge Cases", () => {
  it("creates operation with minimal fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.operations.create({
      name: "Minimal Op",
      priority: "low",
      environment: "urban",
      centerLat: "0",
      centerLng: "0",
      radiusKm: "1",
    });
    expect(result).toHaveProperty("id");
  });

  it("creates subject with all optional fields empty", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subjects.create({
      subjectType: "animal",
      subjectSubtype: "dog",
      name: "Missing Dog",
    });
    expect(result).toHaveProperty("id");
  });

  it("creates operation with subject and all optional fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.operations.create({
      name: "Full Detail Op",
      priority: "critical",
      environment: "mountain",
      centerLat: "50.8812",
      centerLng: "-119.8925",
      radiusKm: "5",
      temperatureC: -26,
      searchRadiusM: 800,
      subject: {
        subjectType: "human",
        subjectSubtype: "hiker",
        name: "Ryan Shtuka",
        age: 20,
        gender: "male",
        description: "Missing since Feb 2018",
        circumstances: "Left a house party at Sundance Lodge, Sun Peaks Resort, walked into -26C night, never seen again.",
        fitnessLevel: "athletic",
        lastKnownLat: "50.8812",
        lastKnownLng: "-119.8925",
      },
    });
    expect(result).toHaveProperty("id");
  });

  it("snow bridge analysis with extreme parameters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Extreme cold, thick snow
    const safe = await caller.analytics.snowBridge({
      snowDepth_m: 5.0,
      temperature_c: -40,
      gapWidth_m: 1.0,
      subjectWeight_kg: 80,
    });
    expect(safe.riskLevel).toBe("low");
    expect(safe.willCollapse).toBe(false);

    // Warm, thin snow, wide gap
    const dangerous = await caller.analytics.snowBridge({
      snowDepth_m: 0.2,
      temperature_c: 5,
      gapWidth_m: 4.0,
      subjectWeight_kg: 100,
    });
    expect(dangerous.riskLevel).toBe("critical");
    expect(dangerous.willCollapse).toBe(true);
  });

  it("movement profile for all subject types", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const types = [
      { subjectType: "human" as const, subjectSubtype: "child" },
      { subjectType: "human" as const, subjectSubtype: "elderly" },
      { subjectType: "human" as const, subjectSubtype: "hiker" },
      { subjectType: "human" as const, subjectSubtype: "hunter" },
      { subjectType: "human" as const, subjectSubtype: "despondent" },
      { subjectType: "human" as const, subjectSubtype: "dementia" },
      { subjectType: "animal" as const, subjectSubtype: "dog" },
      { subjectType: "animal" as const, subjectSubtype: "cat" },
      { subjectType: "vehicle" as const, subjectSubtype: "car" },
    ];

    for (const t of types) {
      const result = await caller.analytics.movementProfile(t);
      expect(result.typicalSpeed_kmh).toBeGreaterThan(0);
      expect(result.p50_km).toBeGreaterThan(0);
      expect(result.p95_km).toBeGreaterThanOrEqual(result.p50_km);
    }
  });
});
