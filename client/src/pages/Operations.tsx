import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Crosshair, Search, Activity, Plus } from "lucide-react";

function OperationsContent() {
  const [, setLocation] = useLocation();
  const { data: ops, isLoading } = trpc.operations.list.useQuery({});

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
    cold_case: "bg-cyan-500/20 text-cyan-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-amber">Active Operations</h1>
          <p className="text-muted-foreground text-sm mt-1">All search and rescue operations</p>
        </div>
        <Button onClick={() => setLocation("/operations/new")} className="gradient-amber text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> New Operation
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><Activity className="h-6 w-6 text-primary animate-spin" /></div>
      ) : !ops || ops.length === 0 ? (
        <Card className="glass border-border/30">
          <CardContent className="py-12 text-center">
            <Crosshair className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="font-medium">No operations found</p>
            <p className="text-sm text-muted-foreground mt-1">Launch your first search operation.</p>
            <Button onClick={() => setLocation("/operations/new")} className="mt-4 gradient-amber text-primary-foreground">
              <Search className="h-4 w-4 mr-2" /> Launch Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ops.map((op: any) => (
            <Card
              key={op.id}
              className="glass border-border/30 hover:amber-glow-sm transition-all cursor-pointer"
              onClick={() => setLocation(`/operations/${op.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Crosshair className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{op.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {op.environment} &middot; {new Date(op.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={priorityColors[op.priority] || ""}>{op.priority}</Badge>
                  <Badge variant="secondary" className={statusColors[op.status] || ""}>{op.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Operations() {
  return (
    <DashboardLayout>
      <OperationsContent />
    </DashboardLayout>
  );
}
