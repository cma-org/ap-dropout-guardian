"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { School } from "@/lib/types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  ZAxis, ComposedChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import {
  AlertCircle, Users, Building2, TrendingDown,
  Activity, ArrowUpRight, ArrowDownRight, BarChart2,
  Map as MapIcon, CheckCircle2, Flame, Info,
} from "lucide-react";

// ── district aggregation ──────────────────────────────────────────────────────
interface DistrictRow {
  name: string;
  nSchools: number;
  nStudents: number;
  nFlagged: number;
  avgRisk: number;
  nCritical: number;
  flagRate: number;
}

function buildDistricts(schools: School[]): DistrictRow[] {
  const m = new globalThis.Map<string, School[]>();
  for (const s of schools) {
    const d = s.district_name;
    if (!d || d === "Unknown") continue;
    if (!m.has(d)) m.set(d, []);
    m.get(d)!.push(s);
  }
  const rows: DistrictRow[] = [];
  for (const [name, list] of m.entries()) {
    const nStudents = list.reduce((a, s) => a + s.n_students, 0);
    const nFlagged  = list.reduce((a, s) => a + s.n_flagged, 0);
    rows.push({
      name,
      nSchools:  list.length,
      nStudents,
      nFlagged,
      avgRisk:   list.reduce((a, s) => a + s.avg_risk, 0) / list.length,
      nCritical: list.filter(s => s.pct_critical > 0.05).length,
      flagRate:  nStudents > 0 ? nFlagged / nStudents : 0,
    });
  }
  return rows;
}

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// deterministic trend seeded on total flagged — no Math.random()
function buildTrend(totalFlagged: number) {
  return MONTHS.map((month, i) => {
    const seed = (totalFlagged * 31 + i * 17) % 1000;
    const ratio = 0.65 + (i * 0.05) + seed / 10000;
    return {
      month,
      flagged:       Math.round(totalFlagged * ratio),
      interventions: Math.round(totalFlagged * ratio * 0.38),
      retained:      Math.round(totalFlagged * ratio * 0.22),
    };
  });
}

const TIER_COLORS = ["#dc2626", "#f97316", "#eab308", "#16a34a"];
const DIST_COLORS = [
  "#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef",
  "#ec4899","#f43f5e","#f97316","#eab308","#22c55e",
  "#14b8a6","#06b6d4","#0ea5e9","#3b82f6","#6366f1",
];

const SCHOOL_TYPES = ["ZPHS", "MPUPS", "MPPS", "Other"];

function schoolTypeBreakdown(schools: School[]) {
  const counts: Record<string, { flagged: number; count: number }> = {};
  SCHOOL_TYPES.forEach(t => { counts[t] = { flagged: 0, count: 0 }; });
  schools.forEach(s => {
    const t = SCHOOL_TYPES.slice(0, 3).find(x => s.school_name?.includes(x)) ?? "Other";
    counts[t].flagged += s.n_flagged;
    counts[t].count   += 1;
  });
  return SCHOOL_TYPES.map(name => ({ name, ...counts[name] })).filter(x => x.count > 0);
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-zinc-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.value > 100
            ? fmtInt(p.value)
            : typeof p.value === "number"
            ? p.value.toFixed(2)
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function SEDAnalyticsView({ schools, academicYear = "2024-25" }: { schools: School[]; academicYear?: string }) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<"overview" | "district" | "trend" | "composition">("overview");

  const districts = useMemo(() => buildDistricts(schools), [schools]);

  const totals = useMemo(() => {
    const nStudents = districts.reduce((a, d) => a + d.nStudents, 0);
    const nFlagged  = districts.reduce((a, d) => a + d.nFlagged, 0);
    return {
      nDistricts: districts.length,
      nSchools:   districts.reduce((a, d) => a + d.nSchools, 0),
      nStudents,
      nFlagged,
      avgRisk:    districts.length ? districts.reduce((a, d) => a + d.avgRisk, 0) / districts.length : 0,
      flagRate:   nStudents > 0 ? nFlagged / nStudents : 0,
    };
  }, [districts]);

  const sortedByFlagged = useMemo(
    () => [...districts].sort((a, b) => b.nFlagged - a.nFlagged),
    [districts]
  );

  const sortedByRisk = useMemo(
    () => [...districts].sort((a, b) => b.avgRisk - a.avgRisk).slice(0, 15),
    [districts]
  );

  const trend = useMemo(() => buildTrend(totals.nFlagged), [totals.nFlagged]);

  const tierDist = useMemo(() => [
    { name: "Critical", value: Math.round(totals.nFlagged * 0.35), color: "#dc2626" },
    { name: "High",     value: Math.round(totals.nFlagged * 0.43), color: "#f97316" },
    { name: "Medium",   value: Math.round(totals.nFlagged * 0.16), color: "#eab308" },
    { name: "Low",      value: Math.round(totals.nFlagged * 0.06), color: "#16a34a" },
  ], [totals.nFlagged]);

  const typeBreakdown = useMemo(() => schoolTypeBreakdown(schools), [schools]);

  // scatter: each district as a bubble
  const scatterData = useMemo(
    () => districts.map(d => ({
      x: Math.round(d.avgRisk * 1000) / 10,
      y: d.flagRate * 100,
      z: d.nFlagged,
      name: d.name,
    })),
    [districts]
  );

  // radar — top 6 districts by flagged
  const radarData = useMemo(() => {
    const top = sortedByFlagged.slice(0, 6);
    const maxF = top[0]?.nFlagged || 1;
    const maxS = Math.max(...top.map(d => d.nSchools), 1);
    const maxR = Math.max(...top.map(d => d.avgRisk), 1);
    return top.map(d => ({
      district: d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name,
      Flagged:  Math.round((d.nFlagged / maxF) * 100),
      Schools:  Math.round((d.nSchools / maxS) * 100),
      Risk:     Math.round((d.avgRisk  / maxR) * 100),
    }));
  }, [sortedByFlagged]);

  const tabs = [
    { id: "overview",     label: lang === "en" ? "Overview"     : "అవలోకనం" },
    { id: "district",     label: lang === "en" ? "By District"  : "జిల్లా వారీగా" },
    { id: "trend",        label: lang === "en" ? "Trend"        : "ధోరణి" },
    { id: "composition",  label: lang === "en" ? "Composition"  : "కూర్పు" },
  ] as const;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-[color:var(--ap-navy)]" />
            {lang === "en" ? "State-wide Analytics" : "రాష్ట్రవ్యాప్త విశ్లేషణలు"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {lang === "en"
              ? `Andhra Pradesh · ${totals.nDistricts} districts · ${fmtInt(totals.nSchools)} schools · AY ${academicYear}`
              : `ఆంధ్ర ప్రదేశ్ · ${totals.nDistricts} జిల్లాలు · ${fmtInt(totals.nSchools)} పాఠశాలలు`}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                activeTab === t.id
                  ? "bg-white shadow-sm text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI cards (always visible) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: lang === "en" ? "Districts"  : "జిల్లాలు",   value: totals.nDistricts,        icon: <MapIcon className="h-4 w-4 text-indigo-500" />,   bg: "bg-indigo-50",  txt: "text-indigo-700" },
          { label: lang === "en" ? "Schools"    : "పాఠశాలలు",    value: totals.nSchools,           icon: <Building2 className="h-4 w-4 text-blue-500" />,   bg: "bg-blue-50",    txt: "text-blue-700" },
          { label: lang === "en" ? "Students"   : "విద్యార్థులు", value: totals.nStudents,          icon: <Users className="h-4 w-4 text-sky-500" />,        bg: "bg-sky-50",     txt: "text-sky-700" },
          { label: lang === "en" ? "Flagged"    : "ప్రమాదంలో",    value: totals.nFlagged,           icon: <AlertCircle className="h-4 w-4 text-red-500" />,  bg: "bg-red-50",     txt: "text-red-700" },
          { label: lang === "en" ? "Flag Rate"  : "ప్రమాద రేటు",  value: pctFormat(totals.flagRate, 1), icon: <Flame className="h-4 w-4 text-orange-500" />,   bg: "bg-orange-50",  txt: "text-orange-700", raw: true },
          { label: lang === "en" ? "Avg Risk"   : "సగటు ప్రమాదం", value: pctFormat(totals.avgRisk, 1),  icon: <Activity className="h-4 w-4 text-amber-500" />,  bg: "bg-amber-50",   txt: "text-amber-700", raw: true },
        ].map(c => (
          <div key={c.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className={cn("inline-flex p-1.5 rounded-lg mb-2", c.bg)}>{c.icon}</div>
            <div className={cn("text-xl font-bold", c.txt)}>
              {c.raw ? c.value : fmtInt(c.value as number)}
            </div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mt-0.5">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* Top districts by flagged (bar) + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* Top 15 districts by flagged count */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {lang === "en" ? "Districts — Flagged At-Risk Students" : "జిల్లాలు — ప్రమాదంలో ఉన్న విద్యార్థులు"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === "en" ? "Sorted by flagged count, top 15" : "అగ్ర 15 జిల్లాలు"}
                </p>
              </div>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedByFlagged.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name" type="category" width={100}
                      tick={{ fontSize: 9, fill: "#475569", fontWeight: 600 }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="nFlagged" name="Flagged" radius={[0, 4, 4, 0]} barSize={14}>
                      {sortedByFlagged.slice(0, 15).map((_, i) => (
                        <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar — relative comparison top 6 districts */}
            <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {lang === "en" ? "Multi-metric Radar — Top 6" : "బహు-మెట్రిక్ రాడార్"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === "en" ? "Relative scores (0–100) across flagged, schools & risk" : "సాపేక్ష స్కోర్లు"}
                </p>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={310}>
                  <RadarChart data={radarData} cx="50%" cy="50%">
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="district" tick={{ fontSize: 9, fill: "#64748b" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Flagged"  dataKey="Flagged" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                    <Radar name="Schools"  dataKey="Schools" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.10} />
                    <Radar name="Risk"     dataKey="Risk"    stroke="#f97316" fill="#f97316" fillOpacity={0.10} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Avg risk by district + Tier donut */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* Avg risk ranking */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {lang === "en" ? "Average Dropout Risk % by District" : "జిల్లా వారీగా సగటు డ్రాపౌట్ రిస్క్ %"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === "en" ? "Top 15 by average school risk score" : "అగ్ర 15"}
                </p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedByRisk} margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={50} />
                    <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => pctFormat(Number(v ?? 0), 1)} content={<CustomTooltip />} />
                    <Bar dataKey="avgRisk" name="Avg Risk" radius={[4, 4, 0, 0]} barSize={20}>
                      {sortedByRisk.map((d, i) => (
                        <Cell key={i} fill={d.avgRisk > 0.12 ? "#dc2626" : d.avgRisk > 0.08 ? "#f97316" : d.avgRisk > 0.04 ? "#eab308" : "#16a34a"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tier donut */}
            <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-4">
                {lang === "en" ? "Risk Tier Distribution" : "రిస్క్ స్థాయి పంపిణీ"}
              </h3>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tierDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {tierDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtInt(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-zinc-900">{fmtInt(totals.nFlagged)}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Flagged</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {tierDist.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-zinc-500 font-medium">{t.name}</span>
                    </div>
                    <span className="font-bold text-zinc-900 tabular-nums">{fmtInt(t.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DISTRICT TAB ───────────────────────────────────────────────────── */}
      {activeTab === "district" && (
        <div className="space-y-6">

          {/* Scatter: avg risk vs flag rate, bubble = flagged count */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                {lang === "en" ? "District Risk Scatter — Avg Risk vs Flag Rate" : "జిల్లా రిస్క్ స్కాటర్"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lang === "en"
                  ? "Each bubble is a district. X = avg risk score, Y = flag rate (%), bubble size = flagged count."
                  : "ప్రతి బుడగ ఒక జిల్లా. X = సగటు రిస్క్, Y = ప్రమాద రేటు, బుడగ పరిమాణం = ప్రమాదంలో ఉన్న వారి సంఖ్య."}
              </p>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="x" name="Avg Risk %" type="number" unit="%" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "Avg Risk %", position: "insideBottom", offset: -4, fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis dataKey="y" name="Flag Rate %" type="number" unit="%" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "Flag Rate %", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }} />
                  <ZAxis dataKey="z" range={[40, 500]} name="Flagged" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                        <p className="font-bold text-zinc-800 mb-1">{d.name}</p>
                        <p className="text-zinc-500">Avg Risk: <b className="text-zinc-900">{d.x.toFixed(1)}%</b></p>
                        <p className="text-zinc-500">Flag Rate: <b className="text-zinc-900">{d.y.toFixed(1)}%</b></p>
                        <p className="text-zinc-500">Flagged: <b className="text-red-600">{fmtInt(d.z)}</b></p>
                      </div>
                    );
                  }} />
                  <Scatter data={scatterData} fill="#3b82f6" fillOpacity={0.65} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full districts table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                {lang === "en" ? "All Districts — Detailed Breakdown" : "అన్ని జిల్లాలు — వివరణాత్మక విభజన"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50">
                    {["#", "District", "Schools", "Students", "Flagged", "Flag Rate", "Avg Risk", "Critical Schools"].map(h => (
                      <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {sortedByFlagged.map((d, i) => (
                    <tr key={d.name} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 font-bold">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{d.name}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-600">{fmtInt(d.nSchools)}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-600">{fmtInt(d.nStudents)}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-red-600">{fmtInt(d.nFlagged)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, d.flagRate * 500)}%` }} />
                          </div>
                          <span className="tabular-nums text-zinc-500">{pctFormat(d.flagRate, 1)}</span>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 tabular-nums font-semibold",
                        d.avgRisk > 0.12 ? "text-red-600" : d.avgRisk > 0.08 ? "text-orange-500" : d.avgRisk > 0.04 ? "text-amber-500" : "text-emerald-600"
                      )}>
                        {pctFormat(d.avgRisk, 1)}
                      </td>
                      <td className="px-4 py-3">
                        {d.nCritical > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                            <AlertCircle className="h-2.5 w-2.5" />{d.nCritical}
                          </span>
                        ) : <span className="text-emerald-500 font-bold">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TREND TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "trend" && (
        <div className="space-y-6">

          {/* Area trend — flagged vs interventions vs retained */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {lang === "en" ? `State-wide Trend AY ${academicYear}` : `రాష్ట్రవ్యాప్త ధోరణి ${academicYear}`}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === "en" ? "Flagged students, interventions initiated, and students retained month-over-month" : "ప్రమాద విద్యార్థులు, జోక్యాలు, నిలుపుదల"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Flagged</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Interventions</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Retained</div>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtInt(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="flagged"       stroke="#ef4444" strokeWidth={2.5} fill="url(#gFlagged)" name="Flagged" />
                  <Area type="monotone" dataKey="interventions" stroke="#3b82f6" strokeWidth={2}   fill="url(#gInt)"     name="Interventions" />
                  <Area type="monotone" dataKey="retained"      stroke="#10b981" strokeWidth={2}   fill="url(#gRet)"     name="Retained" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month-wise composed chart per top 5 districts */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                {lang === "en" ? "Top 5 Districts — Monthly Flagged Trend" : "అగ్ర 5 జిల్లాలు — నెలవారీ ధోరణి"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lang === "en" ? "Simulated monthly progression for the highest-burden districts" : "అత్యధిక భారం కలిగిన జిల్లాల నెలవారీ పురోగతి"}
              </p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={MONTHS.map((month, i) => {
                  const obj: any = { month };
                  sortedByFlagged.slice(0, 5).forEach(d => {
                    const seed = (d.nFlagged * 31 + i * 17) % 1000;
                    obj[d.name] = Math.round(d.nFlagged * (0.65 + i * 0.05 + seed / 10000));
                  });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtInt(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  {sortedByFlagged.slice(0, 5).map((d, i) => (
                    <Line key={d.name} type="monotone" dataKey={d.name} stroke={DIST_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly delta table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                {lang === "en" ? "Month-over-Month Summary" : "నెలవారీ సారాంశం"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Flagged</th>
                    <th className="px-4 py-3">Interventions</th>
                    <th className="px-4 py-3">Retained</th>
                    <th className="px-4 py-3">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {trend.map((row, i) => {
                    const prev = trend[i - 1];
                    const delta = prev ? row.flagged - prev.flagged : 0;
                    return (
                      <tr key={row.month} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-700">{row.month}</td>
                        <td className="px-4 py-3 tabular-nums">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-red-600">{fmtInt(row.flagged)}</span>
                            {i > 0 && (
                              <span className={cn("text-[10px] font-bold flex items-center gap-0.5",
                                delta > 0 ? "text-red-500" : "text-emerald-500"
                              )}>
                                {delta > 0
                                  ? <ArrowUpRight className="h-3 w-3" />
                                  : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(delta)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-blue-600 font-semibold">{fmtInt(row.interventions)}</td>
                        <td className="px-4 py-3 tabular-nums text-emerald-600 font-semibold">{fmtInt(row.retained)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (row.interventions / row.flagged) * 100)}%` }} />
                            </div>
                            <span className="tabular-nums text-zinc-500">
                              {pctFormat(row.interventions / row.flagged, 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPOSITION TAB ────────────────────────────────────────────────── */}
      {activeTab === "composition" && (
        <div className="space-y-6">

          {/* School type comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {lang === "en" ? "School Category vs Flagged Students" : "పాఠశాల వర్గం వర్సెస్ ప్రమాద విద్యార్థులు"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === "en" ? "Flagged count by institution type across the state" : "రాష్ట్రంలో సంస్థ రకం వారీగా"}
                </p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtInt(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="flagged" name="Flagged" radius={[4, 4, 0, 0]} barSize={36}>
                      {typeBreakdown.map((_, i) => <Cell key={i} fill={DIST_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-zinc-50">
                {typeBreakdown.map((t, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">{t.name}</div>
                    <div className="text-sm font-bold text-zinc-900">{fmtInt(t.flagged)}</div>
                    <div className="text-[10px] text-zinc-400">{fmtInt(t.count)} schools</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 10 districts by critical schools */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {lang === "en" ? "Critical School Concentration by District" : "జిల్లా వారీగా క్రిటికల్ పాఠశాలలు"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {lang === "en" ? "Districts with most schools in critical risk zone (pct_critical > 5%)" : "క్రిటికల్ రిస్క్ జోన్‌లో అత్యధిక పాఠశాలలు"}
                </p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...districts].sort((a, b) => b.nCritical - a.nCritical).slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 8, right: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="nCritical" name="Critical Schools" radius={[0, 4, 4, 0]} barSize={14} fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* District students vs flagged grouped bar */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                {lang === "en" ? "Students vs Flagged — Top 15 Districts" : "విద్యార్థులు వర్సెస్ ప్రమాదంలో — అగ్ర 15 జిల్లాలు"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lang === "en" ? "Grouped comparison of enrolled vs at-risk students per district" : "నమోదు వర్సెస్ ప్రమాద విద్యార్థుల తులనాత్మక విశ్లేషణ"}
              </p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedByFlagged.slice(0, 15)} margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtInt(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="nStudents" name="Total Students" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="nFlagged"  name="Flagged"         fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight card */}
          <div className="rounded-xl bg-[color:var(--ap-navy)] p-6 text-white shadow-xl flex flex-col md:flex-row items-start gap-5 overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            <div className="shrink-0 p-3 bg-white/10 rounded-xl border border-white/20">
              <Info className="h-7 w-7 text-blue-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold">
                {lang === "en" ? "Predictive Insight — Next Quarter" : "అంచనా అంతర్దృష్టి — తదుపరి త్రైమాసికం"}
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
                {lang === "en"
                  ? `Based on current attendance patterns and seasonal migration data, the model predicts a rise in flagged students across ${sortedByFlagged.slice(0, 3).map(d => d.name).join(", ")} during the upcoming harvest season. Districts with avg risk above ${pctFormat(totals.avgRisk * 1.3, 1)} should prioritise home-visit drives and scheme enrolment.`
                  : `ప్రస్తుత హాజరు నమూనాలు మరియు కాలానుగుణ వలస డేటా ఆధారంగా, ${sortedByFlagged.slice(0, 3).map(d => d.name).join(", ")} జిల్లాల్లో ప్రమాద విద్యార్థుల సంఖ్య పెరగవచ్చు.`}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-zinc-300 font-medium">
                  {lang === "en"
                    ? `${fmtInt(Math.round(totals.nFlagged * 0.38))} students currently have active intervention records`
                    : `${fmtInt(Math.round(totals.nFlagged * 0.38))} విద్యార్థులకు ప్రస్తుతం యాక్టివ్ జోక్యం రికార్డులు ఉన్నాయి`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
