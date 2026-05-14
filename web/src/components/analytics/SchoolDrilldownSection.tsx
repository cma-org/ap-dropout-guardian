"use client";
import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { SchoolAnalytics } from "@/lib/analytics-types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Search, ChevronDown, ChevronRight, Building2, Users,
  AlertCircle, TrendingDown, Activity, X, MapPin, Filter,
} from "lucide-react";

export default function SchoolDrilldownSection({ schools = [] }: { schools: SchoolAnalytics[] }) {
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [selectedMandal, setSelectedMandal] = useState<string>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Unique mandal list
  const mandals = useMemo(() => {
    const names = Array.from(new Set(schools.map(s => s.mandalName).filter(Boolean)));
    return names.sort();
  }, [schools]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return schools
      .filter(sc => selectedMandal === "all" || sc.mandalName === selectedMandal)
      .filter(sc => sc.schoolName.toLowerCase().includes(s));
  }, [schools, search, selectedMandal]);

  const selectedSchool = useMemo(() =>
    schools.find(s => s.schoolId === selected),
  [schools, selected]);

  const comparisonData = useMemo(() =>
    selectedSchool ? [
      { metric: lang === "en" ? "This School" : "ఈ పాఠశాల", value: selectedSchool.pctFlagged * 100, fill: "#3b82f6" },
      { metric: lang === "en" ? "Mandal Avg" : "మండల సగటు", value: (() => {
        const mandalSchools = schools.filter(s => s.mandalName === selectedSchool.mandalName);
        return mandalSchools.length > 0
          ? mandalSchools.reduce((sum, s) => sum + s.pctFlagged, 0) / mandalSchools.length * 100
          : 0;
      })(), fill: "#6366f1" },
      { metric: lang === "en" ? "District Avg" : "జిల్లా సగటు", value: (() => {
        return schools.length > 0
          ? schools.reduce((sum, s) => sum + s.pctFlagged, 0) / schools.length * 100
          : 0;
      })(), fill: "#94a3b8" },
    ] : [],
  [selectedSchool, schools, lang]);

  const clearSelection = () => { setSelected(null); setSearch(""); };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

        {/* ── Header row ─────────────────────────────────────────── */}
        <div className="w-full flex items-center justify-between px-5 py-4">
          {/* Left: expand/collapse toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            {expanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
              {lang === "en" ? "School Analytics" : "పాఠశాల విశ్లేషణలు"}
            </h3>
          </button>

          {/* Right: selected school pill with clear button */}
          {selectedSchool && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full pl-2.5 pr-1 py-1 max-w-[260px]">
              <Building2 className="h-3 w-3 shrink-0 text-blue-500" />
              <span className="text-xs font-semibold truncate max-w-[160px]">{selectedSchool.schoolName}</span>
              <button
                onClick={clearSelection}
                title={lang === "en" ? "Clear selection" : "సెలక్షన్ తొలగించు"}
                className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-500 hover:text-blue-700 transition-colors shrink-0 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">

            {/* ── Filter bar ─────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={lang === "en" ? "Search school..." : "పాఠశాల వెతకండి..."}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
              </div>

              {/* Mandal filter */}
              <div className="relative min-w-[160px]">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <select
                  value={selectedMandal}
                  onChange={e => setSelectedMandal(e.target.value)}
                  className="w-full pl-7 pr-7 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">{lang === "en" ? "All Mandals" : "అన్ని మండలాలు"}</option>
                  {mandals.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              </div>

              {/* Active filter badges + clear all */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedMandal !== "all" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full pl-2.5 pr-1.5 py-0.5">
                    <Filter className="h-2.5 w-2.5" />
                    {selectedMandal}
                    <button
                      onClick={() => setSelectedMandal("all")}
                      className="ml-0.5 hover:text-indigo-900"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-full pl-2.5 pr-1.5 py-0.5">
                    "{search}"
                    <button onClick={() => setSearch("")} className="ml-0.5 hover:text-zinc-900">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {(selectedMandal !== "all" || search || selected) && (
                  <button
                    onClick={() => { clearSelection(); setSelectedMandal("all"); }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 font-medium underline underline-offset-2"
                  >
                    {lang === "en" ? "Clear all" : "అన్నీ క్లియర్"}
                  </button>
                )}
              </div>

              {/* Results count */}
              <span className="ml-auto text-[11px] text-zinc-400 font-medium">
                {filtered.length} {lang === "en" ? "schools" : "పాఠశాలలు"}
              </span>
            </div>

            {/* ── School grid / detail view ───────────────────────── */}
            {!selected ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="col-span-3 text-center py-10 text-sm text-zinc-400">
                    {lang === "en" ? "No schools found." : "పాఠశాలలు కనుగొనబడలేదు."}
                  </div>
                ) : (
                  filtered.sort((a, b) => b.pctFlagged - a.pctFlagged).map(s => (
                    <button
                      key={s.schoolId}
                      onClick={() => setSelected(s.schoolId)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all text-left hover:shadow-sm group",
                        s.pctFlagged > 0.2 ? "border-red-200 bg-red-50/50 hover:bg-red-50" :
                        s.pctFlagged > 0.1 ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50/60" :
                        "border-zinc-200 bg-white hover:bg-zinc-50"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-zinc-800 truncate group-hover:text-blue-700 transition-colors">{s.schoolName}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />{s.mandalName} · {fmtInt(s.totalStudents)} {lang === "en" ? "students" : "విద్యార్థులు"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className={cn("font-bold text-sm", s.pctFlagged > 0.2 ? "text-red-600" : s.pctFlagged > 0.1 ? "text-amber-600" : "text-emerald-600")}>
                          {pctFormat(s.pctFlagged, 1)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : selectedSchool ? (
              <div className="space-y-5">
                {/* School detail header */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-blue-900 truncate">{selectedSchool.schoolName}</div>
                    <div className="text-[11px] text-blue-600 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{selectedSchool.mandalName}
                    </div>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-900 bg-white border border-blue-200 hover:border-blue-400 rounded-full px-2.5 py-1 transition-colors shrink-0"
                  >
                    <X className="h-3 w-3" />
                    {lang === "en" ? "Back to list" : "జాబితాకు తిరిగి"}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <Building2 className="h-4 w-4" />, label: lang === "en" ? "School ID" : "పాఠశాల ID", value: `#${selectedSchool.schoolId}`, bg: "bg-blue-50", txt: "text-blue-700" },
                    { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Students" : "విద్యార్థులు", value: fmtInt(selectedSchool.totalStudents), bg: "bg-sky-50", txt: "text-sky-700" },
                    { icon: <AlertCircle className="h-4 w-4" />, label: lang === "en" ? "At-Risk" : "ప్రమాదంలో", value: fmtInt(selectedSchool.totalFlagged), bg: "bg-red-50", txt: "text-red-700" },
                    { icon: <Activity className="h-4 w-4" />, label: lang === "en" ? "Attendance" : "హాజరు", value: pctFormat(selectedSchool.avgAttendance, 1), bg: "bg-emerald-50", txt: "text-emerald-700" },
                  ].map(c => (
                    <div key={c.label} className="rounded-lg border bg-white p-3 shadow-sm">
                      <div className={cn("inline-flex p-1 rounded-lg mb-1.5", c.bg)}>{c.icon}</div>
                      <div className={cn("text-lg font-bold", c.txt)}>{c.value}</div>
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{c.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
                      {lang === "en" ? "Gender Distribution" : "లింగ విభజన"}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{lang === "en" ? "Male" : "మగ"}</span>
                        <span className="font-bold text-zinc-900">{fmtInt(selectedSchool.maleCount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{lang === "en" ? "Female" : "ఆడ"}</span>
                        <span className="font-bold text-zinc-900">{fmtInt(selectedSchool.femaleCount)}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-100">
                        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-blue-500 rounded-l-full" style={{
                            width: `${selectedSchool.totalStudents > 0 ? (selectedSchool.maleCount / selectedSchool.totalStudents) * 100 : 0}%`
                          }} />
                          <div className="h-full bg-pink-500 rounded-r-full" style={{
                            width: `${selectedSchool.totalStudents > 0 ? (selectedSchool.femaleCount / selectedSchool.totalStudents) * 100 : 0}%`
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
                      {lang === "en" ? "Risk Profile" : "రిస్క్ ప్రొఫైల్"}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{lang === "en" ? "At-Risk Rate" : "ప్రమాద రేటు"}</span>
                        <span className={cn("font-bold", selectedSchool.pctFlagged > 0.2 ? "text-red-600" : selectedSchool.pctFlagged > 0.1 ? "text-amber-600" : "text-emerald-600")}>
                          {pctFormat(selectedSchool.pctFlagged, 1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{lang === "en" ? "Avg Risk Score" : "సగటు రిస్క్ స్కోర్"}</span>
                        <span className={cn("font-bold", selectedSchool.avgRisk > 0.12 ? "text-red-600" : selectedSchool.avgRisk > 0.08 ? "text-orange-500" : "text-emerald-600")}>
                          {pctFormat(selectedSchool.avgRisk, 1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{lang === "en" ? "Avg Attendance" : "సగటు హాజరు"}</span>
                        <span className={cn("font-bold", selectedSchool.avgAttendance < 0.75 ? "text-red-600" : selectedSchool.avgAttendance < 0.85 ? "text-amber-600" : "text-emerald-600")}>
                          {pctFormat(selectedSchool.avgAttendance, 1)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-zinc-100">
                        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, selectedSchool.pctFlagged * 100)}%`,
                            background: selectedSchool.pctFlagged > 0.2 ? "#dc2626" : selectedSchool.pctFlagged > 0.1 ? "#f97316" : "#16a34a"
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
                    {lang === "en" ? "Comparison with Mandal & District" : "మండలం మరియు జిల్లాతో పోలిక"}
                  </h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" unit="%" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <YAxis dataKey="metric" type="category" width={100} tick={{ fontSize: 10, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => typeof v === "number" ? `${v.toFixed(1)}%` : String(v)} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {comparisonData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={cn(
                  "rounded-lg border p-3 flex items-center gap-3",
                  selectedSchool.pctFlagged > 0.2 ? "bg-red-50 border-red-200" :
                  selectedSchool.pctFlagged > 0.1 ? "bg-amber-50 border-amber-200" :
                  "bg-emerald-50 border-emerald-200"
                )}>
                  <AlertCircle className={cn(
                    "h-5 w-5 shrink-0",
                    selectedSchool.pctFlagged > 0.2 ? "text-red-500" :
                    selectedSchool.pctFlagged > 0.1 ? "text-amber-500" :
                    "text-emerald-500"
                  )} />
                  <div>
                    <div className="text-xs font-bold text-zinc-800">
                      {selectedSchool.pctFlagged > 0.2
                        ? (lang === "en" ? "Urgent intervention required" : "అత్యవసర జోక్యం అవసరం")
                        : selectedSchool.pctFlagged > 0.1
                        ? (lang === "en" ? "Moderate risk — monitor closely" : "మితమైన ప్రమాదం — నిశితంగా పర్యవేక్షించండి")
                        : (lang === "en" ? "Low risk — continue current measures" : "తక్కువ ప్రమాదం — ప్రస్తుత చర్యలు కొనసాగించండి")}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {selectedSchool.mandalName} · {pctFormat(selectedSchool.avgAttendance, 0)} {lang === "en" ? "attendance" : "హాజరు"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
