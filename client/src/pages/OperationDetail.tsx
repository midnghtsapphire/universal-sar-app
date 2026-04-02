import DashboardLayout from "@/components/DashboardLayout";
import SARMap from "@/components/SARMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, Eye, Users, AlertTriangle,
  Thermometer, Wind, Droplets, Activity, Mountain, Radar,
  RefreshCw, Layers, Navigation, TreePine
} from "lucide-react";

function OperationDetailContent() {
  const [, params] = useRoute("/operations/:id");
  const [, setLocation] = useLocation();
  const opId = parseInt(params?.id || "0");
  const [showFoliumMap, setShowFoliumMap] = useState(false);

  const { data: op, isLoading, refetch } = trpc.operations.getById.useQuery(
    { id: opId },
    { enabled: opId > 0, refetchInterval: 15000 }
  );

  const runTerrain = trpc.operations.runTerrainAnalysis.useMutation({
    onSuccess: () => {
      toast.success("Terrain analysis complete! Refreshing...");
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Terrain analysis failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!op) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-lg font-medium">Operation not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/operations")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Operations
        </Button>
      </div>
    );
  }

  const weather = op.weatherConditions as any;
  const terrain = op.terrainData as any;
  const subjects = (op as any).subjects || [];
  const zones = (op as any).zones || [];
  const sightingsList = (op as any).sightings || [];
  const teams = (op as any).teams || [];
  const timeline = (op as any).timeline || [];
  const subject = subjects[0];

  const terrainStats = terrain?.terrain_stats;
  const anomalies = terrain?.anomalies || [];
  const osmFeatures = terrain?.osm_features;
  const gprProtocol = terrain?.gpr_protocol;
  const report = terrain?.report;

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const centerLat = parseFloat(String(op.centerLat)) || 51.1;
  const centerLng = parseFloat(String(op.centerLng)) || -119.3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/operations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{op.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={priorityColors[op.priority] || ""}>{op.priority}</Badge>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">{op.status}</Badge>
              <span className="text-xs text-muted-foreground capitalize">{op.environment}</span>
              {terrain && <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Terrain Data</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation(`/sightings?op=${opId}`)}>
            <Eye className="h-4 w-4 mr-1" /> Report Sighting
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runTerrain.mutate({ operationId: opId, lat: centerLat, lon: centerLng })}
            disabled={runTerrain.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${runTerrain.isPending ? "animate-spin" : ""}`} />
            {runTerrain.isPending ? "Analyzing..." : "Run Terrain Analysis"}
          </Button>
        </div>
      </div>

      {/* Map */}
      <Card className="glass border-border/30 overflow-hidden">
        <div className="h-[400px] lg:h-[500px]">
          <SARMap
            centerLat={centerLat}
            centerLng={centerLng}
            zones={zones}
            sightings={sightingsList}
            teams={teams}
            lastKnownLat={subject ? parseFloat(String(subject.lastKnownLat)) : undefined}
            lastKnownLng={subject ? parseFloat(String(subject.lastKnownLng)) : undefined}
            boundaryGeoJson={op.boundaryGeoJson as any}
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass border-border/30 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subject">Subject</TabsTrigger>
          <TabsTrigger value="terrain">Terrain {terrain ? `(${anomalies.length})` : ""}</TabsTrigger>
          <TabsTrigger value="gpr">GPR Protocol</TabsTrigger>
          <TabsTrigger value="zones">Zones ({zones.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Search Radius</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{op.radiusKm ? `${parseFloat(String(op.radiusKm)).toFixed(1)} km` : "\u2014"}</p></CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Probability Score</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{op.probabilityScore ? `${parseFloat(String(op.probabilityScore)).toFixed(0)}%` : "\u2014"}</p></CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Anomalies Found</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{terrainStats ? terrainStats.anomaly_count : "\u2014"}</p></CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Teams</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{teams.length}</p></CardContent>
            </Card>
          </div>
          {terrainStats && (
            <Card className="glass border-border/30 mt-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" /> Terrain Summary (Real Data)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground block">Elevation Range</span><span className="font-medium">{terrainStats.elevation_range?.toFixed(0)}m</span></div>
                  <div><span className="text-muted-foreground block">Min Elevation</span><span className="font-medium">{terrainStats.min_elevation?.toFixed(0)}m</span></div>
                  <div><span className="text-muted-foreground block">Max Elevation</span><span className="font-medium">{terrainStats.max_elevation?.toFixed(0)}m</span></div>
                  <div><span className="text-muted-foreground block">Mean Slope</span><span className="font-medium">{terrainStats.mean_slope?.toFixed(1)}&deg;</span></div>
                  <div><span className="text-muted-foreground block">Max Slope</span><span className="font-medium">{terrainStats.max_slope?.toFixed(1)}&deg;</span></div>
                  <div><span className="text-muted-foreground block">Total Anomalies</span><span className="font-bold text-amber-400">{terrainStats.anomaly_count}</span></div>
                  <div><span className="text-muted-foreground block">Phase 3 (Critical)</span><span className="font-bold text-red-400">{terrainStats.phase3_count}</span></div>
                  <div><span className="text-muted-foreground block">Elevation Points</span><span className="font-medium">{terrain?.elevation_summary?.total_points || "?"}</span></div>
                </div>
              </CardContent>
            </Card>
          )}
          {osmFeatures && (
            <Card className="glass border-border/30 mt-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> OSM Features (Real Data)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground block">Waterways</span><span className="font-medium text-blue-400">{osmFeatures.waterways?.length || 0}</span></div>
                  <div><span className="text-muted-foreground block">Roads</span><span className="font-medium text-gray-400">{osmFeatures.roads?.length || 0}</span></div>
                  <div><span className="text-muted-foreground block">Forest Areas</span><span className="font-medium text-green-400">{osmFeatures.forest?.length || 0}</span></div>
                  <div><span className="text-muted-foreground block">Buildings</span><span className="font-medium text-orange-400">{osmFeatures.buildings?.length || 0}</span></div>
                </div>
              </CardContent>
            </Card>
          )}
          {op.notes && (
            <Card className="glass border-border/30 mt-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{op.notes}</p></CardContent>
            </Card>
          )}
          {!terrain && (
            <Card className="glass border-border/30 mt-4 border-dashed">
              <CardContent className="p-6 text-center">
                <Radar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Terrain analysis not yet available. It runs automatically on operation creation (30-60 sec) or you can trigger it manually.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTerrain.mutate({ operationId: opId, lat: centerLat, lon: centerLng })}
                  disabled={runTerrain.isPending}
                >
                  {runTerrain.isPending ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Running...</> : <><Radar className="h-4 w-4 mr-1" /> Run Terrain Analysis Now</>}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subject Tab */}
        <TabsContent value="subject">
          {subject ? (
            <Card className="glass border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {subject.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <span className="text-muted-foreground">Type:</span><span className="capitalize">{subject.subjectType}</span>
                  <span className="text-muted-foreground">Category:</span><span className="capitalize">{subject.subjectSubtype || "\u2014"}</span>
                  <span className="text-muted-foreground">Status:</span><span className="capitalize">{subject.status}</span>
                  <span className="text-muted-foreground">LKP:</span><span>{subject.lastKnownLat}, {subject.lastKnownLng}</span>
                  {subject.description && <><span className="text-muted-foreground">Description:</span><span>{subject.description}</span></>}
                  {subject.circumstances && <><span className="text-muted-foreground col-span-2 mt-2">Circumstances:</span><span className="col-span-2 text-muted-foreground">{subject.circumstances}</span></>}
                </div>
                {subject.attributes && typeof subject.attributes === "object" && Object.keys(subject.attributes).length > 0 && (
                  <div className="mt-4 border-t border-border/20 pt-4">
                    <p className="text-sm font-medium text-primary mb-2">Attributes</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(subject.attributes as Record<string, any>).map(([k, v]) => (
                        v ? <div key={k} className="contents"><span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span><span>{String(v)}</span></div> : null
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-center py-8">No subject data</p>
          )}
        </TabsContent>

        {/* Terrain Analysis Tab */}
        <TabsContent value="terrain">
          {terrain ? (
            <div className="space-y-4">
              {/* Anomalies Table */}
              <Card className="glass border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Terrain Anomalies ({anomalies.length} detected)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {anomalies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No anomalies detected in search area.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/20 text-muted-foreground">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Phase</th>
                            <th className="text-left py-2 px-2">Lat</th>
                            <th className="text-left py-2 px-2">Lon</th>
                            <th className="text-left py-2 px-2">Elev (m)</th>
                            <th className="text-left py-2 px-2">Slope (&deg;)</th>
                            <th className="text-left py-2 px-2">Dist (m)</th>
                            <th className="text-left py-2 px-2">Flags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anomalies.slice(0, 50).map((a: any, i: number) => {
                            const phase = a.phase || a.anomaly_phase || "?";
                            const phaseColor = phase === 3 ? "text-red-400 font-bold" : phase === 2 ? "text-amber-400" : "text-blue-400";
                            return (
                              <tr key={i} className="border-b border-border/10 hover:bg-white/5">
                                <td className="py-1.5 px-2">{i + 1}</td>
                                <td className={`py-1.5 px-2 ${phaseColor}`}>Phase {phase}</td>
                                <td className="py-1.5 px-2 font-mono text-xs">{a.lat?.toFixed(5)}</td>
                                <td className="py-1.5 px-2 font-mono text-xs">{a.lon?.toFixed(5)}</td>
                                <td className="py-1.5 px-2">{a.elevation?.toFixed(0)}</td>
                                <td className="py-1.5 px-2">{a.slope?.toFixed(1)}</td>
                                <td className="py-1.5 px-2">{a.distance_to_center?.toFixed(0)}</td>
                                <td className="py-1.5 px-2 text-xs">
                                  {a.is_depression && <Badge variant="outline" className="mr-1 text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">Depression</Badge>}
                                  {a.is_steep && <Badge variant="outline" className="mr-1 text-xs bg-red-500/10 text-red-400 border-red-500/20">Steep</Badge>}
                                  {a.near_water && <Badge variant="outline" className="mr-1 text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Water</Badge>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {anomalies.length > 50 && <p className="text-xs text-muted-foreground mt-2">Showing first 50 of {anomalies.length} anomalies.</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Folium Map */}
              {terrain.map_html && (
                <Card className="glass border-border/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Interactive Terrain Map (Folium)</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setShowFoliumMap(!showFoliumMap)}>
                        {showFoliumMap ? "Hide Map" : "Show Map"}
                      </Button>
                    </div>
                  </CardHeader>
                  {showFoliumMap && (
                    <CardContent>
                      <div className="rounded-lg overflow-hidden border border-border/20" style={{ height: "500px" }}>
                        <iframe
                          srcDoc={terrain.map_html}
                          className="w-full h-full"
                          sandbox="allow-scripts allow-same-origin"
                          title="Terrain Analysis Map"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Terrain Plot */}
              {terrain.terrain_plot_b64 && (
                <Card className="glass border-border/30">
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" /> Elevation Profile (Matplotlib)</CardTitle></CardHeader>
                  <CardContent>
                    <img src={`data:image/png;base64,${terrain.terrain_plot_b64}`} alt="Terrain elevation profile" className="w-full rounded-lg" />
                  </CardContent>
                </Card>
              )}

              {/* Report */}
              {report && (
                <Card className="glass border-border/30">
                  <CardHeader><CardTitle className="text-sm">Analysis Report</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {typeof report === "string" ? report : JSON.stringify(report, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="glass border-border/30 border-dashed">
              <CardContent className="p-8 text-center">
                <Mountain className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No terrain analysis data yet. Click below to run real terrain analysis using OpenTopoData and Overpass API.</p>
                <Button
                  onClick={() => runTerrain.mutate({ operationId: opId, lat: centerLat, lon: centerLng })}
                  disabled={runTerrain.isPending}
                  className="gradient-amber text-primary-foreground"
                >
                  {runTerrain.isPending ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Analyzing (30-60s)...</> : <><Radar className="h-4 w-4 mr-1" /> Run Terrain Analysis</>}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GPR Protocol Tab */}
        <TabsContent value="gpr">
          {gprProtocol ? (
            <div className="space-y-4">
              <Card className="glass border-border/30">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Radar className="h-4 w-4 text-primary" /> GPR Protocol</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted-foreground block">Antenna Frequency</span><span className="font-medium text-primary">{gprProtocol.antenna_freq_mhz} MHz</span></div>
                    <div><span className="text-muted-foreground block">Dielectric Constant</span><span className="font-medium">{gprProtocol.dielectric_constant?.toFixed(1)}</span></div>
                    <div><span className="text-muted-foreground block">Velocity (m/ns)</span><span className="font-medium">{gprProtocol.velocity_m_per_ns?.toFixed(3)}</span></div>
                    <div><span className="text-muted-foreground block">Max Depth (m)</span><span className="font-medium">{gprProtocol.max_depth_m?.toFixed(1)}</span></div>
                    <div><span className="text-muted-foreground block">Line Spacing (m)</span><span className="font-medium">{gprProtocol.line_spacing_m?.toFixed(1)}</span></div>
                    <div><span className="text-muted-foreground block">Priority Targets</span><span className="font-bold text-amber-400">{gprProtocol.priority_targets?.length || 0}</span></div>
                  </div>
                </CardContent>
              </Card>
              {gprProtocol.priority_targets && gprProtocol.priority_targets.length > 0 && (
                <Card className="glass border-border/30">
                  <CardHeader><CardTitle className="text-sm">Priority GPR Targets</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {gprProtocol.priority_targets.map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm">
                          <div>
                            <span className="font-medium">Target {i + 1}</span>
                            <span className="text-muted-foreground ml-2 font-mono text-xs">({t.lat?.toFixed(5)}, {t.lon?.toFixed(5)})</span>
                          </div>
                          <Badge variant="outline" className={t.phase === 3 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}>
                            Phase {t.phase}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {gprProtocol.scan_notes && (
                <Card className="glass border-border/30">
                  <CardHeader><CardTitle className="text-sm">Scan Notes</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{gprProtocol.scan_notes}</p></CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="glass border-border/30 border-dashed">
              <CardContent className="p-8 text-center">
                <Radar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">GPR protocol will be generated when terrain analysis completes.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Probability Zones Tab */}
        <TabsContent value="zones">
          <div className="space-y-3">
            {zones.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No probability zones calculated</p>
            ) : (
              zones.map((z: any, i: number) => (
                <Card key={i} className="glass border-border/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{z.zoneName}</p>
                      <p className="text-xs text-muted-foreground">Area: {parseFloat(String(z.areaKm2)).toFixed(1)} km\u00B2 | Algorithm: {z.algorithm}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{(parseFloat(String(z.probability)) * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Confidence: {(parseFloat(String(z.confidence)) * 100).toFixed(0)}%</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="glass border-border/30">
            <CardContent className="p-4">
              {timeline.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No timeline events</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((ev: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/30 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{ev.title}</p>
                        {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ev.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather">
          {weather ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass border-border/30">
                <CardContent className="p-4 text-center">
                  <Thermometer className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{weather.temperature_c}&deg;C</p>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                </CardContent>
              </Card>
              <Card className="glass border-border/30">
                <CardContent className="p-4 text-center">
                  <Wind className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{weather.wind_speed_kmh} km/h</p>
                  <p className="text-xs text-muted-foreground">Wind Speed</p>
                </CardContent>
              </Card>
              <Card className="glass border-border/30">
                <CardContent className="p-4 text-center">
                  <Droplets className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{weather.precipitation_mm} mm</p>
                  <p className="text-xs text-muted-foreground">Precipitation</p>
                </CardContent>
              </Card>
              <Card className="glass border-border/30">
                <CardContent className="p-4 text-center">
                  <Droplets className="h-6 w-6 mx-auto text-cyan-400 mb-2" />
                  <p className="text-2xl font-bold">{weather.humidity_pct}%</p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No weather data available</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Data Source Attribution */}
      <div className="text-xs text-muted-foreground text-center py-2 border-t border-border/10">
        Data provided by free sources and APIs: OpenTopoData (SRTM30m elevation), Overpass API (OSM features), Open-Meteo (weather). All FOSS.
      </div>
    </div>
  );
}

export default function OperationDetail() {
  return (
    <DashboardLayout>
      <OperationDetailContent />
    </DashboardLayout>
  );
}
