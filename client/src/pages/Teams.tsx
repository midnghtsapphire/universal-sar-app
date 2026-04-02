import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Plus, Activity } from "lucide-react";

function TeamsContent() {
  const [showForm, setShowForm] = useState(false);
  const { data: teams, isLoading, refetch } = trpc.teams.list.useQuery({});

  const [name, setName] = useState("");
  const [teamType, setTeamType] = useState("ground");
  const [memberCount, setMemberCount] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const createTeam = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Team created");
      setShowForm(false);
      setName(""); setTeamType("ground"); setMemberCount(""); setContactInfo("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const statusColors: Record<string, string> = {
    available: "bg-green-500/20 text-green-400",
    deployed: "bg-amber-500/20 text-amber-400",
    returning: "bg-cyan-500/20 text-cyan-400",
    off_duty: "bg-muted text-muted-foreground",
  };

  const typeIcons: Record<string, string> = {
    ground: "G", k9: "K9", aerial: "A", marine: "M",
    technical: "T", gpr: "GPR", drone: "D", mounted: "MT",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-amber">Search Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and deploy search teams</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gradient-amber text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Add Team</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/30">
            <DialogHeader><DialogTitle className="text-gradient-amber">Create Search Team</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-muted-foreground">Team Name *</Label>
                <Input className="glass border-border/30 mt-1" placeholder="e.g. Alpha Ground Team" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label className="text-muted-foreground">Team Type</Label>
                <Select value={teamType} onValueChange={setTeamType}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ground">Ground Search</SelectItem>
                    <SelectItem value="k9">K9 Unit</SelectItem>
                    <SelectItem value="aerial">Aerial / Helicopter</SelectItem>
                    <SelectItem value="marine">Marine / Water</SelectItem>
                    <SelectItem value="technical">Technical Rescue</SelectItem>
                    <SelectItem value="gpr">Ground Penetrating Radar</SelectItem>
                    <SelectItem value="drone">Drone / UAV</SelectItem>
                    <SelectItem value="mounted">Mounted / Horse</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label className="text-muted-foreground">Member Count</Label>
                <Input type="number" className="glass border-border/30 mt-1" placeholder="e.g. 6" value={memberCount} onChange={e => setMemberCount(e.target.value)} /></div>
              <div><Label className="text-muted-foreground">Contact Info</Label>
                <Input className="glass border-border/30 mt-1" placeholder="Radio channel, phone, etc." value={contactInfo} onChange={e => setContactInfo(e.target.value)} /></div>
              <Button onClick={() => {
                if (!name) { toast.error("Team name is required"); return; }
                createTeam.mutate({ name, teamType: teamType as any, memberCount: memberCount ? parseInt(memberCount) : undefined, contactInfo: contactInfo || undefined });
              }} disabled={createTeam.isPending} className="w-full gradient-amber text-primary-foreground">
                {createTeam.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><Activity className="h-6 w-6 text-primary animate-spin" /></div>
      ) : !teams || teams.length === 0 ? (
        <Card className="glass border-border/30">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="font-medium">No teams registered</p>
            <p className="text-sm text-muted-foreground mt-1">Add search teams to deploy them on operations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team: any) => (
            <Card key={team.id} className="glass border-border/30 hover:amber-glow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg gradient-amber flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {typeIcons[team.teamType] || "T"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{team.teamType}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={statusColors[team.status] || ""}>{team.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {team.memberCount && <p>Members: {team.memberCount}</p>}
                  {team.contactInfo && <p>Contact: {team.contactInfo}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Teams() {
  return (
    <DashboardLayout>
      <TeamsContent />
    </DashboardLayout>
  );
}
