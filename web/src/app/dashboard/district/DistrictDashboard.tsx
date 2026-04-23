"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { School, Mandal, RiskTier } from "@/lib/types";
import { pctFormat, fmtInt, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import {
  MapPin, School as SchoolIcon, AlertTriangle, Users,
  TrendingDown, ArrowUpRight, Activity, Download,
} from "lucide-react";

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const RISK_COLORS = ["#dc2626", "#f97316", "#eab308", "#16a34a"];

function districtTrend(n_flagged: number) {
  return MONTHS.map((month, i) => ({
    month,
    flagged: Math.max(1, Math.round(n_flagged * (0.45 + i * 0.074))),
    interventions: Math.round(n_flagged * 0.05 * (i + 1)),
  }));
}

type SortKey = "n_flagged" | "avg_risk" | "pct_critical" | "n_students";

export default function DistrictDashboard({
  schools,
  mandals,
  districtName,
  allSchools,
}: {
  schools: School[];
  mandals: Mandal[];
  districtName: string;
  allSchools: School[];
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("n_flagged");
  const [search, setSearch] = useState("");
  const [selectedMandal, setSelectedMandal] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const totalStudents = schools.reduce((s, sc) => s + sc.n_students, 0);
  const totalFlagged = schools.reduce((s, sc) => s + sc.n_flagged, 0);
  const totalCritical = schools.filter((s) => s.pct_critical > 0 && s.n_flagged > 0).length;
  const avgRisk = schools.length ? schools.reduce((s, sc) => s + sc.avg_risk, 0) / schools.length : 0;
  const trend = districtTrend(totalFlagged);

  const filtered = schools
    .filter((s) => {
      if (selectedMandal && s.mandal_name !== selectedMandal) return false;
      if (search && !s.school_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const mandalData = mandals
    .sort((a, b) => b.avg_risk - a.avg_risk)
    .slice(0, 10)
    .map((m) => ({ name: m.mandal_name ?? "Unknown", flagged: m.n_flagged, risk: Math.round(m.avg_risk * 100) }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[color:var(--ap-navy)]" />
            District Officer Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {districtName} District · {schools.length} schools · AY 2024-25
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500 bg-zinc-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-zinc-700">{user?.name}</span> · District Officer
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-50">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Alert */}
      {totalCritical > 0 && (
        <div className="rounded-xl border-2 border-orange-400 bg-orange-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-900">
              {totalCritical} schools in {districtName} have Critical-tier students — {fmtInt(totalFlagged)} total flagged
            </div>
            <div className="text-sm text-orange-700 mt-0.5">
              Schools sorted by risk below. Drill into any school to see individual student profiles.
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total students", value: fmtInt(totalStudents), icon: <Users className="h-5 w-5 text-zinc-400" />, sub: `Across ${schools.length} schools` },
          { label: "Flagged at-risk", value: fmtInt(totalFlagged), icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, sub: pctFormat(totalFlagged / Math.max(totalStudents, 1), 1) + " flag rate", tone: "warn" },
          { label: "Schools with Critical", value: fmtInt(totalCritical), icon: <SchoolIcon className="h-5 w-5 text-red-500" />, sub: "Need HM escalation", tone: "bad" },
          { label: "District avg risk", value: pctFormat(avgRisk, 1), icon: <Activity className="h-5 w-5 text-zinc-400" />, sub: "Mean risk score", tone: avgRisk > 0.15 ? "warn" : "good" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mandal risk bar chart */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-zinc-800 mb-4">Top mandals by flagged students</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mandalData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="flagged" name="Flagged" radius={[0, 4, 4, 0]}>
                {mandalData.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? "#dc2626" : i < 6 ? "#f97316" : "#eab308"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">District trend — flagged vs interventions</h2>
            <span className="text-xs text-zinc-400 italic">Simulated</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="flagged" stroke="#dc2626" strokeWidth={2} dot={false} name="Flagged" />
              <Line type="monotone" dataKey="interventions" stroke="#16a34a" strokeWidth={2} dot={false} name="Interventions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* School drill-down table */}
      <div className="rounded-xl border bg-white">
        <div className="px-5 py-4 border-b border-zinc-200">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              School drill-down
            </h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school…"
              className="ml-auto px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]"
            />
            <select
              value={selectedMandal ?? ""}
              onChange={(e) => setSelectedMandal(e.target.value || null)}
              className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:outline-none"
            >
              <option value="">All mandals</option>
              {[...new Set(schools.map((s) => s.mandal_name).filter(Boolean))].sort().map((m) => (
                <option key={m!} value={m!}>{m}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:outline-none"
            >
              <option value="n_flagged">Sort: Flagged count</option>
              <option value="avg_risk">Sort: Avg risk</option>
              <option value="pct_critical">Sort: % Critical</option>
              <option value="n_students">Sort: Size</option>
            </select>
          </div>
        </div>
        <div className="overflow-auto max-h-[480px]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 z-10">
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                <th className="px-5 py-2 font-medium">School</th>
                <th className="px-4 py-2 font-medium">Mandal</th>
                <th className="px-4 py-2 font-medium text-right">Students</th>
                <th className="px-4 py-2 font-medium text-right">Flagged</th>
                <th className="px-4 py-2 font-medium text-right">Avg risk</th>
                <th className="px-4 py-2 font-medium text-right">% Critical</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.slice(0, 40).map((s) => (
                <tr key={s.school_id} className="hover:bg-zinc-50">
                  <td className="px-5 py-2.5 text-zinc-800 font-medium max-w-[200px] truncate">{s.school_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-zinc-500 text-xs">{s.mandal_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{fmtInt(s.n_students)}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums font-medium", s.n_flagged > 10 ? "text-red-600" : "text-amber-600")}>
                    {fmtInt(s.n_flagged)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600">{pctFormat(s.avg_risk, 1)}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", s.pct_critical > 5 ? "text-red-600 font-medium" : "text-zinc-600")}>
                    {s.pct_critical.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href="/teacher" className="text-[color:var(--ap-navy)] hover:underline text-xs flex items-center gap-1">
                      View <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 border-t border-zinc-200 text-xs text-zinc-500">
          Showing {Math.min(40, filtered.length)} of {filtered.length} schools
        </div>
      </div>
    </div>
  );
}
