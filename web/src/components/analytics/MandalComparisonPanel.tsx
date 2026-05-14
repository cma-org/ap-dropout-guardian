"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { MandalAnalytics } from "@/lib/analytics-types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Cell,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

const MCOLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[200px]">
      <p className="font-bold text-zinc-700 mb-1">{label}</p>
      {payload.map((p: any) => {
        const isRate = p.name?.toLowerCase().includes("rate") || p.dataKey?.toLowerCase().includes("rate");
        let displayValue = p.value;
        
        if (typeof p.value === "number") {
          if (isRate) {
            // Values in this chart are already mapped to 0-100 in topMandals memo
            displayValue = `${p.value.toFixed(1)}%`;
          } else if (p.value > 100) {
            displayValue = fmtInt(p.value);
          }
        }

        return (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {displayValue}
          </p>
        );
      })}
    </div>
  );
}

export default function MandalComparisonPanel({ mandals = [] }: { mandals: MandalAnalytics[] }) {
  const { lang } = useLang();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return mandals.filter(m => m.name.toLowerCase().includes(s));
  }, [mandals, search]);

  const sortedByFlag = useMemo(() =>
    [...filtered].sort((a, b) => b.flagRate - a.flagRate),
  [filtered]);

  const topMandals = useMemo(() => sortedByFlag.slice(0, 10).map(m => ({
    ...m,
    flagRate: m.flagRate * 100
  })), [sortedByFlag]);

  const metrics = useMemo(() => {
    const highRisk = mandals.filter(m => m.flagRate > 0.15);
    const best = [...mandals].sort((a, b) => a.flagRate - b.flagRate).slice(0, 3);
    const worst = [...mandals].sort((a, b) => b.flagRate - a.flagRate).slice(0, 3);
    return { highRisk: highRisk.length, best: best.map(m => m.name), worst: worst.map(m => m.name) };
  }, [mandals]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Total Mandals" : "మొత్తం మండలాలు"}
          </div>
          <div className="text-xl font-bold text-zinc-900 mt-1">{fmtInt(mandals.length)}</div>
          <div className="text-[10px] text-zinc-400 mt-1">{fmtInt(mandals.reduce((s, m) => s + m.schoolCount, 0))} {lang === "en" ? "schools" : "పాఠశాలలు"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "High-Risk Mandals" : "అధిక-ప్రమాద మండలాలు"}
          </div>
          <div className="text-xl font-bold text-red-600 mt-1">{fmtInt(metrics.highRisk)}</div>
          <div className="text-[10px] text-zinc-400 mt-1">&gt;15% {lang === "en" ? "at-risk rate" : "ప్రమాద రేటు"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Best Performing" : "ఉత్తమ ప్రదర్శన"}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1 space-y-0.5">
            {metrics.best.map(n => <div key={n} className="truncate">{n}</div>)}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Needs Attention" : "దృష్టి అవసరం"}
          </div>
          <div className="text-[10px] font-bold text-red-700 mt-1 space-y-0.5">
            {metrics.worst.map(n => <div key={n} className="truncate">{n}</div>)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
            {lang === "en" ? "Mandal Risk Comparison" : "మండల రిస్క్ పోలిక"}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {lang === "en" ? "At-risk rate comparison across all mandals" : "అన్ని మండలాల్లో ప్రమాద రేటు పోలిక"}
          </p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={topMandals} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#475569", fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} unit="%" tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="flagRate" name="At-Risk Rate" radius={[4, 4, 0, 0]} barSize={24}>
                {topMandals.map((_, i) => (
                  <Cell key={i} fill={MCOLORS[i % MCOLORS.length]} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="flagRate" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
            {lang === "en" ? "Mandal Ranking" : "మండల ర్యాంకింగ్"}
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search mandal..." : "మండలం వెతకండి..."}
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 w-48"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50">
                {["#", lang === "en" ? "Mandal" : "మండలం", lang === "en" ? "Schools" : "పాఠశాలలు", lang === "en" ? "Students" : "విద్యార్థులు", lang === "en" ? "Flagged" : "ప్రమాదం", lang === "en" ? "Flag Rate" : "ప్రమాద రేటు", lang === "en" ? "Avg Risk" : "సగటు రిస్క్", lang === "en" ? "Critical Schools" : "క్రిటికల్ పాఠశాలలు"].map(h => (
                  <th key={h} className="px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sortedByFlag.map((m, i) => (
                <tr key={m.name} className={cn("hover:bg-zinc-50/60 transition-colors", i < 3 && "bg-red-50/30")}>
                  <td className="px-3 py-2.5 text-zinc-400 font-bold">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-900 whitespace-nowrap">{m.name}</td>
                  <td className="px-3 py-2.5 tabular-nums text-zinc-600">{fmtInt(m.schoolCount)}</td>
                  <td className="px-3 py-2.5 tabular-nums text-zinc-600">{fmtInt(m.totalStudents)}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-red-600">{fmtInt(m.totalFlagged)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, m.flagRate * 500)}%` }} />
                      </div>
                      <span className={cn("tabular-nums font-semibold", m.flagRate > 0.15 ? "text-red-600" : m.flagRate > 0.08 ? "text-amber-600" : "text-emerald-600")}>
                        {pctFormat(m.flagRate, 1)}
                      </span>
                    </div>
                  </td>
                  <td className={cn("px-3 py-2.5 tabular-nums font-semibold", m.avgRisk > 0.12 ? "text-red-600" : m.avgRisk > 0.08 ? "text-orange-500" : "text-emerald-600")}>
                    {pctFormat(m.avgRisk, 1)}
                  </td>
                  <td className="px-3 py-2.5">
                    {m.criticalSchools > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                        {m.criticalSchools}
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
  );
}
