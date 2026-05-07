"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import type { School, Mandal } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { pctFormat, fmtInt, cn } from "@/lib/utils";
import {
  MapPin, Users, AlertTriangle, X, ExternalLink,
  ChevronLeft, Building2, TrendingUp,
} from "lucide-react";

const DistrictSchoolMap = dynamic(() => import("./DistrictSchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm text-zinc-400">
      Loading map…
    </div>
  ),
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function riskLabel(avg: number) {
  if (avg >= 0.08) return { label: "Critical", color: "text-red-700 bg-red-50 border-red-200" };
  if (avg >= 0.05) return { label: "High",     color: "text-orange-700 bg-orange-50 border-orange-200" };
  if (avg >= 0.03) return { label: "Medium",   color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
  return              { label: "Low",      color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
}

function RiskDot({ avg }: { avg: number }) {
  const c =
    avg >= 0.08 ? "#dc2626" :
    avg >= 0.05 ? "#f97316" :
    avg >= 0.03 ? "#eab308" : "#16a34a";
  return <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />;
}

// ─── panel states ─────────────────────────────────────────────────────────────

type Panel =
  | { mode: "mandals" }
  | { mode: "schools"; mandal: Mandal }
  | { mode: "school"; school: School; fromMandal?: Mandal };

// ─── sub-panels ──────────────────────────────────────────────────────────────

function MandalListPanel({
  mandals,
  totalStudents,
  totalFlagged,
  districtName,
  onMandalClick,
  lang,
}: {
  mandals: Mandal[];
  totalStudents: number;
  totalFlagged: number;
  districtName: string;
  onMandalClick: (m: Mandal) => void;
  lang: "en" | "te";
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-[color:var(--ap-navy)]" />
          <h2 className="text-sm font-semibold text-zinc-800">
            {districtName} District Hotspots
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {fmtInt(totalStudents)} enrolled
          </span>
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <AlertTriangle className="h-3 w-3" /> {fmtInt(totalFlagged)} at-risk
          </span>
        </div>
      </div>

      {/* Mandal list */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {mandals.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-8">No mandal data available.</p>
        )}
        {mandals.map((m, i) => (
          <button
            key={i}
            onClick={() => onMandalClick(m)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-zinc-400 tabular-nums w-4">{i + 1}</span>
              <RiskDot avg={m.avg_risk} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 truncate">{m.mandal_name}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {fmtInt(m.n_flagged)}/{fmtInt(m.n_students)} flagged
              </div>
              {/* Risk bar */}
              <div className="mt-1.5 h-1 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, m.avg_risk * 500)}%`,
                    backgroundColor:
                      m.avg_risk >= 0.08 ? "#dc2626" :
                      m.avg_risk >= 0.05 ? "#f97316" :
                      m.avg_risk >= 0.03 ? "#eab308" : "#16a34a",
                  }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-zinc-800 tabular-nums">
                {pctFormat(m.avg_risk, 0)}
              </div>
              <div className="text-[10px] text-zinc-400">avg risk</div>
            </div>
            <ChevronLeft className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 rotate-180 shrink-0 transition-colors" />
          </button>
        ))}
      </div>

      <p className="text-[11px] text-zinc-400 mt-3 pt-3 border-t border-zinc-100">
        {lang === "en"
          ? "Click a mandal or tap a circle on the map to explore schools."
          : "పాఠశాలలను చూడటానికి మండల సర్కిల్‌ను నొక్కండి."}
      </p>
    </div>
  );
}

function SchoolsInMandalPanel({
  mandal,
  schools,
  onBack,
  onSchoolClick,
  lang,
}: {
  mandal: Mandal;
  schools: School[];
  onBack: () => void;
  onSchoolClick: (s: School) => void;
  lang: "en" | "te";
}) {
  const { label, color } = riskLabel(mandal.avg_risk);
  const sorted = [...schools].sort((a, b) => b.n_flagged - a.n_flagged);

  return (
    <div className="flex flex-col h-full">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 mb-3 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {lang === "en" ? "All hotspots" : "అన్ని హాట్‌స్పాట్‌లు"}
      </button>

      {/* Mandal header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{mandal.mandal_name}</h2>
            <div className="text-xs text-zinc-500 mt-0.5">{mandal.district_name} District</div>
          </div>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0", color)}>
            <AlertTriangle className="h-3 w-3" /> {label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Schools", value: fmtInt(schools.length) },
            { label: "Students", value: fmtInt(mandal.n_students) },
            { label: "Flagged",  value: fmtInt(mandal.n_flagged), red: true },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-zinc-50 px-2.5 py-2 text-center">
              <div className={cn("text-lg font-bold", s.red ? "text-red-700" : "text-zinc-900")}>{s.value}</div>
              <div className="text-[10px] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* School list */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {sorted.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-8">No schools found in this mandal.</p>
        )}
        {sorted.map((s) => {
          const { label: sLabel, color: sColor } = riskLabel(s.avg_risk);
          return (
            <button
              key={s.school_id}
              onClick={() => onSchoolClick(s)}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors text-left group"
            >
              <div className="p-1.5 rounded-md bg-zinc-100 group-hover:bg-white transition-colors shrink-0 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-900 truncate leading-snug">
                  {s.school_name ?? `School #${s.school_id}`}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-zinc-500">{fmtInt(s.n_students)} students</span>
                  <span className="text-[11px] text-red-600 font-medium">{fmtInt(s.n_flagged)} flagged</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={cn("inline-flex text-[10px] font-semibold rounded-full px-2 py-0.5 border", sColor)}>
                  {sLabel}
                </span>
                <span className="text-[11px] text-zinc-500 tabular-nums">{pctFormat(s.avg_risk, 1)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-400 mt-3 pt-3 border-t border-zinc-100">
        {lang === "en"
          ? "Click a school to see full details and student roster."
          : "పాఠశాల వివరాల కోసం నొక్కండి."}
      </p>
    </div>
  );
}

function SchoolDetailPanel({
  school,
  fromMandal,
  onBack,
  lang,
}: {
  school: School;
  fromMandal?: Mandal;
  onBack: () => void;
  lang: "en" | "te";
}) {
  const { label, color } = riskLabel(school.avg_risk);
  const pct = school.n_students > 0 ? (school.n_flagged / school.n_students) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 mb-3 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {fromMandal
          ? (lang === "en" ? `Back to ${fromMandal.mandal_name}` : `${fromMandal.mandal_name}కు వెనుకకు`)
          : (lang === "en" ? "All hotspots" : "అన్ని హాట్‌స్పాట్‌లు")}
      </button>

      {/* School header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <MapPin className="h-3 w-3" />
            <span>{school.district_name} · {school.mandal_name}</span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-900 leading-snug">
            {school.school_name ?? `School #${school.school_id}`}
          </h2>
        </div>
      </div>

      {/* Risk badge */}
      <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold w-fit mb-4", color)}>
        <AlertTriangle className="h-3 w-3" />
        {label} risk zone
      </div>

      {/* Student counts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border bg-zinc-50 p-3 text-center">
          <div className="text-2xl font-bold text-zinc-900">{fmtInt(school.n_students)}</div>
          <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
            <Users className="h-3 w-3" />
            {lang === "en" ? "Enrolled" : "నమోదైన"}
          </div>
        </div>
        <div className="rounded-lg border bg-red-50 p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{fmtInt(school.n_flagged)}</div>
          <div className="text-[11px] text-red-500 flex items-center justify-center gap-1 mt-0.5">
            <AlertTriangle className="h-3 w-3" />
            {lang === "en" ? "At-risk" : "ప్రమాదంలో"}
          </div>
        </div>
      </div>

      {/* At-risk rate bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-600">{lang === "en" ? "At-risk rate" : "ప్రమాద రేటు"}</span>
          <span className="font-semibold text-zinc-800">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, pct)}%`,
              backgroundColor: pct >= 8 ? "#dc2626" : pct >= 5 ? "#f97316" : pct >= 3 ? "#eab308" : "#16a34a",
            }}
          />
        </div>
      </div>

      {/* Avg dropout probability */}
      <div className="rounded-lg border p-3 mb-4 bg-white">
        <div className="text-xs text-zinc-500 mb-0.5">
          {lang === "en" ? "Average dropout probability" : "సగటు డ్రాపౌట్ సంభావ్యత"}
        </div>
        <div className="text-lg font-bold text-zinc-900">{pctFormat(school.avg_risk, 1)}</div>
        <div className="text-[10px] text-zinc-400">
          {lang === "en" ? "XGBoost model output, AY 2024-25" : "XGBoost మోడల్, AY 2024-25"}
        </div>
      </div>

      {/* Additional stats */}
      <div className="rounded-lg border p-3 mb-4 bg-zinc-50 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">% Critical tier</span>
          <span className="font-semibold text-red-700">{school.pct_critical.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">School ID</span>
          <span className="font-mono text-zinc-600">{school.school_id}</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/dashboard/district/schools?id=${school.school_id}`}
        className="flex items-center justify-center gap-2 rounded-lg bg-[color:var(--ap-navy)] text-white text-sm font-medium py-2.5 hover:opacity-90 transition mt-auto"
      >
        <TrendingUp className="h-4 w-4" />
        {lang === "en" ? "View full school report" : "పూర్తి నివేదిక చూడండి"}
      </Link>
      <Link
        href={`/dashboard/teacher?school=${school.school_id}`}
        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium py-2 mt-2 hover:bg-zinc-50 transition"
      >
        <ExternalLink className="h-4 w-4" />
        {lang === "en" ? "View student roster" : "విద్యార్థుల జాబితా"}
      </Link>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function DistrictMapView({
  schools,
  mandals,
}: {
  schools: School[];
  mandals: Mandal[];
}) {
  const { user, isInitialized } = useAuth();
  const { lang } = useLang();
  const [panel, setPanel] = useState<Panel>({ mode: "mandals" });

  const districtName = user?.district ?? "";

  // Filter to the officer's district only
  const districtSchools = useMemo(
    () => schools.filter((s) => s.district_name === districtName),
    [schools, districtName]
  );
  const districtMandals = useMemo(
    () =>
      mandals
        .filter((m) => m.district_name === districtName)
        .sort((a, b) => b.avg_risk - a.avg_risk),
    [mandals, districtName]
  );

  // Geographic center of the district (average of school coords)
  const center = useMemo((): [number, number] => {
    if (!districtSchools.length) return [15.9129, 79.74];
    const lat =
      districtSchools.reduce((s, sc) => s + sc.latitude!, 0) / districtSchools.length;
    const lng =
      districtSchools.reduce((s, sc) => s + sc.longitude!, 0) / districtSchools.length;
    return [lat, lng];
  }, [districtSchools]);

  const totalStudents = districtSchools.reduce((s, sc) => s + sc.n_students, 0);
  const totalFlagged  = districtSchools.reduce((s, sc) => s + sc.n_flagged,  0);

  // Which mandal is highlighted on the map
  const selectedMandalName =
    panel.mode === "schools"
      ? panel.mandal.mandal_name
      : panel.mode === "school" && panel.fromMandal
      ? panel.fromMandal.mandal_name
      : null;

  function handleMandalSelect(m: Mandal) {
    setPanel({ mode: "schools", mandal: m });
  }

  function handleSchoolSelect(s: School) {
    setPanel({
      mode: "school",
      school: s,
      fromMandal: panel.mode === "schools" ? panel.mandal : undefined,
    });
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        Initialising…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[color:var(--ap-navy)]" />
            {districtName
              ? `${districtName} District Heatmap`
              : "District Heatmap"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {districtSchools.length} schools ·{" "}
            <span className="text-red-600 font-medium">{fmtInt(totalFlagged)}</span> at-risk ·{" "}
            {districtMandals.length} mandals · AY 2024-25
          </p>
        </div>

        {/* Risk legend */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500">
          {(
            [
              ["Critical", "#dc2626"],
              ["High",     "#f97316"],
              ["Medium",   "#eab308"],
              ["Low",      "#16a34a"],
            ] as const
          ).map(([lbl, col]) => (
            <span key={lbl} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: col }}
              />
              {lbl}
            </span>
          ))}
        </div>
      </div>

      {/* Map + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Map */}
        <div
          className="rounded-xl border bg-white overflow-hidden"
          style={{ height: "640px" }}
        >
          <DistrictSchoolMap
            schools={districtSchools}
            mandals={districtMandals}
            center={center}
            zoom={9}
            selectedMandalName={selectedMandalName}
            onMandalSelect={handleMandalSelect}
            onSchoolSelect={handleSchoolSelect}
          />
        </div>

        {/* Side panel */}
        <aside
          className="rounded-xl border bg-white p-4 overflow-y-auto"
          style={{ height: "640px" }}
        >
          {panel.mode === "mandals" && (
            <MandalListPanel
              mandals={districtMandals}
              totalStudents={totalStudents}
              totalFlagged={totalFlagged}
              districtName={districtName}
              onMandalClick={handleMandalSelect}
              lang={lang}
            />
          )}

          {panel.mode === "schools" && (
            <SchoolsInMandalPanel
              mandal={panel.mandal}
              schools={districtSchools.filter(
                (s) => s.mandal_name === panel.mandal.mandal_name
              )}
              onBack={() => setPanel({ mode: "mandals" })}
              onSchoolClick={handleSchoolSelect}
              lang={lang}
            />
          )}

          {panel.mode === "school" && (
            <SchoolDetailPanel
              school={panel.school}
              fromMandal={panel.fromMandal}
              onBack={() =>
                panel.fromMandal
                  ? setPanel({ mode: "schools", mandal: panel.fromMandal })
                  : setPanel({ mode: "mandals" })
              }
              lang={lang}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
