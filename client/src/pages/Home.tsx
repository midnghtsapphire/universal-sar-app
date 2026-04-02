import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Crosshair, Search, Users, MapPin, AlertTriangle,
  ArrowRight, Activity, Shield, Clock
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ icon: Icon, label, value, color = "text-primary" }: {
  icon: any; label: string; value: string | number; color?: string;
}) {
  return (
    <Card className="glass border-border/30 hover:amber-glow-sm transition-all duration-300">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CommandCenterContent() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.analytics.stats.useQuery();
  const { data: recentOps } = trpc.operations.list.useQuery({ limit: 5 });

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    planning: "bg-amber-500/20 text-amber-400",
    suspended: "bg-orange-500/20 text-orange-400",
    closed: "bg-muted text-muted-foreground",
    cold_case: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient-amber">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Universal Search & Rescue Operations</p>
        </div>
        <Button
          onClick={() => setLocation("/operations/new")}
          className="gradient-amber text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Search className="h-4 w-4 mr-2" />
          Launch New Search
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Crosshair} label="Total Operations" value={stats?.total ?? 0} />
        <StatCard icon={Activity} label="Active Searches" value={stats?.active ?? 0} color="text-green-400" />
        <StatCard icon={MapPin} label="Subjects Tracked" value={stats?.subjects ?? 0} color="text-amber-400" />
        <StatCard icon={Users} label="Search Teams" value={stats?.teams ?? 0} color="text-purple-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-border/30 hover:amber-glow-sm transition-all duration-300 cursor-pointer" onClick={() => setLocation("/operations/new")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg gradient-amber flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Missing Person</p>
              <p className="text-xs text-muted-foreground">Launch human SAR operation</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </CardContent>
        </Card>
        <Card className="glass border-border/30 hover:amber-glow-sm transition-all duration-300 cursor-pointer" onClick={() => setLocation("/operations/new")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Lost Animal</p>
              <p className="text-xs text-muted-foreground">Track missing pet or wildlife</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </CardContent>
        </Card>
        <Card className="glass border-border/30 hover:amber-glow-sm transition-all duration-300 cursor-pointer" onClick={() => setLocation("/snow-bridge")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Snow Bridge Analysis</p>
              <p className="text-xs text-muted-foreground">Forensic structural analysis</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card className="glass border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentOps || recentOps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Crosshair className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No operations yet</p>
              <p className="text-sm mt-1">Launch your first search operation to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOps.map((op: any) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/operations/${op.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{op.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {op.environment} &middot; {new Date(op.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={priorityColors[op.priority] || ""}>
                      {op.priority}
                    </Badge>
                    <Badge variant="secondary" className={statusColors[op.status] || ""}>
                      {op.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/20">
        <p>All Rights Reserved 2010-2026 Freedom Angel Corp / Audrey Evans</p>
        <p className="mt-1">FOSS-First: OpenStreetMap, Leaflet.js, Open-Meteo, Turf.js, PostGIS</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DashboardLayout>
      <CommandCenterContent />
    </DashboardLayout>
  );
}
