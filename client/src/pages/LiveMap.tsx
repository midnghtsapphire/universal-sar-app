import DashboardLayout from "@/components/DashboardLayout";
import SARMap from "@/components/SARMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { MapPin, Activity } from "lucide-react";

function LiveMapContent() {
  const [selectedOpId, setSelectedOpId] = useState<string>("all");
  const { data: ops } = trpc.operations.list.useQuery({});

  const opId = selectedOpId !== "all" ? parseInt(selectedOpId) : undefined;
  const { data: opDetail } = trpc.operations.getById.useQuery(
    { id: opId! },
    { enabled: !!opId }
  );

  const zones = useMemo(() => (opDetail as any)?.zones || [], [opDetail]);
  const sightings = useMemo(() => (opDetail as any)?.sightings || [], [opDetail]);
  const teams = useMemo(() => (opDetail as any)?.teams || [], [opDetail]);
  const subjects = useMemo(() => (opDetail as any)?.subjects || [], [opDetail]);
  const subject = subjects[0];

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient-amber">Live Map</h1>
        <Select value={selectedOpId} onValueChange={setSelectedOpId}>
          <SelectTrigger className="glass border-border/30 w-64">
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Operations</SelectItem>
            {ops?.map((op: any) => (
              <SelectItem key={op.id} value={String(op.id)}>{op.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="glass border-border/30 overflow-hidden">
        <div className="h-[calc(100vh-220px)] min-h-[400px]">
          <SARMap
            centerLat={subject ? parseFloat(String(subject.lastKnownLat)) : 51.1}
            centerLng={subject ? parseFloat(String(subject.lastKnownLng)) : -119.3}
            zones={zones}
            sightings={sightings}
            teams={teams}
            lastKnownLat={subject ? parseFloat(String(subject.lastKnownLat)) : undefined}
            lastKnownLng={subject ? parseFloat(String(subject.lastKnownLng)) : undefined}
            boundaryGeoJson={opDetail?.boundaryGeoJson as any}
          />
        </div>
      </Card>

      {/* Legend */}
      <Card className="glass border-border/30">
        <CardContent className="p-3 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: "#d4a017", boxShadow: "0 0 6px #d4a01780" }} />
            <span className="text-muted-foreground">Last Known Position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: "#d4a017", opacity: 0.35 }} />
            <span className="text-muted-foreground">Primary Zone (50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: "#c4880f", opacity: 0.2 }} />
            <span className="text-muted-foreground">Secondary Zone (35%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: "#8b6914", opacity: 0.1 }} />
            <span className="text-muted-foreground">Tertiary Zone (15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Deployed Team</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: "#d4a017" }} />
            <span className="text-muted-foreground">Visual Sighting</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LiveMap() {
  return (
    <DashboardLayout>
      <LiveMapContent />
    </DashboardLayout>
  );
}
