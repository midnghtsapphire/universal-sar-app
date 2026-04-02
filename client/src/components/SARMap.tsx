import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ProbabilityZone {
  zoneName: string;
  zoneType: string;
  probability: number | string;
  geoJson: any;
  centerLat: number | string;
  centerLng: number | string;
}

interface SightingMarker {
  lat: number | string;
  lng: number | string;
  sightingType: string;
  confidence: number;
  description?: string | null;
  sightedAt: Date | string;
}

interface TeamMarker {
  name: string;
  currentLat?: number | string | null;
  currentLng?: number | string | null;
  status: string;
  teamType: string;
}

interface SARMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  zones?: ProbabilityZone[];
  sightings?: SightingMarker[];
  teams?: TeamMarker[];
  lastKnownLat?: number;
  lastKnownLng?: number;
  boundaryGeoJson?: any;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const ZONE_COLORS: Record<string, string> = {
  primary: "#d4a017",
  secondary: "#c4880f",
  tertiary: "#8b6914",
};

const ZONE_OPACITY: Record<string, number> = {
  primary: 0.35,
  secondary: 0.2,
  tertiary: 0.1,
};

function createSightingIcon(type: string): L.DivIcon {
  const colors: Record<string, string> = {
    visual: "#d4a017",
    auditory: "#c4880f",
    physical_evidence: "#22c55e",
    electronic: "#8b5cf6",
    scent: "#f97316",
    footprint: "#06b6d4",
    other: "#94a3b8",
  };
  const color = colors[type] || colors.other;
  return L.divIcon({
    className: "custom-sighting-icon",
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 0 8px ${color}80;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createTeamIcon(type: string, status: string): L.DivIcon {
  const isDeployed = status === "deployed";
  const color = isDeployed ? "#22c55e" : "#94a3b8";
  const icons: Record<string, string> = {
    ground: "G", k9: "K9", aerial: "A", marine: "M",
    technical: "T", gpr: "GPR", drone: "D", mounted: "MT",
  };
  const label = icons[type] || "T";
  return L.divIcon({
    className: "custom-team-icon",
    html: `<div style="background:${color};color:white;font-size:10px;font-weight:bold;padding:2px 5px;border-radius:4px;border:1px solid white;white-space:nowrap;box-shadow:0 0 6px ${color}60;">${label}</div>`,
    iconSize: [30, 20],
    iconAnchor: [15, 10],
  });
}

function createLKPIcon(): L.DivIcon {
  return L.divIcon({
    className: "custom-lkp-icon",
    html: `<div style="width:20px;height:20px;background:#d4a017;border:3px solid white;border-radius:50%;box-shadow:0 0 15px #d4a01780, 0 0 30px #d4a01740;animation:pulse 2s infinite;"></div>
    <style>@keyframes pulse{0%,100%{box-shadow:0 0 15px #d4a01780,0 0 30px #d4a01740}50%{box-shadow:0 0 25px #d4a017a0,0 0 50px #d4a01760}}</style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function SARMap({
  centerLat = 51.1,
  centerLng = -119.3,
  zoom = 10,
  zones = [],
  sightings = [],
  teams = [],
  lastKnownLat,
  lastKnownLng,
  boundaryGeoJson,
  onMapClick,
  className = "h-full w-full",
}: SARMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Optional satellite layer
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri", maxZoom: 19 }
    );

    const topo = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      { attribution: "OpenTopoMap", maxZoom: 17 }
    );

    L.control.layers(
      { "Dark": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }), "Satellite": satellite, "Topographic": topo },
      {},
      { position: "topright" }
    ).addTo(map);

    layersRef.current.addTo(map);

    if (onMapClick) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    const group = layersRef.current;
    group.clearLayers();

    // Boundary
    if (boundaryGeoJson) {
      L.geoJSON(boundaryGeoJson, {
        style: {
          color: "#d4a017",
          weight: 2,
          dashArray: "8,4",
          fillOpacity: 0.03,
          fillColor: "#d4a017",
        },
      }).addTo(group);
    }

    // Probability zones (render tertiary first, primary last so it's on top)
    const sortedZones = [...zones].sort((a, b) => {
      const order = { tertiary: 0, secondary: 1, primary: 2 };
      return (order[a.zoneType as keyof typeof order] ?? 0) - (order[b.zoneType as keyof typeof order] ?? 0);
    });

    for (const zone of sortedZones) {
      if (zone.geoJson) {
        const color = ZONE_COLORS[zone.zoneType] || "#d4a017";
        const opacity = ZONE_OPACITY[zone.zoneType] || 0.15;
        const layer = L.geoJSON(zone.geoJson, {
          style: {
            color,
            weight: 1.5,
            fillColor: color,
            fillOpacity: opacity,
          },
        });
        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;color:#e8dcc8;">
            <strong>${zone.zoneName}</strong><br/>
            Probability: ${(Number(zone.probability) * 100).toFixed(1)}%
          </div>
        `);
        layer.addTo(group);
      }
    }

    // Last Known Position
    if (lastKnownLat && lastKnownLng) {
      const lkp = L.marker([lastKnownLat, lastKnownLng], { icon: createLKPIcon() });
      lkp.bindPopup(`
        <div style="font-family:Inter,sans-serif;color:#e8dcc8;">
          <strong>Last Known Position</strong><br/>
          ${lastKnownLat.toFixed(5)}, ${lastKnownLng.toFixed(5)}
        </div>
      `);
      lkp.addTo(group);
    }

    // Sightings
    for (const s of sightings) {
      const lat = Number(s.lat);
      const lng = Number(s.lng);
      if (isNaN(lat) || isNaN(lng)) continue;
      const marker = L.marker([lat, lng], { icon: createSightingIcon(s.sightingType) });
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;color:#e8dcc8;">
          <strong>${s.sightingType} sighting</strong><br/>
          Confidence: ${s.confidence}/10<br/>
          ${s.description || ""}
        </div>
      `);
      marker.addTo(group);
    }

    // Teams
    for (const t of teams) {
      const lat = Number(t.currentLat);
      const lng = Number(t.currentLng);
      if (isNaN(lat) || isNaN(lng)) continue;
      const marker = L.marker([lat, lng], { icon: createTeamIcon(t.teamType, t.status) });
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;color:#e8dcc8;">
          <strong>${t.name}</strong><br/>
          Type: ${t.teamType}<br/>
          Status: ${t.status}
        </div>
      `);
      marker.addTo(group);
    }

    // Fit bounds if we have data
    const allPoints: L.LatLng[] = [];
    if (lastKnownLat && lastKnownLng) allPoints.push(L.latLng(lastKnownLat, lastKnownLng));
    sightings.forEach(s => {
      const lat = Number(s.lat), lng = Number(s.lng);
      if (!isNaN(lat) && !isNaN(lng)) allPoints.push(L.latLng(lat, lng));
    });
    if (allPoints.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(allPoints);
      mapRef.current.fitBounds(bounds.pad(0.3));
    }
  }, [zones, sightings, teams, lastKnownLat, lastKnownLng, boundaryGeoJson]);

  return <div ref={containerRef} className={className} />;
}
