"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { School, Mandal, Metrics, RiskTier } from "@/lib/types";
import { pctFormat, fmtInt, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, AreaChart, Area,
} from "recharts";
import {
  Bell, AlertTriangle, Globe, Activity, Shield, CheckCircle2,
  ChevronRight, ArrowUpRight, RefreshCw, Wifi, Database, Zap, Download,
} from "lucide-react";

function exportStateCSV(schools: School[]) {
  const header = "district,school_name,mandal,n_students,n_flagged,avg_risk,pct_critical";
  const rows = schools.map((s) =>
    [s.district_name, `"${s.school_name ?? ""}"`, `"${s.mandal_name ?? ""}"`, s.n_students, s.n_flagged, s.avg_risk.toFixed(4), s.pct_critical.toFixed(2)].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `ap_all_schools_risk_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const DEMO_ALERTS = [
  { id: 1, time: "09:42", district: "NTR", school: "K.B.C ZP HS (B) PATAMATA", student: "#778782", tier: "Critical" as RiskTier, driver: "Attendance: 2.8% (extreme absence streak)" },
  { id: 2, time: "09:31", district: "GUNTUR", school: "ZPHS AMARAVATHI", student: "#612903", tier: "Critical" as RiskTier, driver: "Migration flag + family income < ₹1L" },
  { id: 3, time: "09:18", district: "KRISHNA", school: "ZPHS MACHILIPATNAM", student: "#445701", tier: "High" as RiskTier, driver: "FA marks: 22 (below 30 threshold)" },
  { id: 4, time: "09:05", district: "EAST GODAVARI", school: "ZPHS RAJAHMUNDRY RURAL", student: "#334812", tier: "Critical" as RiskTier, driver: "Max consecutive absence: 61 days" },
  { id: 5, time: "08:51", district: "VIZAG", school: "ZPHS GAJUWAKA", student: "#291055", tier: "High" as RiskTier, driver: "Attendance decline trend: -38% MoM" },
  { id: 6, time: "08:44", district: "CHITTOOR", school: "ZPHS TIRUPATI RURAL", student: "#189204", tier: "Critical" as RiskTier, driver: "ST + migration flag + no transport allowance" },
  { id: 7, time: "08:30", district: "KADAPA", school: "ZPHS PRODDATUR", student: "#567812", tier: "High" as RiskTier, driver: "Parent literacy: None + income < ₹1L" },
  { id: 8, time: "08:17", district: "ANANTAPUR", school: "ZPHS HINDUPUR", student: "#123456", tier: "Critical" as RiskTier, driver: "Attendance: 4.2% + FA avg: 18" },
];

function makeStatewidetrend(totalFlagged: number) {
  return MONTHS.map((month, i) => ({
    month,
    flagged: Math.round(totalFlagged * (0.40 + i * 0.080)),
    interventions: Math.round(totalFlagged * 0.03 * (i + 1)),
    resolved: Math.round(totalFlagged * 0.01 * (i + 0.5)),
  }));
}

function districtComparison(schools: School[]) {
  const byDistrict: Record<string, { flagged: number; students: number }> = {};
  for (const s of schools) {
    const d = s.district_name ?? "Unknown";
    if (!byDistrict[d]) byDistrict[d] = { flagged: 0, students: 0 };
    byDistrict[d].flagged += s.n_flagged;
    byDistrict[d].students += s.n_students;
  }
  return Object.entries(byDistrict)
    .map(([district, { flagged, students }]) => ({
      district: district.length > 12 ? district.slice(0, 12) + "…" : district,
      flagged,
      rate: Math.round((flagged / Math.max(students, 1)) * 100),
    }))
    .sort((a, b) => b.flagged - a.flagged)
    .slice(0, 12);
}

export default function RTGSDashboard({
  schools,
  mandals,
  metrics,
}: {
  schools: School[];
  mandals: Mandal[];
  metrics: Metrics;
}) {
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const [alertsVisible, setAlertsVisible] = useState(DEMO_ALERTS.length);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefresh(new Date());
  }, []);
  const [drillDistrict, setDrillDistrict] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const handleRefresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  const totalStudents = schools.reduce((s, sc) => s + sc.n_students, 0);
  const totalFlagged = schools.reduce((s, sc) => s + sc.n_flagged, 0);
  const criticalSchools = schools.filter((s) => s.pct_critical > 5).length;
  const trend = makeStatewidetrend(totalFlagged);
  const distData = districtComparison(schools);

  const drillSchools = drillDistrict
    ? schools.filter((s) => s.district_name === drillDistrict).sort((a, b) => b.n_flagged - a.n_flagged)
    : null;

  const topMandals = mandals.sort((a, b) => b.n_flagged - a.n_flagged).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-[color:var(--ap-navy)]" />
            {T.rtgs.title[lang]}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {T.rtgs.subtitle[lang].replace("{count}", fmtInt(schools.length))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500 bg-zinc-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-zinc-700">{user?.name}</span> · {T.rtgs.sedDept[lang]}
          </div>
          <button
            onClick={() => exportStateCSV(schools)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" /> {T.rtgs.export[lang]}
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {T.rtgs.refresh[lang]}
          </button>
        </div>
      </div>

      {/* System status bar */}
      <div className="rounded-xl border bg-white px-5 py-3 flex flex-wrap items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <Wifi className="h-3.5 w-3.5" />
          <span className="font-medium">{T.rtgs.sysOnline[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Database className="h-3.5 w-3.5" />
          {T.rtgs.lastModel[lang]} <span className="font-medium text-zinc-800">2025-03-31</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Zap className="h-3.5 w-3.5" />
          {T.rtgs.leapApi[lang]} <span className="font-medium text-amber-700">{T.rtgs.mock[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Activity className="h-3.5 w-3.5" />
          {T.rtgs.lastRefresh[lang]} <span className="font-medium text-zinc-800">{lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-zinc-500">
          {T.rtgs.modelDetails[lang]} {pctFormat(metrics.test_oot.recall, 1)} · ROC-AUC {metrics.test_oot.roc_auc.toFixed(3)}
        </div>
      </div>

      {/* State-wide stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: T.rtgs.studentsMonitored[lang], value: fmtInt(totalStudents), sub: T.rtgs.allApSchools[lang], icon: <Globe className="h-5 w-5 text-zinc-400" /> },
          { label: T.rtgs.flaggedRisk[lang], value: fmtInt(totalFlagged), sub: pctFormat(totalFlagged / totalStudents, 1) + " " + T.rtgs.flagRate[lang], icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, tone: "warn" },
          { label: T.rtgs.criticalSchools[lang], value: fmtInt(criticalSchools), sub: T.rtgs.pctCritical[lang], icon: <Shield className="h-5 w-5 text-red-500" />, tone: "bad" },
          { label: T.rtgs.modelRecall[lang], value: pctFormat(metrics.test_oot.recall, 1), sub: T.rtgs.oot[lang], icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, tone: "good" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border bg-white px-4 py-3", s.tone === "bad" ? "border-red-200 bg-red-50/30" : s.tone === "warn" ? "border-amber-200 bg-amber-50/30" : "")}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 font-medium">{s.label}</div>
              {s.icon}
            </div>
            <div className={cn("text-2xl font-bold", s.tone === "bad" ? "text-red-700" : s.tone === "warn" ? "text-amber-700" : s.tone === "good" ? "text-emerald-700" : "text-zinc-900")}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time alert feed */}
        <div className="rounded-xl border bg-white lg:col-span-1">
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-500 animate-pulse" />
              {T.rtgs.liveFeed[lang]}
            </h2>
            <span className="text-[10px] bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
              {alertsVisible} {T.rtgs.newToday[lang]}
            </span>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[480px] overflow-y-auto">
            {DEMO_ALERTS.slice(0, alertsVisible).map((a) => (
              <div key={a.id} className={cn("px-4 py-3", a.tier === "Critical" ? "bg-red-50/40" : "bg-orange-50/20")}>
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0", a.tier === "Critical" ? "bg-red-600 text-white" : "bg-orange-500 text-white")}>
                    {a.tier}
                  </div>
                  <div className="text-[10px] text-zinc-400 tabular-nums">{a.time} AM</div>
                </div>
                <div className="text-xs font-medium text-zinc-800 mt-1.5">{a.student} · {a.district}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{a.school}</div>
                <div className="text-[11px] text-zinc-600 mt-1 italic">{a.driver}</div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-zinc-200 text-xs text-zinc-500 text-center">
            {T.rtgs.feedNote[lang]}
          </div>
        </div>

        {/* Trend + district chart stacked */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-800">{T.rtgs.trendTitle[lang]}</h2>
              <span className="text-xs text-zinc-400 italic">{T.dashboard.simulated[lang]}</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="flagged" stroke="#dc2626" fill="url(#flagGrad)" strokeWidth={2} name={T.common.flagged[lang]} />
                <Line type="monotone" dataKey="interventions" stroke="#16a34a" strokeWidth={2} dot={false} name={T.rtgs.trendInterventions[lang]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-zinc-800">{T.rtgs.distComparison[lang]}</h2>
              {drillDistrict && (
                <button onClick={() => setDrillDistrict(null)} className="text-xs text-[color:var(--ap-navy)] hover:underline">
                  ← {T.rtgs.allDistricts[lang]}
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distData} margin={{ top: 0, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="district" tick={{ fontSize: 9, angle: -45, textAnchor: "end" }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="flagged" name={T.common.flagged[lang]} radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d: any) => d?.district && setDrillDistrict((d.district as string).replace("…", ""))}>
                  {distData.map((d, i) => (
                    <Cell key={i} fill={drillDistrict === d.district ? "#0b3b6f" : i < 4 ? "#dc2626" : i < 8 ? "#f97316" : "#eab308"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-zinc-400 mt-1">{T.rtgs.clickBar[lang]}</p>
          </div>
        </div>
      </div>

      {/* Drill-down: district → schools */}
      {drillDistrict && drillSchools && (
        <div className="rounded-xl border bg-white">
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {T.rtgs.drillDown[lang].replace("{district}", drillDistrict)}
            </h2>
            <span className="text-xs text-zinc-500">{drillSchools.length} {T.nav.schools[lang].toLowerCase()}</span>
          </div>
          <div className="overflow-auto max-h-64">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50">
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                  <th className="px-5 py-2 font-medium">{T.rtgs.tblSchool[lang]}</th>
                  <th className="px-4 py-2 font-medium">{T.rtgs.tblMandal[lang]}</th>
                  <th className="px-4 py-2 font-medium text-right">{T.rtgs.tblStudents[lang]}</th>
                  <th className="px-4 py-2 font-medium text-right">{T.rtgs.tblFlagged[lang]}</th>
                  <th className="px-4 py-2 font-medium text-right">{T.rtgs.tblAvgRisk[lang]}</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {drillSchools.slice(0, 20).map((s) => (
                  <tr key={s.school_id} className="hover:bg-zinc-50">
                    <td className="px-5 py-2 text-zinc-800 max-w-[180px] truncate">{s.school_name ?? "—"}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">{s.mandal_name ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-zinc-700">{fmtInt(s.n_students)}</td>
                    <td className={cn("px-4 py-2 text-right tabular-nums font-medium", s.n_flagged > 10 ? "text-red-600" : "text-amber-600")}>{fmtInt(s.n_flagged)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-zinc-600">{pctFormat(s.avg_risk, 1)}</td>
                    <td className="px-4 py-2">
                    <Link href={`/dashboard/sed/districts/${encodeURIComponent(drillDistrict ?? "")}?id=${s.school_id}`} className="text
          +-[color:var(--ap-navy)] hover:underline text-xs flex items-center gap-1">
                        {T.rtgs.view[lang]} <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top mandals */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-zinc-800 mb-4">{T.rtgs.topMandals[lang]}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topMandals.map((m, i) => (
            <div key={m.mandal_name} className={cn("rounded-lg border p-3", i < 2 ? "border-red-200 bg-red-50/30" : i < 4 ? "border-orange-200 bg-orange-50/20" : "border-zinc-200")}>
              <div className="text-xs font-semibold text-zinc-700 truncate">{m.mandal_name}</div>
              <div className="text-xs text-zinc-500">{m.district_name}</div>
              <div className={cn("text-xl font-bold mt-1", i < 2 ? "text-red-700" : i < 4 ? "text-orange-700" : "text-zinc-800")}>
                {fmtInt(m.n_flagged)}
              </div>
              <div className="text-xs text-zinc-500">{T.rtgs.flaggedOf[lang]} {fmtInt(m.n_students)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LEAP API + closed-loop status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {T.rtgs.leapStatusTitle[lang]}
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { label: T.rtgs.pushFlags[lang], status: T.rtgs.mock[lang], ok: false },
              { label: T.rtgs.pullOutcomes[lang], status: T.rtgs.mock[lang], ok: false },
              { label: T.rtgs.authToken[lang], status: T.rtgs.notConfig[lang], ok: false },
              { label: T.rtgs.webhook[lang], status: T.rtgs.readyConfig[lang], ok: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-zinc-50 border px-3 py-2">
                <span className="text-zinc-700">{item.label}</span>
                <span className={cn("text-xs font-medium", item.ok ? "text-emerald-600" : "text-amber-600")}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3 italic">
            {T.rtgs.leapNote[lang]}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            {T.rtgs.closedLoop[lang]}
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { step: "1", label: T.rtgs.step1[lang], status: T.rtgs.step1stat[lang] },
              { step: "2", label: T.rtgs.step2[lang], status: T.rtgs.step2stat[lang] },
              { step: "3", label: T.rtgs.step3[lang], status: T.rtgs.step3stat[lang] },
              { step: "4", label: T.rtgs.step4[lang], status: T.rtgs.step4stat[lang] },
            ].map((s) => (
              <div key={s.step} className="flex gap-3 items-start rounded-lg bg-zinc-50 border px-3 py-2">
                <div className="h-5 w-5 rounded-full bg-[color:var(--ap-navy)] text-white text-xs flex items-center justify-center shrink-0 font-bold">{s.step}</div>
                <div>
                  <div className="text-zinc-800 font-medium text-xs">{s.label}</div>
                  <div className="text-zinc-500 text-[11px]">{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
