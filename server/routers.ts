import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import {
  runSARAnalysis,
  getMovementProfile,
  analyzeSnowBridge,
  fetchWeather,
  computeConvexHull,
  haversineDistance,
  type SubjectProfile,
  type SightingInput,
} from "./algorithms/sar-engine";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Subjects ────────────────────────────────────────
  subjects: router({
    create: protectedProcedure
      .input(z.object({
        operationId: z.number().optional(),
        subjectType: z.enum(["human", "animal", "vehicle", "object"]),
        subjectSubtype: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
        lastKnownLat: z.string().optional(),
        lastKnownLng: z.string().optional(),
        lastKnownAlt: z.string().optional(),
        lastSeenAt: z.date().optional(),
        directionOfTravel: z.string().optional(),
        circumstances: z.string().optional(),
        attributes: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createSubject({
          ...input,
          lastSeenAt: input.lastSeenAt || undefined,
          createdBy: ctx.user.id,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getSubjectById(input.id)),

    list: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(async ({ input }) => db.listSubjects(input?.limit, input?.offset)),

    getByOperation: publicProcedure
      .input(z.object({ operationId: z.number() }))
      .query(async ({ input }) => db.getSubjectsByOperation(input.operationId)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["missing", "located", "deceased", "suspended"]).optional(),
          lastKnownLat: z.string().optional(),
          lastKnownLng: z.string().optional(),
          attributes: z.any().optional(),
        }),
      }))
      .mutation(async ({ input }) => db.updateSubject(input.id, input.data)),
  }),

  // ─── Search Operations ───────────────────────────────
  operations: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        priority: z.enum(["critical", "high", "medium", "low"]).optional(),
        environment: z.enum(["urban", "suburban", "wilderness", "maritime", "mountain", "desert", "arctic"]).optional(),
        centerLat: z.string().optional(),
        centerLng: z.string().optional(),
        radiusKm: z.string().optional(),
        notes: z.string().optional(),
        // Subject data for inline creation
        subject: z.object({
          subjectType: z.enum(["human", "animal", "vehicle", "object"]),
          subjectSubtype: z.string().optional(),
          name: z.string().min(1),
          description: z.string().optional(),
          lastKnownLat: z.string(),
          lastKnownLng: z.string(),
          lastSeenAt: z.date().optional(),
          directionOfTravel: z.string().optional(),
          circumstances: z.string().optional(),
          attributes: z.any().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create the operation
        const op = await db.createOperation({
          name: input.name,
          status: "active",
          priority: input.priority || "medium",
          environment: input.environment || "wilderness",
          centerLat: input.centerLat || input.subject?.lastKnownLat,
          centerLng: input.centerLng || input.subject?.lastKnownLng,
          radiusKm: input.radiusKm,
          notes: input.notes,
          startedAt: new Date(),
          createdBy: ctx.user.id,
        });

        // Create subject if provided
        if (input.subject && op) {
          const subject = await db.createSubject({
            operationId: op.id,
            subjectType: input.subject.subjectType,
            subjectSubtype: input.subject.subjectSubtype,
            name: input.subject.name,
            description: input.subject.description,
            lastKnownLat: input.subject.lastKnownLat,
            lastKnownLng: input.subject.lastKnownLng,
            lastSeenAt: input.subject.lastSeenAt || new Date(),
            directionOfTravel: input.subject.directionOfTravel,
            circumstances: input.subject.circumstances,
            attributes: input.subject.attributes,
            createdBy: ctx.user.id,
          });

          // Run SAR analysis
          const lat = parseFloat(input.subject.lastKnownLat);
          const lng = parseFloat(input.subject.lastKnownLng);
          if (!isNaN(lat) && !isNaN(lng)) {
            try {
              const profile: SubjectProfile = {
                type: input.subject.subjectType,
                subtype: input.subject.subjectSubtype,
                attributes: input.subject.attributes,
              };
              const analysis = await runSARAnalysis(
                { lat, lng },
                profile,
                input.subject.lastSeenAt || new Date()
              );

              // Store probability zones
              for (const zone of analysis.zones) {
                await db.createProbabilityZone({
                  operationId: op.id,
                  zoneName: zone.zoneName,
                  zoneType: zone.zoneType,
                  probability: String(zone.probability) as any,
                  geoJson: zone.geoJson,
                  centerLat: String(zone.centerLat) as any,
                  centerLng: String(zone.centerLng) as any,
                  areaKm2: String(zone.areaKm2) as any,
                  algorithm: zone.algorithm,
                  confidence: String(zone.confidence) as any,
                });
              }

              // Update operation with boundary and weather
              await db.updateOperation(op.id, {
                boundaryGeoJson: analysis.boundaryGeoJson,
                radiusKm: String(analysis.maxRadiusKm) as any,
                weatherConditions: analysis.weather as any,
                probabilityScore: String(analysis.zones[0]?.probability * 100 || 0) as any,
              });

              // Log timeline event
              await db.createTimelineEvent({
                operationId: op.id,
                eventType: "status_change",
                title: "Search Operation Launched",
                description: `Operation "${input.name}" created. SAR analysis complete. Max search radius: ${analysis.maxRadiusKm.toFixed(1)} km. Weather: ${analysis.weather.temperature_c}°C.`,
                lat: String(lat) as any,
                lng: String(lng) as any,
                createdBy: ctx.user.id,
              });
            } catch (err) {
              console.error("[Operations] SAR analysis failed:", err);
            }
          }
        }

        return op;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const op = await db.getOperationById(input.id);
        if (!op) return null;
        const opSubjects = await db.getSubjectsByOperation(input.id);
        const zones = await db.getZonesByOperation(input.id);
        const opSightings = await db.getSightingsByOperation(input.id);
        const teams = await db.getTeamsByOperation(input.id);
        const timeline = await db.getTimelineByOperation(input.id);
        return { ...op, subjects: opSubjects, zones, sightings: opSightings, teams, timeline };
      }),

    list: publicProcedure
      .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => db.listOperations(input?.status, input?.limit)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["planning", "active", "suspended", "closed", "cold_case"]).optional(),
          priority: z.enum(["critical", "high", "medium", "low"]).optional(),
          notes: z.string().optional(),
          name: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.updateOperation(input.id, input.data);
        if (input.data.status) {
          await db.createTimelineEvent({
            operationId: input.id,
            eventType: "status_change",
            title: `Status changed to ${input.data.status}`,
            description: `Operation status updated to ${input.data.status}`,
            createdBy: ctx.user.id,
          });
        }
        return result;
      }),
  }),

  // ─── Sightings ───────────────────────────────────────
  sightings: router({
    create: protectedProcedure
      .input(z.object({
        operationId: z.number(),
        subjectId: z.number().optional(),
        lat: z.string(),
        lng: z.string(),
        sightedAt: z.date(),
        sightingType: z.enum(["visual", "auditory", "physical_evidence", "electronic", "scent", "footprint", "other"]).optional(),
        confidence: z.number().min(1).max(10),
        description: z.string().optional(),
        reporterName: z.string().optional(),
        reporterContact: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const sighting = await db.createSighting({
          ...input,
          sightingType: input.sightingType || "visual",
          sightedAt: input.sightedAt,
          createdBy: ctx.user.id,
        });

        // Trigger Bayesian update
        try {
          const op = await db.getOperationById(input.operationId);
          const opSubjects = await db.getSubjectsByOperation(input.operationId);
          const subject = opSubjects[0];
          if (op && subject && subject.lastKnownLat && subject.lastKnownLng) {
            const allSightings = await db.getSightingsByOperation(input.operationId);
            const sightingInputs: SightingInput[] = allSightings.map(s => ({
              lat: parseFloat(String(s.lat)),
              lng: parseFloat(String(s.lng)),
              confidence: s.confidence,
              sightingType: s.sightingType,
              sightedAt: s.sightedAt,
            }));

            const profile: SubjectProfile = {
              type: subject.subjectType,
              subtype: subject.subjectSubtype || undefined,
              attributes: subject.attributes as any,
            };

            const analysis = await runSARAnalysis(
              { lat: parseFloat(String(subject.lastKnownLat)), lng: parseFloat(String(subject.lastKnownLng)) },
              profile,
              subject.lastSeenAt || new Date(),
              sightingInputs
            );

            // Replace probability zones
            await db.deleteZonesByOperation(input.operationId);
            for (const zone of analysis.zones) {
              await db.createProbabilityZone({
                operationId: input.operationId,
                zoneName: zone.zoneName,
                zoneType: zone.zoneType,
                probability: String(zone.probability) as any,
                geoJson: zone.geoJson,
                centerLat: String(zone.centerLat) as any,
                centerLng: String(zone.centerLng) as any,
                areaKm2: String(zone.areaKm2) as any,
                algorithm: "bayesian_update",
                confidence: String(zone.confidence) as any,
              });
            }

            // Update operation probability score
            await db.updateOperation(input.operationId, {
              probabilityScore: String(analysis.zones[0]?.probability * 100 || 0) as any,
            });
          }
        } catch (err) {
          console.error("[Sightings] Bayesian update failed:", err);
        }

        // Log timeline event
        await db.createTimelineEvent({
          operationId: input.operationId,
          eventType: "sighting",
          title: `New ${input.sightingType || 'visual'} sighting reported`,
          description: input.description || `Confidence: ${input.confidence}/10`,
          lat: input.lat as any,
          lng: input.lng as any,
          createdBy: ctx.user.id,
        });

        return sighting;
      }),

    getByOperation: publicProcedure
      .input(z.object({ operationId: z.number() }))
      .query(async ({ input }) => db.getSightingsByOperation(input.operationId)),
  }),

  // ─── Teams ──────────────────────────────────────────
  teams: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        teamType: z.enum(["ground", "k9", "aerial", "marine", "technical", "gpr", "drone", "mounted"]).optional(),
        memberCount: z.number().optional(),
        equipment: z.any().optional(),
        contactInfo: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => db.createTeam({ ...input, teamType: input.teamType || "ground" })),

    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => db.listTeams(input?.limit)),

    getByOperation: publicProcedure
      .input(z.object({ operationId: z.number() }))
      .query(async ({ input }) => db.getTeamsByOperation(input.operationId)),

    deploy: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        operationId: z.number(),
        zoneId: z.number().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const team = await db.updateTeam(input.teamId, {
          operationId: input.operationId,
          assignedZoneId: input.zoneId,
          status: "deployed",
          currentLat: input.lat as any,
          currentLng: input.lng as any,
        });
        await db.createTimelineEvent({
          operationId: input.operationId,
          eventType: "team_deployed",
          title: `Team "${team?.name}" deployed`,
          description: `Assigned to zone ${input.zoneId || 'unspecified'}`,
          lat: input.lat as any,
          lng: input.lng as any,
          createdBy: ctx.user.id,
        });
        return team;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["available", "deployed", "returning", "off_duty"]).optional(),
          currentLat: z.string().optional(),
          currentLng: z.string().optional(),
          operationId: z.number().nullable().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => db.updateTeam(input.id, input.data as any)),
  }),

  // ─── Evidence ────────────────────────────────────────
  evidence: router({
    create: protectedProcedure
      .input(z.object({
        operationId: z.number(),
        subjectId: z.number().optional(),
        evidenceType: z.enum(["photo", "document", "physical", "digital", "forensic", "sensor_data", "video", "audio"]),
        title: z.string().min(1),
        description: z.string().optional(),
        fileUrl: z.string().optional(),
        fileType: z.string().optional(),
        collectedAt: z.date().optional(),
        collectedBy: z.string().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ev = await db.createEvidence({ ...input, collectedAt: input.collectedAt || undefined, createdBy: ctx.user.id });
        await db.createTimelineEvent({
          operationId: input.operationId,
          eventType: "evidence_found",
          title: `Evidence: ${input.title}`,
          description: input.description,
          lat: input.lat as any,
          lng: input.lng as any,
          createdBy: ctx.user.id,
        });
        return ev;
      }),

    getByOperation: publicProcedure
      .input(z.object({ operationId: z.number() }))
      .query(async ({ input }) => db.getEvidenceByOperation(input.operationId)),
  }),

  // ─── Timeline ────────────────────────────────────────
  timeline: router({
    getByOperation: publicProcedure
      .input(z.object({ operationId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => db.getTimelineByOperation(input.operationId, input.limit)),

    addNote: protectedProcedure
      .input(z.object({
        operationId: z.number(),
        title: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createTimelineEvent({
          operationId: input.operationId,
          eventType: "note",
          title: input.title,
          description: input.description,
          createdBy: ctx.user.id,
        });
      }),
  }),

  // ─── Probability Zones ──────────────────────────────
  zones: router({
    getByOperation: publicProcedure
      .input(z.object({ operationId: z.number() }))
      .query(async ({ input }) => db.getZonesByOperation(input.operationId)),
  }),

  // ─── Analytics ───────────────────────────────────────
  analytics: router({
    stats: publicProcedure.query(async () => db.getOperationStats()),

    movementProfile: publicProcedure
      .input(z.object({
        subjectType: z.enum(["human", "animal", "vehicle", "object"]),
        subjectSubtype: z.string().optional(),
        attributes: z.any().optional(),
      }))
      .query(async ({ input }) => {
        return getMovementProfile({
          type: input.subjectType,
          subtype: input.subjectSubtype,
          attributes: input.attributes,
        });
      }),

    snowBridge: publicProcedure
      .input(z.object({
        snowDepth_m: z.number(),
        temperature_c: z.number(),
        gapWidth_m: z.number().optional(),
        subjectWeight_kg: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return analyzeSnowBridge(
          input.snowDepth_m,
          input.temperature_c,
          input.gapWidth_m,
          input.subjectWeight_kg
        );
      }),

    weather: publicProcedure
      .input(z.object({ lat: z.number(), lng: z.number() }))
      .query(async ({ input }) => fetchWeather(input.lat, input.lng)),
  }),
});

export type AppRouter = typeof appRouter;
