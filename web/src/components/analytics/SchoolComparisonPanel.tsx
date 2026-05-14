"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { SchoolAnalytics } from "@/lib/analytics-types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Cell,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Search, TrendingUp, TrendingDown } from "lucide-react";

const COMP_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[200px]">
      <p className="font-bold text-zinc-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.value > 10 ? p.value.toFixed(1) : p.value}
          {p.name.includes("Rate") || p.name.includes("Risk") || p.name.includes("Attendance") ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

export default function SchoolComparisonPanel({ schools = [] }: { schools: SchoolAnalytics[] }) {
  const { lang } = useLang();
  const [sortBy, setSortBy] = useState<"pctFlagged" | "avgRisk" | "avgAttendance">("pctFlagged");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return schools.filter(sc => sc.schoolName.toLowerCase().includes(s));
  }, [schools, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (sortBy === "avgAttendance") return a.avgAttendance - b.avgAttendance;
      return b[sortBy] - a[sortBy];
    }), [filtered, sortBy]);

  const top10 = useMemo(() => sorted.slice(0, 15), [sorted]);

  const metrics = useMemo(() => {
    const highRisk = schools.filter(s => s.pctFlagged > 0.2);
    const worst = [...schools].sort((a, b) => b.pctFlagged - a.pctFlagged).slice(0, 5);
    const best = [...schools].sort((a, b) => a.pctFlagged - b.pctFlagged).slice(0, 5);
    const fastWorsening = [...schools].sort((a, b) => b.avgRisk - a.avgRisk).slice(0, 5);
    return { highRisk, worst, best, fastWorsening };
  }, [schools]);

  const comparisonData = useMemo(() =>
    schools.map(s => ({
      name: s.schoolName.length > 15 ? s.schoolName.slice(0, 15) + "…" : s.schoolName,
      fullName: s.schoolName,
      "At-Risk %": +(s.pctFlagged * 100).toFixed(1),
      "Avg Risk": +(s.avgRisk * 100).toFixed(1),
      Attendance: +(s.avgAttendance * 100).toFixed(1),
      mandal: s.mandalName,
    })).sort((a, b) => b["At-Risk %"] - a["At-Risk %"]).slice(0, 20),
  [schools]);

  const [selectedMetric, setSelectedMetric] = useState<"At-Risk %" | "Avg Risk" | "Attendance">("At-Risk %");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "High-Risk Schools" : "అధిక-ప్రమాద పాఠశాలలు"}
          </div>
          <div className="text-xl font-bold text-red-600 mt-1">{fmtInt(metrics.highRisk.length)}</div>
          <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mt-1">
            <ArrowUpRight className="h-3 w-3" /> &gt;20% {lang === "en" ? "at-risk" : "ప్రమాదం"}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Worst 5 Avg" : "చెత్త 5 సగటు"}
          </div>
          <div className="text-xl font-bold text-orange-600 mt-1">
            {metrics.worst.length > 0 ? pctFormat(metrics.worst.reduce((s, sc) => s + sc.pctFlagged, 0) / metrics.worst.length, 1) : "—"}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{lang === "en" ? "avg at-risk rate" : "సగటు ప్రమాద రేటు"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Best 5 Avg" : "ఉత్తమ 5 సగటు"}
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {metrics.best.length > 0 ? pctFormat(metrics.best.reduce((s, sc) => s + sc.pctFlagged, 0) / metrics.best.length, 1) : "—"}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{lang === "en" ? "avg at-risk rate" : "సగటు ప్రమాద రేటు"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Highest Risk Schools" : "అత్యధిక రిస్క్ పాఠశాలలు"}
          </div>
          <div className="text-[10px] font-bold text-red-700 mt-1 space-y-0.5">
            {metrics.fastWorsening.slice(0, 3).map(s => (
              <div key={s.schoolId} className="truncate">{s.schoolName}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
              {lang === "en" ? "School Comparison" : "పాఠశాల పోలిక"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {lang === "en" ? "Comparative analysis of schools across key metrics" : "కీలక మెట్రిక్స్‌లో పాఠశాలల తులనాత్మక విశ్లేషణ"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["At-Risk %", "Avg Risk", "Attendance"] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap",
                  selectedMetric === m ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:text-zinc-700"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ bottom: 60, left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 8, fill: "#64748b", fontWeight: 600 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={selectedMetric} radius={[4, 4, 0, 0]} barSize={16}>
                {comparisonData.map((_, i) => (
                  <Cell key={i} fill={COMP_COLORS[i % COMP_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
            {lang === "en" ? "School Ranking" : "పాఠశాల ర్యాంకింగ్"}
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === "en" ? "Search school..." : "పాఠశాల వెతకండి..."}
                className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 w-48"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs rounded-lg border border-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="pctFlagged">{lang === "en" ? "By At-Risk %" : "ప్రమాద % ప్రకారం"}</option>
              <option value="avgRisk">{lang === "en" ? "By Avg Risk" : "సగటు రిస్క్ ప్రకారం"}</option>
              <option value="avgAttendance">{lang === "en" ? "By Attendance" : "హాజరు ప్రకారం"}</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-zinc-50">
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                {["#", lang === "en" ? "School" : "పాఠశాల", lang === "en" ? "Mandal" : "మండలం", lang === "en" ? "Students" : "విద్యార్థులు", lang === "en" ? "At-Risk" : "ప్రమాదంలో", lang === "en" ? "Risk %" : "రిస్క్ %", lang === "en" ? "Avg Risk" : "సగటు రిస్క్", lang === "en" ? "Attendance" : "హాజరు"].map(h => (
                  <th key={h} className="px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sorted.map((s, i) => (
                <tr key={s.schoolId} className={cn("hover:bg-zinc-50/60 transition-colors", i < 3 && "bg-red-50/30")}>
                  <td className="px-3 py-2.5 text-zinc-400 font-bold">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-900 whitespace-nowrap max-w-[200px] truncate">{s.schoolName}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{s.mandalName}</td>
                  <td className="px-3 py-2.5 tabular-nums text-zinc-600">{fmtInt(s.totalStudents)}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-red-600">{fmtInt(s.totalFlagged)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, s.pctFlagged * 100)}%` }} />
                      </div>
                      <span className={cn("tabular-nums font-semibold", s.pctFlagged > 0.2 ? "text-red-600" : s.pctFlagged > 0.1 ? "text-amber-600" : "text-emerald-600")}>
                        {pctFormat(s.pctFlagged, 1)}
                      </span>
                    </div>
                  </td>
                  <td className={cn("px-3 py-2.5 tabular-nums font-semibold", s.avgRisk > 0.12 ? "text-red-600" : s.avgRisk > 0.08 ? "text-orange-500" : "text-emerald-600")}>
                    {pctFormat(s.avgRisk, 1)}
                  </td>
                  <td className={cn("px-3 py-2.5 tabular-nums font-semibold", s.avgAttendance < 0.75 ? "text-red-600" : s.avgAttendance < 0.85 ? "text-amber-600" : "text-emerald-600")}>
                    {pctFormat(s.avgAttendance, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
