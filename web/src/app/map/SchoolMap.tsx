"use client";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { School } from "@/lib/types";
import { pctFormat, fmtInt } from "@/lib/utils";

// AP approximate center + bounding box
const AP_CENTER: [number, number] = [15.9129, 79.7400];

function riskColor(r: number): string {
  if (r >= 0.08) return "#dc2626";
  if (r >= 0.05) return "#f97316";
  if (r >= 0.03) return "#eab308";
  return "#16a34a";
}

function riskRadius(nFlagged: number): number {
  // 2..12
  return Math.max(2, Math.min(12, Math.sqrt(nFlagged) * 1.5));
}

export default function SchoolMap({ schools }: { schools: School[] }) {
  // Subsample large datasets for performance
  const filtered = schools.filter((s) => s.n_students >= 20);

  return (
    <MapContainer center={AP_CENTER} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filtered.map((s) => (
        <CircleMarker
          key={s.school_id}
          center={[s.latitude as number, s.longitude as number]}
          radius={riskRadius(s.n_flagged)}
          pathOptions={{
            color: riskColor(s.avg_risk),
            fillColor: riskColor(s.avg_risk),
            fillOpacity: 0.6,
            weight: 1,
          }}
        >
          <Popup>
            <div className="text-xs space-y-0.5 min-w-[200px]">
              <div className="font-semibold text-zinc-900">{s.school_name}</div>
              <div className="text-zinc-600">{s.district_name} · {s.mandal_name}</div>
              <div className="pt-1 border-t border-zinc-200 mt-1">
                <div>Students: <b>{fmtInt(s.n_students)}</b></div>
                <div>Flagged: <b className="text-red-600">{fmtInt(s.n_flagged)}</b></div>
                <div>Avg risk: <b>{pctFormat(s.avg_risk, 1)}</b></div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
