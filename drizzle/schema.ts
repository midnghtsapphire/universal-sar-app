import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subjects (Polymorphic: human, animal, vehicle, object) ─────
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId"),
  subjectType: mysqlEnum("subjectType", ["human", "animal", "vehicle", "object"]).notNull(),
  subjectSubtype: varchar("subjectSubtype", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  photoUrl: varchar("photoUrl", { length: 512 }),
  lastKnownLat: decimal("lastKnownLat", { precision: 10, scale: 7 }),
  lastKnownLng: decimal("lastKnownLng", { precision: 10, scale: 7 }),
  lastKnownAlt: decimal("lastKnownAlt", { precision: 8, scale: 2 }),
  lastSeenAt: timestamp("lastSeenAt"),
  directionOfTravel: varchar("directionOfTravel", { length: 16 }),
  circumstances: varchar("circumstances", { length: 64 }),
  status: mysqlEnum("status", ["missing", "located", "deceased", "suspended"]).default("missing").notNull(),
  attributes: json("attributes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

// ─── Search Operations ──────────────────────────────────
export const searchOperations = mysqlTable("search_operations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["planning", "active", "suspended", "closed", "cold_case"]).default("planning").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  environment: mysqlEnum("environment", ["urban", "suburban", "wilderness", "maritime", "mountain", "desert", "arctic"]).default("wilderness").notNull(),
  centerLat: decimal("centerLat", { precision: 10, scale: 7 }),
  centerLng: decimal("centerLng", { precision: 10, scale: 7 }),
  radiusKm: decimal("radiusKm", { precision: 8, scale: 2 }),
  boundaryGeoJson: json("boundaryGeoJson"),
  probabilityScore: decimal("probabilityScore", { precision: 5, scale: 2 }),
  weatherConditions: json("weatherConditions"),
  terrainData: json("terrainData"),
  notes: text("notes"),
  startedAt: timestamp("startedAt"),
  closedAt: timestamp("closedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SearchOperation = typeof searchOperations.$inferSelect;
export type InsertSearchOperation = typeof searchOperations.$inferInsert;

// ─── Probability Zones ──────────────────────────────────
export const probabilityZones = mysqlTable("probability_zones", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId").notNull(),
  zoneName: varchar("zoneName", { length: 128 }),
  zoneType: mysqlEnum("zoneType", ["primary", "secondary", "tertiary", "exclusion"]).default("primary").notNull(),
  probability: decimal("probability", { precision: 5, scale: 4 }),
  geoJson: json("geoJson"),
  centerLat: decimal("centerLat", { precision: 10, scale: 7 }),
  centerLng: decimal("centerLng", { precision: 10, scale: 7 }),
  areaKm2: decimal("areaKm2", { precision: 10, scale: 4 }),
  algorithm: varchar("algorithm", { length: 64 }),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProbabilityZone = typeof probabilityZones.$inferSelect;
export type InsertProbabilityZone = typeof probabilityZones.$inferInsert;

// ─── Sightings ──────────────────────────────────────────
export const sightings = mysqlTable("sightings", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId").notNull(),
  subjectId: int("subjectId"),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  sightedAt: timestamp("sightedAt").notNull(),
  sightingType: mysqlEnum("sightingType", ["visual", "auditory", "physical_evidence", "electronic", "scent", "footprint", "other"]).default("visual").notNull(),
  confidence: int("confidence").notNull(),
  description: text("description"),
  reporterName: varchar("reporterName", { length: 255 }),
  reporterContact: varchar("reporterContact", { length: 255 }),
  photoUrl: varchar("photoUrl", { length: 512 }),
  verified: boolean("verified").default(false),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sighting = typeof sightings.$inferSelect;
export type InsertSighting = typeof sightings.$inferInsert;

// ─── Search Teams ───────────────────────────────────────
export const searchTeams = mysqlTable("search_teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  teamType: mysqlEnum("teamType", ["ground", "k9", "aerial", "marine", "technical", "gpr", "drone", "mounted"]).default("ground").notNull(),
  status: mysqlEnum("status", ["available", "deployed", "returning", "off_duty"]).default("available").notNull(),
  memberCount: int("memberCount"),
  operationId: int("operationId"),
  currentLat: decimal("currentLat", { precision: 10, scale: 7 }),
  currentLng: decimal("currentLng", { precision: 10, scale: 7 }),
  assignedZoneId: int("assignedZoneId"),
  equipment: json("equipment"),
  contactInfo: varchar("contactInfo", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SearchTeam = typeof searchTeams.$inferSelect;
export type InsertSearchTeam = typeof searchTeams.$inferInsert;

// ─── Timeline Events ────────────────────────────────────
export const timelineEvents = mysqlTable("timeline_events", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId").notNull(),
  eventType: mysqlEnum("eventType", [
    "status_change", "sighting", "team_deployed", "team_recalled",
    "probability_update", "weather_update", "evidence_found",
    "note", "decision", "resource_change"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  metadata: json("metadata"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

// ─── Evidence ───────────────────────────────────────────
export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId").notNull(),
  subjectId: int("subjectId"),
  evidenceType: mysqlEnum("evidenceType", [
    "photo", "document", "physical", "digital", "forensic", "sensor_data", "video", "audio"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 512 }),
  fileType: varchar("fileType", { length: 64 }),
  fileSize: int("fileSize"),
  collectedAt: timestamp("collectedAt"),
  collectedBy: varchar("collectedBy", { length: 255 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  chainOfCustody: json("chainOfCustody"),
  metadata: json("metadata"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

// ─── Sensor Data ────────────────────────────────────────
export const sensorData = mysqlTable("sensor_data", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId").notNull(),
  sensorType: mysqlEnum("sensorType", [
    "drone_thermal", "drone_lidar", "drone_visual", "gpr",
    "acoustic", "seismic", "trail_camera", "sonar", "cell_ping", "satellite"
  ]).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  altitude: decimal("altitude", { precision: 8, scale: 2 }),
  reading: json("reading"),
  anomalyDetected: boolean("anomalyDetected").default(false),
  anomalyConfidence: decimal("anomalyConfidence", { precision: 5, scale: 4 }),
  capturedAt: timestamp("capturedAt").notNull(),
  processedAt: timestamp("processedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = typeof sensorData.$inferInsert;
