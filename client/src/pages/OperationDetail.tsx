import DashboardLayout from "@/components/DashboardLayout";
import SARMap from "@/components/SARMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, MapPin, Clock, Eye, Users, Package,
  AlertTriangle, Thermometer, Wind, Droplets, Activity
} from "lucide-react";

function OperationDetailContent() {
  const [, params] = useRoute("/operations/:id");
  const [, setLocation] = useLocation();
  const opId = parseInt(params?.id || "0");

  const { data: op, isLoading } = trpc.operations.getById.useQuery(
    { id: opId },
    { enabled: opId > 0 }
  );

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
  const subjects = (op as any).subjects || [];
  const zones = (op as any).zones || [];
  const sightingsList = (op as any).sightings || [];
  const teams = (op as any).teams || [];
  const timeline = (op as any).timeline || [];
  const subject = subjects[0];

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

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
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation(`/sightings?op=${opId}`)}>
            <Eye className="h-4 w-4 mr-1" /> Report Sighting
          </Button>
        </div>
      </div>

      {/* Map */}
      <Card className="glass border-border/30 overflow-hidden">
        <div className="h-[400px] lg:h-[500px]">
          <SARMap
            centerLat={parseFloat(String(op.centerLat)) || 51.1}
            centerLng={parseFloat(String(op.centerLng)) || -119.3}
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
        <TabsList className="glass border-border/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subject">Subject</TabsTrigger>
          <TabsTrigger value="zones">Probability Zones</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Search Radius</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{op.radiusKm ? `${parseFloat(String(op.radiusKm)).toFixed(1)} km` : "—"}</p></CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Probability Score</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{op.probabilityScore ? `${parseFloat(String(op.probabilityScore)).toFixed(0)}%` : "—"}</p></CardContent>
            </Card>
            <Card className="glass border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Teams</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-primary">{teams.length}</p></CardContent>
            </Card>
          </div>
          {op.notes && (
            <Card className="glass border-border/30 mt-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{op.notes}</p></CardContent>
            </Card>
          )}
        </TabsContent>

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
                  <span className="text-muted-foreground">Category:</span><span className="capitalize">{subject.subjectSubtype || "—"}</span>
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
                        v ? <><span key={k} className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span><span>{String(v)}</span></> : null
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
                      <p className="text-xs text-muted-foreground">Area: {parseFloat(String(z.areaKm2)).toFixed(1)} km² | Algorithm: {z.algorithm}</p>
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

        <TabsContent value="weather">
          {weather ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass border-border/30">
                <CardContent className="p-4 text-center">
                  <Thermometer className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{weather.temperature_c}°C</p>
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
