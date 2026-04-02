import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  subjects, InsertSubject,
  searchOperations, InsertSearchOperation,
  probabilityZones, InsertProbabilityZone,
  sightings, InsertSighting,
  searchTeams, InsertSearchTeam,
  timelineEvents, InsertTimelineEvent,
  evidence, InsertEvidence,
  sensorData, InsertSensorData,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Subjects ────────────────────────────────────────────
export async function createSubject(data: InsertSubject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subjects).values(data);
  const id = result[0].insertId;
  return (await db.select().from(subjects).where(eq(subjects.id, id)))[0];
}

export async function getSubjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return result[0];
}

export async function getSubjectsByOperation(operationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects).where(eq(subjects.operationId, operationId)).orderBy(desc(subjects.createdAt));
}

export async function updateSubject(id: number, data: Partial<InsertSubject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subjects).set(data).where(eq(subjects.id, id));
  return (await db.select().from(subjects).where(eq(subjects.id, id)))[0];
}

export async function listSubjects(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects).orderBy(desc(subjects.createdAt)).limit(limit).offset(offset);
}

// ─── Search Operations ──────────────────────────────────
export async function createOperation(data: InsertSearchOperation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(searchOperations).values(data);
  const id = result[0].insertId;
  return (await db.select().from(searchOperations).where(eq(searchOperations.id, id)))[0];
}

export async function getOperationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(searchOperations).where(eq(searchOperations.id, id)).limit(1);
  return result[0];
}

export async function listOperations(status?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(searchOperations)
      .where(eq(searchOperations.status, status as any))
      .orderBy(desc(searchOperations.createdAt)).limit(limit).offset(offset);
  }
  return db.select().from(searchOperations).orderBy(desc(searchOperations.createdAt)).limit(limit).offset(offset);
}

export async function updateOperation(id: number, data: Partial<InsertSearchOperation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(searchOperations).set(data).where(eq(searchOperations.id, id));
  return (await db.select().from(searchOperations).where(eq(searchOperations.id, id)))[0];
}

// ─── Probability Zones ──────────────────────────────────
export async function createProbabilityZone(data: InsertProbabilityZone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(probabilityZones).values(data);
  const id = result[0].insertId;
  return (await db.select().from(probabilityZones).where(eq(probabilityZones.id, id)))[0];
}

export async function getZonesByOperation(operationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(probabilityZones).where(eq(probabilityZones.operationId, operationId)).orderBy(desc(probabilityZones.probability));
}

export async function deleteZonesByOperation(operationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(probabilityZones).where(eq(probabilityZones.operationId, operationId));
}

// ─── Sightings ──────────────────────────────────────────
export async function createSighting(data: InsertSighting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sightings).values(data);
  const id = result[0].insertId;
  return (await db.select().from(sightings).where(eq(sightings.id, id)))[0];
}

export async function getSightingsByOperation(operationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sightings).where(eq(sightings.operationId, operationId)).orderBy(desc(sightings.sightedAt));
}

// ─── Search Teams ───────────────────────────────────────
export async function createTeam(data: InsertSearchTeam) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(searchTeams).values(data);
  const id = result[0].insertId;
  return (await db.select().from(searchTeams).where(eq(searchTeams.id, id)))[0];
}

export async function listTeams(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(searchTeams).orderBy(desc(searchTeams.createdAt)).limit(limit);
}

export async function getTeamsByOperation(operationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(searchTeams).where(eq(searchTeams.operationId, operationId));
}

export async function updateTeam(id: number, data: Partial<InsertSearchTeam>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(searchTeams).set(data).where(eq(searchTeams.id, id));
  return (await db.select().from(searchTeams).where(eq(searchTeams.id, id)))[0];
}

// ─── Timeline Events ────────────────────────────────────
export async function createTimelineEvent(data: InsertTimelineEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timelineEvents).values(data);
  const id = result[0].insertId;
  return (await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)))[0];
}

export async function getTimelineByOperation(operationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timelineEvents).where(eq(timelineEvents.operationId, operationId)).orderBy(desc(timelineEvents.createdAt)).limit(limit);
}

// ─── Evidence ───────────────────────────────────────────
export async function createEvidence(data: InsertEvidence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evidence).values(data);
  const id = result[0].insertId;
  return (await db.select().from(evidence).where(eq(evidence.id, id)))[0];
}

export async function getEvidenceByOperation(operationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidence).where(eq(evidence.operationId, operationId)).orderBy(desc(evidence.createdAt));
}

// ─── Sensor Data ────────────────────────────────────────
export async function createSensorData(data: InsertSensorData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sensorData).values(data);
  const id = result[0].insertId;
  return (await db.select().from(sensorData).where(eq(sensorData.id, id)))[0];
}

export async function getSensorDataByOperation(operationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensorData).where(eq(sensorData.operationId, operationId)).orderBy(desc(sensorData.capturedAt));
}

// ─── Analytics Helpers ──────────────────────────────────
export async function getOperationStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, closed: 0, subjects: 0, teams: 0 };
  const ops = await db.select({ count: sql<number>`count(*)` }).from(searchOperations);
  const activeOps = await db.select({ count: sql<number>`count(*)` }).from(searchOperations).where(eq(searchOperations.status, "active"));
  const closedOps = await db.select({ count: sql<number>`count(*)` }).from(searchOperations).where(eq(searchOperations.status, "closed"));
  const subjectCount = await db.select({ count: sql<number>`count(*)` }).from(subjects);
  const teamCount = await db.select({ count: sql<number>`count(*)` }).from(searchTeams);
  return {
    total: Number(ops[0]?.count ?? 0),
    active: Number(activeOps[0]?.count ?? 0),
    closed: Number(closedOps[0]?.count ?? 0),
    subjects: Number(subjectCount[0]?.count ?? 0),
    teams: Number(teamCount[0]?.count ?? 0),
  };
}
