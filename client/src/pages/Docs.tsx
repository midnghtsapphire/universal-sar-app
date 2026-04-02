import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Database, Code, Shield, MapPin, Users, BarChart3, Crosshair } from "lucide-react";

function DocsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient-amber">Documentation</h1>
        <p className="text-muted-foreground text-sm mt-1">System architecture, algorithms, and reference material</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass border-border/30 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="resources">FOSS Resources</TabsTrigger>
          <TabsTrigger value="data">Data Dictionary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="glass border-border/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Crosshair className="h-5 w-5 text-primary" /> System Overview</CardTitle></CardHeader>
            <CardContent className="prose prose-invert prose-sm max-w-none">
              <p className="text-muted-foreground">The Universal SAR Application is a comprehensive search and rescue management platform designed to locate <strong>any subject type</strong> — humans (missing persons, fugitives, lost hikers), animals (lost dogs, wildlife), vehicles, and objects.</p>
              <h4 className="text-foreground mt-4">Core Capabilities</h4>
              <ul className="text-muted-foreground space-y-1">
                <li><strong className="text-foreground">Polymorphic Subject Tracking:</strong> Different subject types have different attributes. A missing child has age/fitness/clothing; a lost dog has breed/temperament/collar; a vehicle has make/model/plate. The system adapts input forms and algorithms per type.</li>
                <li><strong className="text-foreground">Bayesian Probability Mapping:</strong> Probability zones are calculated using prior distributions from Lost Person Behavior statistics (Koester), then updated with each new sighting using Bayes' theorem.</li>
                <li><strong className="text-foreground">Convex Hull Search Areas:</strong> Graham Scan algorithm computes the convex hull of all sighting points, expanded by a buffer based on subject mobility profile.</li>
                <li><strong className="text-foreground">Movement Prediction:</strong> Travel distance percentiles (25th, 50th, 75th, 95th) from empirical SAR data, adjusted for terrain, weather, fitness, and experience.</li>
                <li><strong className="text-foreground">Weather Integration:</strong> Real-time data from Open-Meteo (FOSS) including temperature, wind, precipitation, snow depth, and visibility — all factor into probability calculations.</li>
                <li><strong className="text-foreground">Snow Bridge Analysis:</strong> Forensic structural analysis engine ported from Python, based on the Sun Peaks Feb 2018 case methodology.</li>
              </ul>
              <h4 className="text-foreground mt-4">Architecture</h4>
              <p className="text-muted-foreground">React 19 + TypeScript frontend with Leaflet.js maps, tRPC API layer, MySQL/TiDB database with Drizzle ORM, and a pure-TypeScript SAR algorithm engine. All FOSS-first — no paid dependencies.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithms">
          <div className="space-y-4">
            <Card className="glass border-border/30">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Convex Hull (Graham Scan)</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Given N sighting points, compute the convex hull — the smallest convex polygon containing all points. This defines the minimum search boundary.</p>
                <p><strong className="text-foreground">Steps:</strong> (1) Find lowest-y point as pivot. (2) Sort remaining points by polar angle. (3) Iterate, maintaining a stack of hull vertices using cross-product orientation test. (4) Expand hull by buffer distance based on subject mobility profile.</p>
                <p><strong className="text-foreground">Buffer:</strong> Expanded by 50th-percentile travel distance for the subject type. A lost hiker gets ~4km buffer; a lost dog gets ~3km; a vehicle gets ~50km.</p>
              </CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Bayesian Probability Update</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Each probability zone has a prior probability based on distance from LKP and Lost Person Behavior statistics. When a new sighting is reported:</p>
                <p><strong className="text-foreground">P(zone|sighting) = P(sighting|zone) × P(zone) / P(sighting)</strong></p>
                <p>The likelihood P(sighting|zone) is computed using a Gaussian kernel centered on the sighting location, weighted by the sighting confidence (1-10 scale). Zones closer to high-confidence sightings get probability boosts.</p>
              </CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Lost Person Behavior (Koester)</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Robert Koester's <em>Lost Person Behavior</em> provides empirical travel distance data by subject category. The system uses these percentiles:</p>
                <p><strong className="text-foreground">Hiker:</strong> P25=1.9km, P50=3.6km, P75=6.1km, P95=14.2km</p>
                <p><strong className="text-foreground">Child (1-6):</strong> P25=0.4km, P50=0.8km, P75=1.6km, P95=3.4km</p>
                <p><strong className="text-foreground">Alzheimer's:</strong> P25=0.5km, P50=1.2km, P75=2.4km, P95=6.1km</p>
                <p><strong className="text-foreground">Despondent:</strong> P25=0.3km, P50=1.0km, P75=2.8km, P95=11.3km</p>
                <p>These are adjusted by terrain difficulty, weather severity, fitness level, and experience.</p>
              </CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Snow Bridge Analysis</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Forensic structural analysis using beam theory. Computes bearing capacity from snow cohesion (temperature-dependent), applies degradation factors for solar exposure and age, then calculates safety factor as capacity/stress ratio.</p>
                <p><strong className="text-foreground">Safety Factor ≥ 3.0:</strong> Safe for human crossing</p>
                <p><strong className="text-foreground">Safety Factor 1.0-3.0:</strong> Marginal — risk assessment required</p>
                <p><strong className="text-foreground">Safety Factor &lt; 1.0:</strong> Imminent collapse risk</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <Card className="glass border-border/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-primary" /> tRPC API Endpoints</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="space-y-3">
                {[
                  { ns: "operations", methods: ["list", "getById", "create", "updateStatus"] },
                  { ns: "subjects", methods: ["getByOperation", "create", "update"] },
                  { ns: "sightings", methods: ["getByOperation", "create"] },
                  { ns: "teams", methods: ["list", "create", "updateStatus", "deploy"] },
                  { ns: "evidence", methods: ["getByOperation", "create"] },
                  { ns: "timeline", methods: ["getByOperation", "create"] },
                  { ns: "zones", methods: ["getByOperation", "recalculate"] },
                  { ns: "analytics", methods: ["stats", "movementProfile", "weather", "snowBridge"] },
                ].map(ep => (
                  <div key={ep.ns} className="glass-subtle rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">trpc.{ep.ns}.*</p>
                    <div className="flex flex-wrap gap-1">
                      {ep.methods.map(m => (
                        <span key={m} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{m}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="glass border-border/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> FOSS Resources (Free Over Paid)</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="space-y-3">
                {[
                  { name: "OpenStreetMap", desc: "Free, editable map of the world. Base layer for all map rendering.", url: "https://www.openstreetmap.org" },
                  { name: "Leaflet.js", desc: "Open-source JavaScript library for interactive maps. Lightweight, mobile-friendly.", url: "https://leafletjs.com" },
                  { name: "CARTO Dark Basemap", desc: "Dark-themed map tiles from CARTO, free tier available.", url: "https://carto.com/basemaps" },
                  { name: "Open-Meteo", desc: "Free weather API. No API key required. Temperature, wind, precipitation, snow depth.", url: "https://open-meteo.com" },
                  { name: "OpenTopoMap", desc: "Topographic map tiles derived from OSM and SRTM elevation data.", url: "https://opentopomap.org" },
                  { name: "Esri World Imagery", desc: "Free satellite imagery tiles for visual reference.", url: "https://www.arcgis.com" },
                  { name: "Turf.js", desc: "Advanced geospatial analysis in JavaScript. Convex hull, buffer, area calculations.", url: "https://turfjs.org" },
                  { name: "Drizzle ORM", desc: "TypeScript ORM for SQL databases. Type-safe schema and queries.", url: "https://orm.drizzle.team" },
                  { name: "tRPC", desc: "End-to-end typesafe APIs. No code generation needed.", url: "https://trpc.io" },
                  { name: "React 19", desc: "UI library for building component-based interfaces.", url: "https://react.dev" },
                  { name: "Tailwind CSS 4", desc: "Utility-first CSS framework.", url: "https://tailwindcss.com" },
                ].map(r => (
                  <div key={r.name} className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="glass border-border/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Data Dictionary (Key Tables)</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="space-y-4">
                {[
                  { table: "subjects", desc: "Polymorphic subject tracking", fields: "id, operationId, subjectType (human|animal|vehicle|object), subjectSubtype, name, description, status, lastKnownLat/Lng, lastSeenAt, circumstances, attributes (JSON — type-specific fields)" },
                  { table: "search_operations", desc: "SAR operations", fields: "id, userId, name, status, priority, environment, centerLat/Lng, radiusKm, probabilityScore, boundaryGeoJson, weatherConditions (JSON), notes" },
                  { table: "probability_zones", desc: "Calculated search zones", fields: "id, operationId, zoneName, zoneType (primary|secondary|tertiary), probability, confidence, geoJson, areaKm2, algorithm" },
                  { table: "sightings", desc: "Subject sighting reports", fields: "id, operationId, subjectId, lat/lng, sightedAt, sightingType, confidence (1-10), description, reporterName, verified" },
                  { table: "search_teams", desc: "Deployed search teams", fields: "id, operationId, name, teamType, status, memberCount, currentLat/Lng, assignedZone, contactInfo" },
                  { table: "evidence", desc: "Evidence catalog", fields: "id, operationId, title, evidenceType, description, fileUrl, lat/lng, collectedBy, chainOfCustody, collectedAt" },
                  { table: "timeline_events", desc: "Operation timeline", fields: "id, operationId, eventType, title, description, lat/lng, createdAt" },
                ].map(t => (
                  <div key={t.table} className="glass-subtle rounded-lg p-3">
                    <p className="font-medium text-foreground">{t.table}</p>
                    <p className="text-xs mb-1">{t.desc}</p>
                    <p className="text-xs opacity-70">{t.fields}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Docs() {
  return (
    <DashboardLayout>
      <DocsContent />
    </DashboardLayout>
  );
}
