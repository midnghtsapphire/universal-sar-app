import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, MapPin, Clock } from "lucide-react";

function SightingsContent() {
  const [selectedOp, setSelectedOp] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const { data: ops } = trpc.operations.list.useQuery({});

  const opId = selectedOp ? parseInt(selectedOp) : undefined;
  const { data: sightings, refetch } = trpc.sightings.getByOperation.useQuery(
    { operationId: opId! },
    { enabled: !!opId }
  );

  // Form state
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [confidence, setConfidence] = useState([5]);
  const [sightingType, setSightingType] = useState("visual");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");

  const createSighting = trpc.sightings.create.useMutation({
    onSuccess: () => {
      toast.success("Sighting reported! Bayesian probability zones updated.");
      setShowForm(false);
      setLat(""); setLng(""); setConfidence([5]); setDescription(""); setReporterName(""); setReporterContact("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!opId || !lat || !lng) { toast.error("Operation, latitude, and longitude are required"); return; }
    createSighting.mutate({
      operationId: opId,
      lat, lng,
      sightedAt: new Date(),
      sightingType: sightingType as any,
      confidence: confidence[0],
      description: description || undefined,
      reporterName: reporterName || undefined,
      reporterContact: reporterContact || undefined,
    });
  };

  const typeColors: Record<string, string> = {
    visual: "text-amber-400", auditory: "text-orange-400", physical_evidence: "text-green-400",
    electronic: "text-purple-400", scent: "text-orange-300", footprint: "text-cyan-400", other: "text-gray-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-amber">Sightings</h1>
          <p className="text-muted-foreground text-sm mt-1">Report and track subject sightings. Each sighting triggers Bayesian probability updates.</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gradient-amber text-primary-foreground" disabled={!opId}>
              <Plus className="h-4 w-4 mr-2" /> Report Sighting
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-gradient-amber">Report New Sighting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Latitude *</Label>
                  <Input type="number" step="any" placeholder="51.1637" className="glass border-border/30 mt-1" value={lat} onChange={e => setLat(e.target.value)} /></div>
                <div><Label className="text-muted-foreground">Longitude *</Label>
                  <Input type="number" step="any" placeholder="-119.886" className="glass border-border/30 mt-1" value={lng} onChange={e => setLng(e.target.value)} /></div>
              </div>
              <div><Label className="text-muted-foreground">Sighting Type</Label>
                <Select value={sightingType} onValueChange={setSightingType}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual</SelectItem>
                    <SelectItem value="auditory">Auditory</SelectItem>
                    <SelectItem value="physical_evidence">Physical Evidence</SelectItem>
                    <SelectItem value="electronic">Electronic Signal</SelectItem>
                    <SelectItem value="scent">Scent (K9)</SelectItem>
                    <SelectItem value="footprint">Footprint / Track</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select></div>
              <div>
                <Label className="text-muted-foreground">Confidence: {confidence[0]}/10</Label>
                <Slider value={confidence} onValueChange={setConfidence} min={1} max={10} step={1} className="mt-2" />
              </div>
              <div><Label className="text-muted-foreground">Description</Label>
                <Textarea placeholder="What did you see/hear/find?" className="glass border-border/30 mt-1" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Reporter Name</Label>
                  <Input className="glass border-border/30 mt-1" value={reporterName} onChange={e => setReporterName(e.target.value)} /></div>
                <div><Label className="text-muted-foreground">Contact</Label>
                  <Input className="glass border-border/30 mt-1" value={reporterContact} onChange={e => setReporterContact(e.target.value)} /></div>
              </div>
              <Button onClick={handleSubmit} disabled={createSighting.isPending} className="w-full gradient-amber text-primary-foreground">
                {createSighting.isPending ? "Submitting..." : "Submit Sighting Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Select value={selectedOp} onValueChange={setSelectedOp}>
        <SelectTrigger className="glass border-border/30 w-full max-w-sm">
          <SelectValue placeholder="Select an operation to view sightings" />
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
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="font-medium">Select an operation</p>
            <p className="text-sm text-muted-foreground mt-1">Choose an active operation to view or report sightings.</p>
          </CardContent>
        </Card>
      ) : !sightings || sightings.length === 0 ? (
        <Card className="glass border-border/30">
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="font-medium">No sightings reported</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Report Sighting" to add the first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sightings.map((s: any) => (
            <Card key={s.id} className="glass border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${typeColors[s.sightingType] ? "bg-current" : "bg-gray-400"}`} style={{ color: typeColors[s.sightingType]?.replace("text-", "") }} />
                  <div>
                    <p className="font-medium text-sm capitalize">{s.sightingType} sighting</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {s.lat}, {s.lng}
                      <span className="mx-1">&middot;</span>
                      <Clock className="h-3 w-3" /> {new Date(s.sightedAt).toLocaleString()}
                    </p>
                    {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">{s.confidence}/10</p>
                  <p className="text-xs text-muted-foreground">confidence</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sightings() {
  return (
    <DashboardLayout>
      <SightingsContent />
    </DashboardLayout>
  );
}
