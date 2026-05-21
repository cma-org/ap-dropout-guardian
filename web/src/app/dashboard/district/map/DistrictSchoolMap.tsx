"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { School, Mandal } from "@/lib/types";
import { pctFormat, fmtInt } from "@/lib/utils";

function riskColor(r: number): string {
  if (r >= 0.08) return "#dc2626";
  if (r >= 0.05) return "#f97316";
  if (r >= 0.03) return "#eab308";
  return "#16a34a";
}

// Re-centers the map whenever center/zoom props change (auth loads after mount)
function SetView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    try {
      map.setView(center, zoom);
    } catch {
      // map may be in a transitioning/unmounted state — ignore
    }
  }, [map, center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function DistrictSchoolMap({
  schools,
  mandals,
  center,
  zoom = 9,
  selectedMandalName,
  onMandalSelect,
  onSchoolSelect,
}: {
  schools: School[];
  mandals: Mandal[];
  center: [number, number];
  zoom?: number;
  selectedMandalName: string | null;
  onMandalSelect: (m: Mandal) => void;
  onSchoolSelect: (s: School) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Clear Leaflet's internal DOM tracking on unmount so the container can be
  // safely reused by a fresh MapContainer instance (e.g. after year change nav).
  useEffect(() => {
    return () => {
      const el = wrapperRef.current?.querySelector(".leaflet-container");
      if (el) {
        (el as any)._leaflet_id = undefined;
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ height: "100%", width: "100%" }}>
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <SetView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Mandal zones — large semi-transparent circles rendered first (beneath school dots) */}
      {mandals.map((m, i) => {
        const isSelected = selectedMandalName === m.mandal_name;
        return (
          <CircleMarker
            key={`mandal-${i}`}
            center={[m.latitude as number, m.longitude as number]}
            radius={32}
            pathOptions={{
              color: riskColor(m.avg_risk),
              fillColor: riskColor(m.avg_risk),
              fillOpacity: isSelected ? 0.30 : 0.10,
              weight: isSelected ? 2.5 : 1.5,
              dashArray: isSelected ? undefined : "6 4",
            }}
            eventHandlers={{ click: () => onMandalSelect(m) }}
          >
            <Popup>
              <div className="text-xs min-w-[170px] space-y-1">
                <div className="font-semibold text-zinc-900">{m.mandal_name}</div>
                <div className="text-zinc-500">{m.district_name} District</div>
                <div className="border-t border-zinc-200 pt-1 mt-1 space-y-0.5">
                  <div>Students: <b>{fmtInt(m.n_students)}</b></div>
                  <div>Flagged: <b className="text-red-600">{fmtInt(m.n_flagged)}</b></div>
                  <div>Avg risk: <b>{pctFormat(m.avg_risk, 1)}</b></div>
                </div>
                <div className="text-zinc-400 text-[11px] italic pt-0.5">Click to explore schools →</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Individual school dots — smaller, rendered on top */}
      {schools.map((s) => (
        <CircleMarker
          key={s.school_id}
          center={[s.latitude as number, s.longitude as number]}
          radius={Math.max(3, Math.min(10, Math.sqrt(s.n_flagged) * 1.3))}
          pathOptions={{
            color: riskColor(s.avg_risk),
            fillColor: riskColor(s.avg_risk),
            fillOpacity: 0.78,
            weight: 1,
          }}
          eventHandlers={{ click: () => onSchoolSelect(s) }}
        >
          <Popup>
            <div className="text-xs space-y-0.5 min-w-[200px]">
              <div className="font-semibold text-zinc-900">{s.school_name ?? `School #${s.school_id}`}</div>
              <div className="text-zinc-500">{s.mandal_name}</div>
              <div className="border-t border-zinc-200 pt-1 mt-1 space-y-0.5">
                <div>Students: <b>{fmtInt(s.n_students)}</b></div>
                <div>Flagged: <b className="text-red-600">{fmtInt(s.n_flagged)}</b></div>
                <div>Avg risk: <b>{pctFormat(s.avg_risk, 1)}</b></div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
    </div>
  );
}
