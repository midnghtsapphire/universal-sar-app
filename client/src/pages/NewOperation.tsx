import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Crosshair, MapPin, ArrowLeft, ArrowRight, Check, Thermometer, Radar } from "lucide-react";

const SUBJECT_SUBTYPES: Record<string, { label: string; value: string }[]> = {
  human: [
    { label: "Missing Person (General)", value: "missing_person" },
    { label: "Child (under 12)", value: "child" },
    { label: "Hiker / Backpacker", value: "hiker" },
    { label: "Elderly / Dementia", value: "elderly" },
    { label: "Alzheimer's Patient", value: "alzheimers" },
    { label: "Autistic Individual", value: "autistic" },
    { label: "Despondent / Suicidal", value: "despondent" },
    { label: "Hunter", value: "hunter" },
    { label: "Skier / Snowboarder", value: "snowboarder" },
    { label: "Fugitive", value: "fugitive" },
    { label: "Climber / Mountaineer", value: "climber" },
  ],
  animal: [
    { label: "Dog", value: "dog" },
    { label: "Cat", value: "cat" },
    { label: "Horse", value: "horse" },
    { label: "Wildlife", value: "wildlife" },
    { label: "Other Animal", value: "other" },
  ],
  vehicle: [
    { label: "Car / Sedan", value: "car" },
    { label: "Truck / SUV", value: "truck" },
    { label: "Boat / Watercraft", value: "boat" },
    { label: "Aircraft", value: "aircraft" },
    { label: "ATV / Snowmobile", value: "atv" },
  ],
  object: [
    { label: "Equipment / Gear", value: "equipment" },
    { label: "Evidence", value: "evidence_item" },
    { label: "Wreckage", value: "wreckage" },
    { label: "Other Object", value: "other" },
  ],
};

function HumanAttributes({ attrs, setAttrs }: { attrs: any; setAttrs: (a: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label className="text-muted-foreground">Age</Label>
        <Input type="number" placeholder="e.g. 35" className="glass border-border/30 mt-1" value={attrs.age || ""} onChange={e => setAttrs({ ...attrs, age: parseInt(e.target.value) || undefined })} /></div>
      <div><Label className="text-muted-foreground">Gender</Label>
        <Select value={attrs.gender || ""} onValueChange={v => setAttrs({ ...attrs, gender: v })}>
          <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
        </Select></div>
      <div><Label className="text-muted-foreground">Height (cm)</Label>
        <Input type="number" placeholder="e.g. 175" className="glass border-border/30 mt-1" value={attrs.height_cm || ""} onChange={e => setAttrs({ ...attrs, height_cm: parseInt(e.target.value) || undefined })} /></div>
      <div><Label className="text-muted-foreground">Weight (kg)</Label>
        <Input type="number" placeholder="e.g. 70" className="glass border-border/30 mt-1" value={attrs.weight_kg || ""} onChange={e => setAttrs({ ...attrs, weight_kg: parseInt(e.target.value) || undefined })} /></div>
      <div><Label className="text-muted-foreground">Fitness Level</Label>
        <Select value={attrs.fitness_level || ""} onValueChange={v => setAttrs({ ...attrs, fitness_level: v })}>
          <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent><SelectItem value="excellent">Excellent</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="average">Average</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent>
        </Select></div>
      <div><Label className="text-muted-foreground">Experience Level</Label>
        <Select value={attrs.experience_level || ""} onValueChange={v => setAttrs({ ...attrs, experience_level: v })}>
          <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent><SelectItem value="expert">Expert</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="novice">Novice</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
        </Select></div>
      <div className="sm:col-span-2"><Label className="text-muted-foreground">Clothing Description</Label>
        <Input placeholder="e.g. Red jacket, blue jeans, hiking boots" className="glass border-border/30 mt-1" value={attrs.clothing || ""} onChange={e => setAttrs({ ...attrs, clothing: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label className="text-muted-foreground">Medical Conditions</Label>
        <Input placeholder="e.g. Diabetes, heart condition" className="glass border-border/30 mt-1" value={attrs.medical_conditions || ""} onChange={e => setAttrs({ ...attrs, medical_conditions: e.target.value })} /></div>
    </div>
  );
}

function AnimalAttributes({ attrs, setAttrs }: { attrs: any; setAttrs: (a: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label className="text-muted-foreground">Breed</Label>
        <Input placeholder="e.g. Golden Retriever" className="glass border-border/30 mt-1" value={attrs.breed || ""} onChange={e => setAttrs({ ...attrs, breed: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Color / Markings</Label>
        <Input placeholder="e.g. Golden, white chest" className="glass border-border/30 mt-1" value={attrs.color || ""} onChange={e => setAttrs({ ...attrs, color: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Weight (kg)</Label>
        <Input type="number" placeholder="e.g. 30" className="glass border-border/30 mt-1" value={attrs.weight_kg || ""} onChange={e => setAttrs({ ...attrs, weight_kg: parseInt(e.target.value) || undefined })} /></div>
      <div><Label className="text-muted-foreground">Training Level</Label>
        <Select value={attrs.training_level || ""} onValueChange={v => setAttrs({ ...attrs, training_level: v })}>
          <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent><SelectItem value="service">Service Animal</SelectItem><SelectItem value="advanced">Advanced</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
        </Select></div>
      <div><Label className="text-muted-foreground">Temperament</Label>
        <Select value={attrs.temperament || ""} onValueChange={v => setAttrs({ ...attrs, temperament: v })}>
          <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="fearful">Fearful</SelectItem><SelectItem value="aggressive">Aggressive</SelectItem><SelectItem value="calm">Calm</SelectItem></SelectContent>
        </Select></div>
      <div><Label className="text-muted-foreground">Collar / Tags</Label>
        <Input placeholder="e.g. Red collar, ID tag #12345" className="glass border-border/30 mt-1" value={attrs.collar || ""} onChange={e => setAttrs({ ...attrs, collar: e.target.value })} /></div>
    </div>
  );
}

function VehicleAttributes({ attrs, setAttrs }: { attrs: any; setAttrs: (a: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label className="text-muted-foreground">Make</Label>
        <Input placeholder="e.g. Toyota" className="glass border-border/30 mt-1" value={attrs.make || ""} onChange={e => setAttrs({ ...attrs, make: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Model</Label>
        <Input placeholder="e.g. 4Runner" className="glass border-border/30 mt-1" value={attrs.model || ""} onChange={e => setAttrs({ ...attrs, model: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Year</Label>
        <Input type="number" placeholder="e.g. 2020" className="glass border-border/30 mt-1" value={attrs.year || ""} onChange={e => setAttrs({ ...attrs, year: parseInt(e.target.value) || undefined })} /></div>
      <div><Label className="text-muted-foreground">Color</Label>
        <Input placeholder="e.g. White" className="glass border-border/30 mt-1" value={attrs.color || ""} onChange={e => setAttrs({ ...attrs, color: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">License Plate</Label>
        <Input placeholder="e.g. ABC 1234" className="glass border-border/30 mt-1" value={attrs.license_plate || ""} onChange={e => setAttrs({ ...attrs, license_plate: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Fuel Range (km)</Label>
        <Input type="number" placeholder="e.g. 500" className="glass border-border/30 mt-1" value={attrs.range_km || ""} onChange={e => setAttrs({ ...attrs, range_km: parseInt(e.target.value) || undefined })} /></div>
    </div>
  );
}

function ObjectAttributes({ attrs, setAttrs }: { attrs: any; setAttrs: (a: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label className="text-muted-foreground">Object Type</Label>
        <Input placeholder="e.g. Backpack, GPS device" className="glass border-border/30 mt-1" value={attrs.object_type || ""} onChange={e => setAttrs({ ...attrs, object_type: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Color</Label>
        <Input placeholder="e.g. Red" className="glass border-border/30 mt-1" value={attrs.color || ""} onChange={e => setAttrs({ ...attrs, color: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Size</Label>
        <Input placeholder="e.g. 60cm x 40cm" className="glass border-border/30 mt-1" value={attrs.size || ""} onChange={e => setAttrs({ ...attrs, size: e.target.value })} /></div>
      <div><Label className="text-muted-foreground">Serial Number</Label>
        <Input placeholder="e.g. SN-12345" className="glass border-border/30 mt-1" value={attrs.serial_number || ""} onChange={e => setAttrs({ ...attrs, serial_number: e.target.value })} /></div>
    </div>
  );
}

function NewOperationContent() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  // Operation fields
  const [opName, setOpName] = useState("");
  const [priority, setPriority] = useState("medium");
  const [environment, setEnvironment] = useState("wilderness");
  const [notes, setNotes] = useState("");

  // Subject fields
  const [subjectType, setSubjectType] = useState("human");
  const [subjectSubtype, setSubjectSubtype] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [lastKnownLat, setLastKnownLat] = useState("");
  const [lastKnownLng, setLastKnownLng] = useState("");
  const [circumstances, setCircumstances] = useState("");
  const [attrs, setAttrs] = useState<any>({});

  // Terrain analysis fields
  const [temperatureC, setTemperatureC] = useState("");
  const [searchRadiusM, setSearchRadiusM] = useState("500");

  const subtypes = useMemo(() => SUBJECT_SUBTYPES[subjectType] || [], [subjectType]);

  const createOp = trpc.operations.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Search operation launched! SAR analysis + terrain analysis running...");
      setLocation(`/operations/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create operation");
    },
  });

  const handleSubmit = useCallback(() => {
    if (!opName || !subjectName || !lastKnownLat || !lastKnownLng) {
      toast.error("Please fill in all required fields");
      return;
    }
    createOp.mutate({
      name: opName,
      priority: priority as any,
      environment: environment as any,
      centerLat: lastKnownLat,
      centerLng: lastKnownLng,
      notes,
      temperatureC: temperatureC ? parseFloat(temperatureC) : undefined,
      searchRadiusM: searchRadiusM ? parseInt(searchRadiusM) : 500,
      subject: {
        subjectType: subjectType as any,
        subjectSubtype: subjectSubtype || undefined,
        name: subjectName,
        description: subjectDesc || undefined,
        lastKnownLat,
        lastKnownLng,
        lastSeenAt: new Date(),
        circumstances: circumstances || undefined,
        attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
      },
    });
  }, [opName, subjectName, lastKnownLat, lastKnownLng, priority, environment, notes, subjectType, subjectSubtype, subjectDesc, circumstances, attrs, temperatureC, searchRadiusM, createOp]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gradient-amber">Launch Search Operation</h1>
          <p className="text-muted-foreground text-sm">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "gradient-amber" : "bg-muted"}`} />
        ))}
      </div>

      {/* Step 1: Operation Details */}
      {step === 1 && (
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crosshair className="h-5 w-5 text-primary" /> Operation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-muted-foreground">Operation Name *</Label>
              <Input placeholder="e.g. Sun Peaks Missing Hiker - Feb 2018" className="glass border-border/30 mt-1" value={opName} onChange={e => setOpName(e.target.value)} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                </Select></div>
              <div><Label className="text-muted-foreground">Environment</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="wilderness">Wilderness</SelectItem><SelectItem value="urban">Urban</SelectItem><SelectItem value="suburban">Suburban</SelectItem><SelectItem value="mountain">Mountain</SelectItem><SelectItem value="maritime">Maritime</SelectItem><SelectItem value="desert">Desert</SelectItem><SelectItem value="arctic">Arctic</SelectItem></SelectContent>
                </Select></div>
            </div>
            <div><Label className="text-muted-foreground">Notes</Label>
              <Textarea placeholder="Additional context, reporting party info, etc." className="glass border-border/30 mt-1" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div className="flex justify-end">
              <Button onClick={() => { if (!opName) { toast.error("Operation name is required"); return; } setStep(2); }} className="gradient-amber text-primary-foreground">
                Next: Subject Details <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Subject Details */}
      {step === 2 && (
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Subject Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">Subject Type *</Label>
                <Select value={subjectType} onValueChange={v => { setSubjectType(v); setSubjectSubtype(""); setAttrs({}); }}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="human">Human</SelectItem><SelectItem value="animal">Animal</SelectItem><SelectItem value="vehicle">Vehicle</SelectItem><SelectItem value="object">Object</SelectItem></SelectContent>
                </Select></div>
              <div><Label className="text-muted-foreground">Category</Label>
                <Select value={subjectSubtype} onValueChange={setSubjectSubtype}>
                  <SelectTrigger className="glass border-border/30 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{subtypes.map(st => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div><Label className="text-muted-foreground">Name / Identifier *</Label>
              <Input placeholder={subjectType === "vehicle" ? "e.g. 2020 White Toyota 4Runner" : "e.g. John Doe"} className="glass border-border/30 mt-1" value={subjectName} onChange={e => setSubjectName(e.target.value)} /></div>
            <div><Label className="text-muted-foreground">Description</Label>
              <Textarea placeholder="Physical description, distinguishing features..." className="glass border-border/30 mt-1" rows={2} value={subjectDesc} onChange={e => setSubjectDesc(e.target.value)} /></div>

            {/* Type-specific attributes */}
            <div className="border-t border-border/20 pt-4">
              <p className="text-sm font-medium text-primary mb-3">
                {subjectType === "human" ? "Human" : subjectType === "animal" ? "Animal" : subjectType === "vehicle" ? "Vehicle" : "Object"} Attributes
              </p>
              {subjectType === "human" && <HumanAttributes attrs={attrs} setAttrs={setAttrs} />}
              {subjectType === "animal" && <AnimalAttributes attrs={attrs} setAttrs={setAttrs} />}
              {subjectType === "vehicle" && <VehicleAttributes attrs={attrs} setAttrs={setAttrs} />}
              {subjectType === "object" && <ObjectAttributes attrs={attrs} setAttrs={setAttrs} />}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button onClick={() => { if (!subjectName) { toast.error("Subject name is required"); return; } setStep(3); }} className="gradient-amber text-primary-foreground">
                Next: Location <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location, Terrain Parameters & Launch */}
      {step === 3 && (
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Last Known Position &amp; Launch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">Latitude *</Label>
                <Input type="number" step="any" placeholder="e.g. 50.8812" className="glass border-border/30 mt-1" value={lastKnownLat} onChange={e => setLastKnownLat(e.target.value)} /></div>
              <div><Label className="text-muted-foreground">Longitude *</Label>
                <Input type="number" step="any" placeholder="e.g. -119.8925" className="glass border-border/30 mt-1" value={lastKnownLng} onChange={e => setLastKnownLng(e.target.value)} /></div>
            </div>

            {/* Terrain Analysis Parameters */}
            <div className="border-t border-border/20 pt-4">
              <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <Radar className="h-4 w-4" /> Terrain Analysis Parameters
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                These parameters drive the real terrain analysis engine (OpenTopoData elevation, Overpass OSM features, GPR protocol generation).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> Temperature at Scene (&deg;C)
                  </Label>
                  <Input type="number" step="any" placeholder="e.g. -26 (affects GPR protocol)" className="glass border-border/30 mt-1" value={temperatureC} onChange={e => setTemperatureC(e.target.value)} />
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Radar className="h-3 w-3" /> Search Radius (meters)
                  </Label>
                  <Input type="number" placeholder="e.g. 500" className="glass border-border/30 mt-1" value={searchRadiusM} onChange={e => setSearchRadiusM(e.target.value)} />
                </div>
              </div>
            </div>

            <div><Label className="text-muted-foreground">Circumstances of Disappearance</Label>
              <Textarea placeholder="What happened? Last known activity, direction of travel, companions..." className="glass border-border/30 mt-1" rows={3} value={circumstances} onChange={e => setCircumstances(e.target.value)} /></div>

            {/* Summary */}
            <div className="glass-subtle rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-primary">Operation Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Operation:</span><span>{opName}</span>
                <span className="text-muted-foreground">Priority:</span><span className="capitalize">{priority}</span>
                <span className="text-muted-foreground">Environment:</span><span className="capitalize">{environment}</span>
                <span className="text-muted-foreground">Subject:</span><span>{subjectName}</span>
                <span className="text-muted-foreground">Type:</span><span className="capitalize">{subjectType} / {subjectSubtype || "general"}</span>
                <span className="text-muted-foreground">LKP:</span><span>{lastKnownLat || "\u2014"}, {lastKnownLng || "\u2014"}</span>
                <span className="text-muted-foreground">Temperature:</span><span>{temperatureC ? `${temperatureC}\u00B0C` : "Auto (Open-Meteo)"}</span>
                <span className="text-muted-foreground">Terrain Radius:</span><span>{searchRadiusM || "500"}m</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                On launch: SAR probability analysis runs immediately. Terrain analysis (real elevation + OSM data) runs in background and updates within 30-60 seconds.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={createOp.isPending}
                className="gradient-amber text-primary-foreground font-semibold shadow-lg hover:shadow-xl"
              >
                {createOp.isPending ? "Launching..." : <><Check className="h-4 w-4 mr-2" /> Launch Search Operation</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NewOperation() {
  return (
    <DashboardLayout>
      <NewOperationContent />
    </DashboardLayout>
  );
}
