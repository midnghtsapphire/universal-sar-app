import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Snowflake, AlertTriangle, Activity } from "lucide-react";

function SnowBridgeContent() {
  const [snowDepth, setSnowDepth] = useState("1.5");
  const [temperature, setTemperature] = useState("-5");
  const [gapWidth, setGapWidth] = useState("1.5");
  const [subjectWeight, setSubjectWeight] = useState("85");

  const { data: result, isLoading, refetch } = trpc.analytics.snowBridge.useQuery({
    snowDepth_m: parseFloat(snowDepth) || 1.5,
    temperature_c: parseFloat(temperature) || -5,
    gapWidth_m: parseFloat(gapWidth) || 1.5,
    subjectWeight_kg: parseFloat(subjectWeight) || 85,
  }, { enabled: false });

  const handleAnalyze = () => {
    refetch();
    toast.info("Running snow bridge structural analysis...");
  };

  const getRiskColor = (level: string) => {
    if (level === "low") return "text-green-400";
    if (level === "moderate") return "text-amber-400";
    if (level === "high") return "text-orange-400";
    return "text-red-400";
  };

  const getSafetyColor = (factor: number) => {
    if (factor >= 3) return "text-green-400";
    if (factor >= 2) return "text-amber-400";
    if (factor >= 1) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient-amber">Snow Bridge Forensic Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Structural analysis engine ported from Python forensic code. Based on Sun Peaks Feb 2018 case methodology.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-primary" /> Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Snow Depth (m)</Label>
                <Input type="number" step="0.1" className="glass border-border/30 mt-1" value={snowDepth} onChange={e => setSnowDepth(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Temperature (°C)</Label>
                <Input type="number" step="0.5" className="glass border-border/30 mt-1" value={temperature} onChange={e => setTemperature(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Gap Width (m)</Label>
                <Input type="number" step="0.1" className="glass border-border/30 mt-1" value={gapWidth} onChange={e => setGapWidth(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Subject Weight (kg)</Label>
                <Input type="number" step="5" className="glass border-border/30 mt-1" value={subjectWeight} onChange={e => setSubjectWeight(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleAnalyze} className="w-full gradient-amber text-primary-foreground font-semibold">
              {isLoading ? <><Activity className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Shield className="h-4 w-4 mr-2" /> Run Structural Analysis</>}
            </Button>
            <p className="text-xs text-muted-foreground">
              Erosion factor of 35% is applied automatically (creek water erodes underside). Foot contact width defaults to 0.3m.
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" /> Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Enter parameters and run analysis</p>
                <p className="text-sm mt-1">Results will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Safety Factor */}
                <div className="glass-subtle rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Safety Factor</p>
                  <p className={`text-4xl font-bold ${getSafetyColor(result.safetyFactor)}`}>
                    {result.safetyFactor.toFixed(2)}
                  </p>
                  <p className={`text-sm font-medium mt-1 ${result.willCollapse ? "text-red-400" : "text-green-400"}`}>
                    {result.willCollapse ? "WILL COLLAPSE — DO NOT CROSS" : "STRUCTURALLY SOUND"}
                  </p>
                </div>

                {/* Risk Level */}
                <div className="glass-subtle rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                  <p className={`text-2xl font-bold uppercase ${getRiskColor(result.riskLevel)}`}>
                    {result.riskLevel}
                  </p>
                </div>

                {/* Detailed Results */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/10">
                    <span className="text-muted-foreground">Bridge Thickness (after erosion)</span>
                    <span className="font-medium">{result.bridgeThickness_m.toFixed(3)} m</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/10">
                    <span className="text-muted-foreground">Tensile Strength</span>
                    <span className="font-medium">{result.tensileStrength_Pa.toLocaleString()} Pa</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/10">
                    <span className="text-muted-foreground">Max Load (theoretical)</span>
                    <span className="font-medium">{result.maxLoad_kg.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Effective Capacity (with safety margin)</span>
                    <span className="font-medium">{result.effectiveCapacity_kg.toFixed(1)} kg</span>
                  </div>
                </div>

                {/* Details */}
                <div className="glass-subtle rounded-lg p-3">
                  <p className="text-xs font-medium text-primary mb-1">Analysis Details</p>
                  <p className="text-xs text-muted-foreground">{result.details}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Methodology Note */}
      <Card className="glass border-border/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-primary">Methodology:</strong> This analysis uses beam theory for snow bridges, incorporating
            temperature-dependent snow cohesion (tensile strength), creek erosion factors (35% structural integrity),
            and foot contact width calculations. Based on forensic analysis code developed for the Sun Peaks February 2018 case.
            Safety factor ≥ 2.0 is recommended for human crossing. A "will collapse" determination means effective capacity
            is below 120% of subject weight. All Rights Reserved 2010-2026 Freedom Angel Corp / Audrey Evans.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SnowBridge() {
  return (
    <DashboardLayout>
      <SnowBridgeContent />
    </DashboardLayout>
  );
}
