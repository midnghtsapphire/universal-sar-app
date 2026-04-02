import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { BarChart3, Crosshair, Activity, Users, MapPin, Thermometer, Wind } from "lucide-react";

function AnalyticsContent() {
  const { data: stats } = trpc.analytics.stats.useQuery();

  // Movement profile calculator
  const [subjectType, setSubjectType] = useState("human");
  const [subjectSubtype, setSubjectSubtype] = useState("hiker");
  const [age, setAge] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  const attrs = useMemo(() => {
    const a: any = {};
    if (age) a.age = parseInt(age);
    if (experienceLevel) a.experience_level = experienceLevel;
    return a;
  }, [age, experienceLevel]);

  const { data: profile } = trpc.analytics.movementProfile.useQuery({
    subjectType: subjectType as any,
    subjectSubtype,
    attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
  });

  // Weather lookup
  const [wxLat, setWxLat] = useState("51.1637");
  const [wxLng, setWxLng] = useState("-119.886");
  const parsedLat = parseFloat(wxLat);
  const parsedLng = parseFloat(wxLng);
  const { data: weather } = trpc.analytics.weather.useQuery(
    { lat: parsedLat, lng: parsedLng },
    { enabled: !isNaN(parsedLat) && !isNaN(parsedLng) }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient-amber">Analytics & Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">Movement profiles, weather data, and operational statistics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass border-border/30">
          <CardContent className="p-4 text-center">
            <Crosshair className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Ops</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/30">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto text-green-400 mb-1" />
            <p className="text-2xl font-bold">{stats?.active ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/30">
          <CardContent className="p-4 text-center">
            <Crosshair className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{stats?.closed ?? 0}</p>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/30">
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 mx-auto text-amber-400 mb-1" />
            <p className="text-2xl font-bold">{stats?.subjects ?? 0}</p>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/30">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-purple-400 mb-1" />
            <p className="text-2xl font-bold">{stats?.teams ?? 0}</p>
            <p className="text-xs text-muted-foreground">Teams</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Profile Calculator */}
        <Card className="glass border-border/30">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Movement Profile Calculator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Based on Robert Koester's Lost Person Behavior statistics. Select subject type to see expected travel distances.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground text-xs">Subject Type</Label>
                <Select value={subjectType} onValueChange={v => { setSubjectType(v); setSubjectSubtype(""); }}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="human">Human</SelectItem><SelectItem value="animal">Animal</SelectItem><SelectItem value="vehicle">Vehicle</SelectItem></SelectContent>
                </Select></div>
              <div><Label className="text-muted-foreground text-xs">Category</Label>
                <Select value={subjectSubtype} onValueChange={setSubjectSubtype}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subjectType === "human" && <>
                      <SelectItem value="child">Child</SelectItem><SelectItem value="hiker">Hiker</SelectItem>
                      <SelectItem value="elderly">Elderly</SelectItem><SelectItem value="alzheimers">Alzheimer's</SelectItem>
                      <SelectItem value="despondent">Despondent</SelectItem><SelectItem value="fugitive">Fugitive</SelectItem>
                      <SelectItem value="hunter">Hunter</SelectItem><SelectItem value="snowboarder">Skier/Snowboarder</SelectItem>
                    </>}
                    {subjectType === "animal" && <>
                      <SelectItem value="dog">Dog</SelectItem><SelectItem value="cat">Cat</SelectItem><SelectItem value="horse">Horse</SelectItem>
                    </>}
                    {subjectType === "vehicle" && <>
                      <SelectItem value="car">Car</SelectItem><SelectItem value="boat">Boat</SelectItem>
                    </>}
                  </SelectContent>
                </Select></div>
            </div>
            {subjectType === "human" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Age</Label>
                  <Input type="number" className="glass border-border/30 mt-1" placeholder="e.g. 35" value={age} onChange={e => setAge(e.target.value)} /></div>
                <div><Label className="text-muted-foreground text-xs">Experience</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="expert">Expert</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="novice">Novice</SelectItem></SelectContent>
                  </Select></div>
              </div>
            )}
            {profile && (
              <div className="glass-subtle rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-primary">Travel Distance Percentiles (24h)</p>
                <div className="space-y-2">
                  {[
                    { label: "25th percentile", value: profile.p25_km, pct: (profile.p25_km / profile.p95_km) * 100 },
                    { label: "50th percentile (median)", value: profile.p50_km, pct: (profile.p50_km / profile.p95_km) * 100 },
                    { label: "75th percentile", value: profile.p75_km, pct: (profile.p75_km / profile.p95_km) * 100 },
                    { label: "95th percentile", value: profile.p95_km, pct: 100 },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value} km</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full gradient-amber rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Typical speed: {profile.typicalSpeed_kmh} km/h</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Lookup */}
        <Card className="glass border-border/30">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Thermometer className="h-5 w-5 text-primary" /> Weather Lookup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Real-time weather data from Open-Meteo (FOSS). Used in SAR probability calculations.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground text-xs">Latitude</Label>
                <Input type="number" step="any" className="glass border-border/30 mt-1" value={wxLat} onChange={e => setWxLat(e.target.value)} /></div>
              <div><Label className="text-muted-foreground text-xs">Longitude</Label>
                <Input type="number" step="any" className="glass border-border/30 mt-1" value={wxLng} onChange={e => setWxLng(e.target.value)} /></div>
            </div>
            {weather && (
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <Thermometer className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{weather.temperature_c}°C</p>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                </div>
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <Wind className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{weather.wind_speed_kmh} km/h</p>
                  <p className="text-xs text-muted-foreground">Wind ({weather.wind_direction_deg}°)</p>
                </div>
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{weather.precipitation_mm} mm</p>
                  <p className="text-xs text-muted-foreground">Precipitation</p>
                </div>
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{weather.humidity_pct}%</p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{weather.snow_depth_cm} cm</p>
                  <p className="text-xs text-muted-foreground">Snow Depth</p>
                </div>
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{weather.visibility_m >= 10000 ? ">10" : (weather.visibility_m / 1000).toFixed(1)} km</p>
                  <p className="text-xs text-muted-foreground">Visibility</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}
