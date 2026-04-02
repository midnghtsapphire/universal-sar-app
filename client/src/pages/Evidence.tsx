import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, FileText, Camera, Fingerprint, Cpu, Clock } from "lucide-react";

function EvidenceContent() {
  const [selectedOp, setSelectedOp] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const { data: ops } = trpc.operations.list.useQuery({});

  const opId = selectedOp ? parseInt(selectedOp) : undefined;
  const { data: evidenceList, refetch } = trpc.evidence.getByOperation.useQuery(
    { operationId: opId! },
    { enabled: !!opId }
  );

  const [title, setTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState("photo");
  const [description, setDescription] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const createEvidence = trpc.evidence.create.useMutation({
    onSuccess: () => {
      toast.success("Evidence cataloged");
      setShowForm(false);
      setTitle(""); setDescription(""); setCollectedBy(""); setLat(""); setLng("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const typeIcons: Record<string, any> = {
    photo: Camera, document: FileText, physical: Fingerprint,
    digital: Cpu, forensic: Fingerprint, sensor_data: Cpu,
    video: Camera, audio: Camera,
  };

  const typeColors: Record<string, string> = {
    photo: "bg-amber-500/20 text-amber-400",
    document: "bg-cyan-500/20 text-cyan-400",
    physical: "bg-green-500/20 text-green-400",
    digital: "bg-purple-500/20 text-purple-400",
    forensic: "bg-red-500/20 text-red-400",
    sensor_data: "bg-orange-500/20 text-orange-400",
    video: "bg-pink-500/20 text-pink-400",
    audio: "bg-indigo-500/20 text-indigo-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-amber">Evidence Catalog</h1>
          <p className="text-muted-foreground text-sm mt-1">Secure storage and cataloging of all evidence</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gradient-amber text-primary-foreground" disabled={!opId}>
              <Plus className="h-4 w-4 mr-2" /> Log Evidence
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/30 max-w-lg">
            <DialogHeader><DialogTitle className="text-gradient-amber">Log New Evidence</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-muted-foreground">Title *</Label>
                <Input className="glass border-border/30 mt-1" placeholder="e.g. Footprint near creek" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><Label className="text-muted-foreground">Evidence Type</Label>
                <Select value={evidenceType} onValueChange={setEvidenceType}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="physical">Physical Evidence</SelectItem>
                    <SelectItem value="digital">Digital Evidence</SelectItem>
                    <SelectItem value="forensic">Forensic</SelectItem>
                    <SelectItem value="sensor_data">Sensor Data</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label className="text-muted-foreground">Description</Label>
                <Textarea className="glass border-border/30 mt-1" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Latitude</Label>
                  <Input type="number" step="any" className="glass border-border/30 mt-1" value={lat} onChange={e => setLat(e.target.value)} /></div>
                <div><Label className="text-muted-foreground">Longitude</Label>
                  <Input type="number" step="any" className="glass border-border/30 mt-1" value={lng} onChange={e => setLng(e.target.value)} /></div>
              </div>
              <div><Label className="text-muted-foreground">Collected By</Label>
                <Input className="glass border-border/30 mt-1" value={collectedBy} onChange={e => setCollectedBy(e.target.value)} /></div>
              <Button onClick={() => {
                if (!opId || !title) { toast.error("Operation and title are required"); return; }
                createEvidence.mutate({
                  operationId: opId, title, evidenceType: evidenceType as any,
                  description: description || undefined, collectedBy: collectedBy || undefined,
                  lat: lat || undefined, lng: lng || undefined, collectedAt: new Date(),
                });
              }} disabled={createEvidence.isPending} className="w-full gradient-amber text-primary-foreground">
                {createEvidence.isPending ? "Saving..." : "Catalog Evidence"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Select value={selectedOp} onValueChange={setSelectedOp}>
        <SelectTrigger className="glass border-border/30 w-full max-w-sm">
          <SelectValue placeholder="Select an operation" />
        </SelectTrigger>
        <SelectContent>
          {ops?.map((op: any) => (
            <SelectItem key={op.id} value={String(op.id)}>{op.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!opId ? (
        <Card className="glass border-border/30">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="font-medium">Select an operation</p>
          </CardContent>
        </Card>
      ) : !evidenceList || evidenceList.length === 0 ? (
        <Card className="glass border-border/30">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="font-medium">No evidence cataloged</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evidenceList.map((ev: any) => {
            const Icon = typeIcons[ev.evidenceType] || FileText;
            return (
              <Card key={ev.id} className="glass border-border/30 hover:amber-glow-sm transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${typeColors[ev.evidenceType] || "bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.description || "No description"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {new Date(ev.createdAt).toLocaleString()}
                      {ev.collectedBy && <span>&middot; By: {ev.collectedBy}</span>}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize shrink-0">{ev.evidenceType}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Evidence() {
  return (
    <DashboardLayout>
      <EvidenceContent />
    </DashboardLayout>
  );
}
