"use client";
import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { MandalAnalytics, SchoolAnalytics } from "@/lib/analytics-types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Search, ChevronDown, ChevronRight, Building2, Users, AlertCircle, TrendingDown, ArrowUpRight, X } from "lucide-react";

const PIECHART_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7"];

export default function MandalDrilldownSection({
  mandals = [],
  schools = [],
}: {
  mandals: MandalAnalytics[];
  schools: SchoolAnalytics[];
}) {
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return mandals.filter(m => m.name.toLowerCase().includes(s));
  }, [mandals, search]);

  const selectedMandal = useMemo(() =>
    mandals.find(m => m.name === selected),
  [mandals, selected]);

  const mandalSchools = useMemo(() =>
    selectedMandal
      ? schools.filter(s => s.mandalName === selectedMandal.name)
          .sort((a, b) => b.pctFlagged - a.pctFlagged)
      : [],
  [schools, selectedMandal]);

  const mandalRiskColors = (rate: number) =>
    rate > 0.15 ? "text-red-600" : rate > 0.08 ? "text-amber-600" : "text-emerald-600";

  const schoolRiskColors = (pct: number) =>
    pct > 0.2 ? "text-red-600" : pct > 0.1 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
              {lang === "en" ? "Mandal Analytics" : "మండల విశ్లేషణలు"}
            </h3>
          </div>
          {selectedMandal && (
            <div 
              onClick={(e) => { e.stopPropagation(); setSelected(null); setSearch(""); }}
              className="group flex items-center gap-1.5 text-[10px] font-bold text-[color:var(--ap-navy)] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors cursor-pointer"
              title={lang === "en" ? "Clear selection" : "ఎంపికను క్లియర్ చేయండి"}
            >
              {selectedMandal.name}
              <X className="h-3 w-3 text-blue-400 group-hover:text-blue-600" />
            </div>
          )}
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={lang === "en" ? "Search mandal..." : "మండలం వెతకండి..."}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              {selected && (
                <button 
                  onClick={() => { setSelected(null); setSearch(""); }} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-lg font-bold transition-all border border-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                  {lang === "en" ? "Clear Filter" : "ఫిల్టర్ క్లియర్"}
                </button>
              )}
            </div>

            {!selected ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {filtered.map(m => (
                  <button
                    key={m.name}
                    onClick={() => setSelected(m.name)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all text-left",
                      "hover:border-zinc-300 hover:shadow-sm",
                      m.flagRate > 0.15 ? "border-red-200 bg-red-50/50" :
                      m.flagRate > 0.08 ? "border-amber-200 bg-amber-50/30" :
                      "border-zinc-200 bg-white"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-zinc-800 truncate">{m.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{fmtInt(m.schoolCount)} schools · {fmtInt(m.totalStudents)} students</div>
                    </div>
                    <span className={cn("font-bold ml-2", mandalRiskColors(m.flagRate))}>{pctFormat(m.flagRate, 1)}</span>
                  </button>
                ))}
              </div>
            ) : selectedMandal ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <Building2 className="h-4 w-4" />, label: lang === "en" ? "Schools" : "పాఠశాలలు", value: fmtInt(selectedMandal.schoolCount), bg: "bg-blue-50", txt: "text-blue-700" },
                    { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Students" : "విద్యార్థులు", value: fmtInt(selectedMandal.totalStudents), bg: "bg-sky-50", txt: "text-sky-700" },
                    { icon: <AlertCircle className="h-4 w-4" />, label: lang === "en" ? "At-Risk Rate" : "ప్రమాద రేటు", value: pctFormat(selectedMandal.flagRate, 1), bg: "bg-red-50", txt: "text-red-700" },
                    { icon: <TrendingDown className="h-4 w-4" />, label: lang === "en" ? "Avg Risk" : "సగటు రిస్క్", value: pctFormat(selectedMandal.avgRisk, 1), bg: "bg-amber-50", txt: "text-amber-700" },
                  ].map(c => (
                    <div key={c.label} className="rounded-lg border bg-white p-3 shadow-sm">
                      <div className={cn("inline-flex p-1 rounded-lg mb-1.5", c.bg)}>{c.icon}</div>
                      <div className={cn("text-lg font-bold", c.txt)}>{c.value}</div>
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{c.label}</div>
                    </div>
                  ))}
                </div>

                {mandalSchools.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                      {lang === "en" ? "Schools in this Mandal" : "ఈ మండలంలోని పాఠశాలలు"}
                    </h4>
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                      {mandalSchools.map(s => (
                        <div key={s.schoolId} className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg border text-xs",
                          s.pctFlagged > 0.2 ? "border-red-200 bg-red-50/40" : "border-zinc-100 bg-white"
                        )}>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-zinc-800 truncate">{s.schoolName}</div>
                            <div className="text-[10px] text-zinc-400">{fmtInt(s.totalStudents)} students · {pctFormat(s.avgAttendance, 0)} attendance</div>
                          </div>
                          <div className="flex items-center gap-3 ml-3">
                            <span className="text-zinc-400">{fmtInt(s.totalFlagged)}</span>
                            <span className={cn("font-bold w-12 text-right", schoolRiskColors(s.pctFlagged))}>{pctFormat(s.pctFlagged, 1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMandal.criticalSchools > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-red-800">
                        {fmtInt(selectedMandal.criticalSchools)} {lang === "en" ? "schools need urgent intervention" : "పాఠశాలలకు అత్యవసర జోక్యం అవసరం"}
                      </div>
                      <div className="text-[10px] text-red-600">{lang === "en" ? "Critical risk level detected" : "క్రిటికల్ రిస్క్ స్థాయి కనుగొనబడింది"}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
