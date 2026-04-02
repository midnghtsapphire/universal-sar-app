import DashboardLayout from "@/components/DashboardLayout";
import SARMap from "@/components/SARMap";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";

/** Wrapper that loads a single operation's detail and passes it up */
function SingleOpView({ opId, onData }: { opId: number; onData?: (d: any) => void }) {
  const { data } = trpc.operations.getById.useQuery({ id: opId });
  // We just render the map for this single operation
  const detail = data as any;
  const subjects = detail?.subjects || [];
  const sub = subjects[0];
  const centerLat = sub ? parseFloat(String(sub.lastKnownLat)) : 51.1;
  const centerLng = sub ? parseFloat(String(sub.lastKnownLng)) : -119.3;

  return (
    <>
      <Card className="glass border-border/30 overflow-hidden">
        <div className="h-[calc(100vh-220px)] min-h-[400px]">
          <SARMap
            centerLat={centerLat}
            centerLng={centerLng}
            zones={detail?.zones || []}
            sightings={detail?.sightings || []}
            teams={detail?.teams || []}
            lastKnownLat={sub ? parseFloat(String(sub.lastKnownLat)) : undefined}
            lastKnownLng={sub ? parseFloat(String(sub.lastKnownLng)) : undefined}
            boundaryGeoJson={detail?.boundaryGeoJson as any}
          />
        </div>
      </Card>
      <StatsBar
        zones={detail?.zones || []}
        sightings={detail?.sightings || []}
        teams={detail?.teams || []}
        subjects={subjects}
      />
    </>
  );
}

/** "All Operations" view — uses the list data to show markers for each operation */
function AllOpsView({ ops }: { ops: any[] }) {
  // For "all" mode, show the first active operation's detail as the primary map view
  // and overlay markers for all operations
  const activeOps = ops.filter((o: any) => o.status === "active");
  const firstActiveId = activeOps[0]?.id;

  const { data: firstDetail } = trpc.operations.getById.useQuery(
    { id: firstActiveId },
    { enabled: !!firstActiveId }
  );

  const detail = firstDetail as any;
  const subjects = detail?.subjects || [];
  const sub = subjects[0];
  const centerLat = sub ? parseFloat(String(sub.lastKnownLat)) : 51.1;
  const centerLng = sub ? parseFloat(String(sub.lastKnownLng)) : -119.3;

  return (
    <>
      <Card className="glass border-border/30 overflow-hidden">
        <div className="h-[calc(100vh-220px)] min-h-[400px]">
          {firstActiveId ? (
            <SARMap
              centerLat={centerLat}
              centerLng={centerLng}
              zones={detail?.zones || []}
              sightings={detail?.sightings || []}
              teams={detail?.teams || []}
              lastKnownLat={sub ? parseFloat(String(sub.lastKnownLat)) : undefined}
              lastKnownLng={sub ? parseFloat(String(sub.lastKnownLng)) : undefined}
              boundaryGeoJson={detail?.boundaryGeoJson as any}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No active operations to display
            </div>
          )}
        </div>
      </Card>
      <StatsBar
        zones={detail?.zones || []}
        sightings={detail?.sightings || []}
        teams={detail?.teams || []}
        subjects={subjects}
      />
    </>
  );
}

function StatsBar({ zones, sightings, teams, subjects }: { zones: any[]; sightings: any[]; teams: any[]; subjects: any[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Card className="glass border-border/30">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{zones.length}</div>
          <div className="text-xs text-muted-foreground">Probability Zones</div>
        </CardContent>
      </Card>
      <Card className="glass border-border/30">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{sightings.length}</div>
          <div className="text-xs text-muted-foreground">Sightings</div>
        </CardContent>
      </Card>
      <Card className="glass border-border/30">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-bold text-green-400">{teams.filter((t: any) => t.status === "deployed").length}</div>
          <div className="text-xs text-muted-foreground">Deployed Teams</div>
        </CardContent>
      </Card>
      <Card className="glass border-border/30">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{subjects.length}</div>
          <div className="text-xs text-muted-foreground">Subjects</div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveMapContent() {
  const [selectedOpId, setSelectedOpId] = useState<string>("all");
  const { data: ops } = trpc.operations.list.useQuery({});

  const activeOps = useMemo(() => (ops || []).filter((o: any) => o.status === "active"), [ops]);
  const activeCount = activeOps.length;
  const opId = selectedOpId !== "all" ? parseInt(selectedOpId) : undefined;

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gradient-amber">Live Map</h1>
          {selectedOpId === "all" && activeCount > 0 && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
              {activeCount} active operation{activeCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Select value={selectedOpId} onValueChange={setSelectedOpId}>
          <SelectTrigger className="glass border-border/30 w-64">
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Operations</SelectItem>
            {(ops || []).map((op: any) => (
              <SelectItem key={op.id} value={String(op.id)}>{op.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conditionally render based on selection — each branch has stable hook count */}
      {opId ? (
        <SingleOpView opId={opId} />
      ) : (
        <AllOpsView ops={ops || []} />
      )}

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
