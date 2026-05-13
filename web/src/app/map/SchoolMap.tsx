"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { School, DistrictInfo, MandalInfo } from "@/lib/types";
import { pctFormat, fmtInt } from "@/lib/utils";

const AP_CENTER: [number, number] = [15.9129, 79.7400];

function riskColor(r: number): string {
  if (r >= 0.08) return "#dc2626";
  if (r >= 0.05) return "#f97316";
  if (r >= 0.03) return "#eab308";
  return "#16a34a";
}

function riskRadius(nFlagged: number): number {
  return Math.max(2, Math.min(12, Math.sqrt(nFlagged) * 1.5));
}

interface MapClickHandlerProps {
  onDistrictClick: (e: L.LeafletMouseEvent) => void;
  selectedDistrictName: string | null;
}

function MapClickHandler({ onDistrictClick, selectedDistrictName }: MapClickHandlerProps) {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Check if clicked on a school marker or district
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest('.leaflet-marker-icon')) {
        return; // School marker - handled separately
      }
      if (target.closest('.leaflet-interactive')) {
        // Clicked on district GeoJSON, but we handle via GeoJSON eventHandlers
        return;
      }
      // Clicked on empty area - let parent handle clearing
      onDistrictClick(e);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onDistrictClick, selectedDistrictName]);

  return null;
}

export default function SchoolMap({
  schools,
  mandals,
  onSchoolSelect,
  onDistrictSelect,
  onSelectedDistrictChange,
}: {
  schools: School[];
  mandals: MandalInfo[];
  onSchoolSelect?: (school: School) => void;
  onDistrictSelect?: (districtName: string) => void;
  onSelectedDistrictChange?: (districtName: string | null) => void;
}) {
  const filtered = schools.filter((s) => s.n_students >= 20);
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/ap_districts.geojson")
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load district outlines", err));
  }, []);

  // Create district statistics from schools
  const districtStats = schools.reduce((acc, school) => {
    const district = school.district_name || "Unknown";
    if (!acc[district]) {
      acc[district] = {
        name: district,
        n_students: 0,
        n_flagged: 0,
        avg_risk_sum: 0,
        n_schools: 0,
        schools: [],
      };
    }
    acc[district].n_students += school.n_students;
    acc[district].n_flagged += school.n_flagged;
    acc[district].avg_risk_sum += school.avg_risk * school.n_students;
    acc[district].n_schools += 1;
    acc[district].schools.push(school);
    return acc;
  }, {} as Record<string, { name: string; n_students: number; n_flagged: number; avg_risk_sum: number; n_schools: number; schools: School[] }>);

  // Calculate average risk for each district
  const districtInfos: Record<string, DistrictInfo> = {};
  for (const [name, stats] of Object.entries(districtStats)) {
    districtInfos[name] = {
      name,
      n_students: stats.n_students,
      n_flagged: stats.n_flagged,
      avg_risk: stats.n_students > 0 ? stats.avg_risk_sum / stats.n_students : 0,
      n_schools: stats.n_schools,
      schools: stats.schools,
    };
  }

  const getDistrictStyle = (feature: any) => {
    const districtName = feature?.properties?.district || feature?.properties?.name || feature?.properties?.DISTNAME || feature?.properties?.district_name;
    const isHovered = districtName === hoveredDistrict;
    const isSelected = selectedDistrictName === districtName;
    const districtData = districtInfos[districtName];

    let fillColor = "transparent";
    if (districtData) {
      fillColor = riskColor(districtData.avg_risk);
    }

    // Show full opacity for selected district
    const baseOpacity = isSelected ? 0.5 : 0.1;
    const hoverOpacity = isHovered ? 0.3 : baseOpacity;

    return {
      fillColor,
      fillOpacity: hoverOpacity,
      color: isSelected ? "#1e40af" : isHovered ? "#3b82f6" : "#94a3b8",
      weight: isSelected ? 3 : isHovered ? 2 : 1.5,
      opacity: 0.8,
      dashArray: isSelected || isHovered ? undefined : "3 3",
    };
  };

  const handleDistrictClick = (feature: any) => {
    const districtName = feature?.properties?.district || feature?.properties?.name || feature?.properties?.DISTNAME || feature?.properties?.district_name;
    if (districtName) {
      setSelectedDistrictName(districtName);
      onDistrictSelect?.(districtName);
      onSelectedDistrictChange?.(districtName);
    }
  };

  const handleMapBackgroundClick = (e: L.LeafletMouseEvent) => {
    // Clear selected district when clicking on empty map area
    setSelectedDistrictName(null);
    onSelectedDistrictChange?.(null);
  };

  return (
    <MapContainer center={AP_CENTER} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoData && (
        <GeoJSON
          key={`${hoveredDistrict}-${selectedDistrictName}-${Math.random()}`}
          data={geoData}
          style={getDistrictStyle}
          eventHandlers={{
            click: (e: any) => {
              handleDistrictClick(e.layer?.feature);
              e.layer?.openPopup();
            },
            mouseover: (e: any) => {
              const districtName = e.layer?.feature?.properties?.district || e.layer?.feature?.properties?.name || e.layer?.feature?.properties?.DISTNAME || e.layer?.feature?.properties?.district_name;
              setHoveredDistrict(districtName);
              e.originalEvent.target?.classList?.add("leaflet-interactive");
              e.layer?.openPopup();
            },
            mouseout: (e: any) => {
              setHoveredDistrict(null);
              e.layer?.closePopup();
            },
          }}
          onEachFeature={(feature: any, layer: any) => {
            const districtName = feature?.properties?.district || feature?.properties?.name || feature?.properties?.DISTNAME || feature?.properties?.district_name;
            // Case-insensitive lookup to match district names
            const normalizedName = districtName?.toLowerCase()?.trim();
            const districtData = Object.values(districtInfos).find(
              d => d.name.toLowerCase().trim() === normalizedName
            );
            if (districtData) {
              layer.bindPopup(`
                <div class="text-xs space-y-0.5 min-w-[180px]">
                  <div class="font-semibold text-zinc-900">${districtData.name}</div>
                  <div class="text-zinc-600">${districtData.n_schools} Schools</div>
                  <div class="pt-1 border-t border-zinc-200 mt-1">
                    <div>Students: <b>${fmtInt(districtData.n_students)}</b></div>
                    <div>Flagged: <b class="text-red-600">${fmtInt(districtData.n_flagged)}</b></div>
                    <div>Avg risk: <b>${pctFormat(districtData.avg_risk, 1)}</b></div>
                  </div>
                </div>
              `);
            }
          }}
        />
      )}
      <MapClickHandler onDistrictClick={handleMapBackgroundClick} selectedDistrictName={selectedDistrictName} />

      {/* Mandal markers from database */}
      {mandals.filter(m => m.latitude && m.longitude).map((m) => (
        <CircleMarker
          key={`mandal-${m.mandal_name}-${m.district_name}`}
          center={[m.latitude, m.longitude]}
          radius={Math.max(4, Math.min(16, Math.sqrt(m.n_students) * 0.5))}
          pathOptions={{
            color: riskColor(m.avg_risk),
            fillColor: riskColor(m.avg_risk),
            fillOpacity: 0.7,
            weight: 2,
          }}
          eventHandlers={{
            click: () => {
              onDistrictSelect?.(m.district_name);
            },
          }}
        >
          <Popup>
            <div className="text-xs space-y-0.5 min-w-[180px]">
              <div className="font-semibold text-zinc-900">{m.mandal_name}</div>
              <div className="text-zinc-600">{m.district_name} Mandal</div>
              <div className="pt-1 border-t border-zinc-200 mt-1">
                <div>Students: <b>{fmtInt(m.n_students)}</b></div>
                <div>Flagged: <b className="text-red-600">{fmtInt(m.n_flagged)}</b></div>
                <div>Avg risk: <b>{pctFormat(m.avg_risk, 1)}</b></div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* School markers */}
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
          eventHandlers={{
            click: () => onSchoolSelect?.(s),
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