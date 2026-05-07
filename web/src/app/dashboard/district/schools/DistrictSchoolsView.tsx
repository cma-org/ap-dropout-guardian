"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { School, RosterStudent, RiskTier } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import { Search, Users, AlertCircle, Download, User, BarChart2, TrendingUp, School as SchoolIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";

function exportRosterCSV(roster: RosterStudent[], schoolName: string) {
  const header = "child_sno,gender,attendance_rate,fa_avg,risk_score,tier";
  const rows = roster.map((r) =>
    [r.child_sno, r.gender_label, r.attendance_rate.toFixed(3), r.fa_avg ?? "", r.risk_score.toFixed(4), r.tier].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `roster_${schoolName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
function schoolTrend(n_flagged: number) {
  return MONTHS.map((month, i) => {
    const isLastMonth = i === MONTHS.length - 1;
    // Deterministic attendance value seeded on n_flagged + month index — avoids SSR/client mismatch
    const attendance = 85 + ((n_flagged * 31 + i * 17) % 100) / 10;
    return {
      month,
      flagged: isLastMonth ? n_flagged : Math.max(1, Math.round(n_flagged * (0.6 + Math.sin(i) * 0.2))),
      attendance: Math.min(100, attendance),
    };
  });
}

type SimRosterStudent = RosterStudent & { _sim?: true };

function generateSimulatedRoster(school: School, existing: RosterStudent[] = []): SimRosterStudent[] {
  const roster: SimRosterStudent[] = [...existing];
  const tiers: RiskTier[] = ["Critical", "High", "Medium", "Low"];

  // If we have no existing data, first simulate the flagged ones
  if (roster.length === 0 && school.n_flagged > 0) {
    for (let i = 0; i < school.n_flagged; i++) {
      const tierIdx = i < Math.ceil(school.n_flagged * 0.2) ? 0 : (i < Math.ceil(school.n_flagged * 0.5) ? 1 : 2);
      roster.push({
        child_sno: 500000 + Math.floor(Math.random() * 400000),
        gender_label: Math.random() > 0.5 ? "Male" : "Female",
        attendance_rate: 0.4 + Math.random() * 0.5,
        fa_avg: 40 + Math.random() * 100,
        risk_score: 0.6 + Math.random() * 0.35,
        tier: tiers[tierIdx],
        _sim: true,
      });
    }
  }

  // Then pad with "Normal" (Low risk) students up to n_students
  const targetCount = Math.max(school.n_students, roster.length);
  const remaining = targetCount - roster.length;
  if (remaining > 0) {
    for (let i = 0; i < remaining; i++) {
      roster.push({
        child_sno: 100000 + Math.floor(Math.random() * 400000),
        gender_label: Math.random() > 0.5 ? "Male" : "Female",
        attendance_rate: 0.85 + Math.random() * 0.15,
        fa_avg: 120 + Math.random() * 80,
        risk_score: 0.01 + Math.random() * 0.15,
        tier: "Low",
        _sim: true,
      });
    }
  }

  // Sort by risk score descending
  return roster.sort((a, b) => b.risk_score - a.risk_score);
}

export default function DistrictSchoolsView({ schools }: { schools: School[] }) {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number>(() => {
    const idParam = searchParams.get("id");
    if (idParam) return Number(idParam);
    return schools[0]?.school_id ?? 0;
  });

  // Keep track of the last ID from URL to avoid re-selecting if user manually switched
  const [lastUrlId, setLastUrlId] = useState<string | null>(searchParams.get("id"));

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam !== lastUrlId) {
      setLastUrlId(idParam);
      if (idParam) {
        setSelectedId(Number(idParam));
      }
    }
  }, [searchParams, lastUrlId]);

  const [roster, setRoster] = useState<SimRosterStudent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<RiskTier | "All">("All");
  const [gradeFilter, setGradeFilter] = useState<number | "All">("All");

  const selected = schools.find((s) => s.school_id === selectedId);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!listRef.current || !selectedId) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-school-id="${selectedId}"]`);
    if (el) listRef.current.scrollTop = el.offsetTop - listRef.current.offsetTop;
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setRoster(null); // Reset roster while loading new school
    fetch(`/data/roster/${selectedId}.json`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data: RosterStudent[] | null) => {
        if (selected) {
          // Always pad to full n_students even if we have some data
          setRoster(generateSimulatedRoster(selected, data ?? []));
        } else {
          setRoster([]);
        }
      })
      .catch((err) => {
        // Only log actual parsing errors, not missing files
        if (err instanceof SyntaxError) {
          console.error("Error parsing roster JSON:", err);
        }
        if (selected) {
          setRoster(generateSimulatedRoster(selected));
        } else {
          setRoster([]);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const filteredSchools = useMemo(() => {
    if (!search) return schools;
    const q = search.toLowerCase();
    return schools.filter(
      (s) =>
        (s.school_name ?? "").toLowerCase().includes(q) ||
        (s.district_name ?? "").toLowerCase().includes(q) ||
        (s.mandal_name ?? "").toLowerCase().includes(q)
    );
  }, [schools, search]);

  const trendData = useMemo(() => {
    if (!selected) return [];
    return schoolTrend(selected.n_flagged);
  }, [selected]);

  // Simulated data for Headmaster and Teachers
  const hmName = selected ? `HM. ${selected.school_name?.split(' ').pop() || "Principal"}` : "";
  const nTeachers = selected ? Math.max(5, Math.floor(selected.n_students / 30)) : 0;

  // District aggregate stats
  const districtStats = useMemo(() => {
    return {
      totalSchools: schools.length,
      totalStudents: schools.reduce((acc, s) => acc + s.n_students, 0),
      totalFlagged: schools.reduce((acc, s) => acc + s.n_flagged, 0),
      avgRisk: schools.length > 0 ? schools.reduce((acc, s) => acc + s.avg_risk, 0) / schools.length : 0,
    };
  }, [schools]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <SchoolIcon className="h-6 w-6 text-[color:var(--ap-navy)]" />
          {lang === "en" ? "Schools" : "పాఠశాలలు"}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {lang === "en" 
            ? "Detailed analytics and student roster for all schools in the district." 
            : "జిల్లాలోని అన్ని పాఠశాలల వివరణాత్మక విశ్లేషణలు మరియు విద్యార్థుల జాబితా."}
        </p>
      </div>

      {/* District Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Schools</div>
          <div className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <SchoolIcon className="h-5 w-5 text-zinc-400" />
            {fmtInt(districtStats.totalSchools)}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Students</div>
          <div className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-400" />
            {fmtInt(districtStats.totalStudents)}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">District Flagged</div>
          <div className="text-xl font-bold text-red-600">
            {fmtInt(districtStats.totalFlagged)}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">District Avg Risk</div>
          <div className="text-xl font-bold text-zinc-900">
            {pctFormat(districtStats.avgRisk, 1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 min-h-[calc(100vh-200px)]">
        {/* School selector sidebar */}
        <aside className="rounded-xl border bg-white overflow-hidden flex flex-col max-h-[calc(100vh-160px)]">
          <div className="px-4 py-3 border-b bg-zinc-50">
            <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">
              Select School
            </label>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/30"
                placeholder={lang === "en" ? "Search school / mandal" : "పాఠశాల / మండలం"}
              />
            </div>
          </div>
          <div ref={listRef} className="overflow-auto flex-1 divide-y divide-zinc-100">
            {filteredSchools.map((s) => (
              <button
                key={s.school_id}
                data-school-id={s.school_id}
                onClick={() => setSelectedId(s.school_id)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors",
                  s.school_id === selectedId && "bg-blue-50 border-l-4 border-l-[color:var(--ap-navy)]"
                )}
              >
                <div className="text-sm font-medium text-zinc-900 truncate">{s.school_name}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {s.district_name} · {s.mandal_name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-red-700">
                    <AlertCircle className="h-3 w-3" />
                    {fmtInt(s.n_flagged)} flagged
                  </span>
                  <span className="text-xs text-zinc-400">· {fmtInt(s.n_students)} students</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content panel */}
        <section className="space-y-5 overflow-auto max-h-[calc(100vh-160px)] pr-2">
        {selected ? (
          <>
            {/* Header Stats */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">{selected.school_name}</h1>
                  <div className="text-sm text-zinc-500 mt-1">
                    {selected.district_name} District · {selected.mandal_name} Mandal · School ID: {selected.school_id}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Students</div>
                    <div className="text-xl font-bold text-zinc-900 flex items-center justify-end gap-2">
                      <Users className="h-5 w-5 text-zinc-400" />
                      {fmtInt(selected.n_students)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Flagged</div>
                    <div className="text-xl font-bold text-red-600">{fmtInt(selected.n_flagged)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Avg Risk</div>
                    <div className="text-xl font-bold text-zinc-900">{pctFormat(selected.avg_risk, 0)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-5">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="p-2 bg-white rounded-full shadow-sm border border-zinc-200">
                    <User className="h-4 w-4 text-[color:var(--ap-navy)]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Headmaster</div>
                    <div className="text-sm font-semibold text-zinc-900">{hmName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="p-2 bg-white rounded-full shadow-sm border border-zinc-200">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Teachers</div>
                    <div className="text-sm font-semibold text-zinc-900">{nTeachers} Teachers</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="p-2 bg-white rounded-full shadow-sm border border-zinc-200">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Risk Status</div>
                    <div className={cn(
                      "text-sm font-semibold",
                      selected.n_flagged > 10 ? "text-red-600" : "text-emerald-600"
                    )}>
                      {selected.n_flagged > 10 ? "Requires Attention" : "Stable"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-xl border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Flagged Students Trend
                  </h3>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter italic">Simulated</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="flagged" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Flagged" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Avg. Attendance Trend
                  </h3>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter italic">Simulated</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Roster Section */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Student Roster
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search ID…"
                      className="w-full pl-8 pr-3 py-1 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/30"
                    />
                  </div>
                  <div className="flex gap-1">
                    {(["All", "Critical", "High", "Medium", "Low"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTierFilter(t)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition",
                          tierFilter === t ? "bg-[color:var(--ap-navy)] text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 border-l pl-2">
                    {(["All", 6, 7, 8, 9, 10] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGradeFilter(g)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition",
                          gradeFilter === g ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        )}
                      >
                        {g === "All" ? "All" : `${g}th`}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => exportRosterCSV(roster || [], selected?.school_name ?? "school")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-300 text-[10px] font-bold uppercase text-zinc-600 hover:bg-zinc-50"
                  >
                    <Download className="h-3 w-3" /> CSV
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : roster && roster.length > 0 ? (() => {
                const filtered = roster.filter((r) => {
                  if (tierFilter !== "All" && r.tier !== tierFilter) return false;
                  if (gradeFilter !== "All" && r.grade !== gradeFilter) return false;
                  if (studentSearch && !String(r.child_sno).includes(studentSearch)) return false;
                  return true;
                });
                return (
                  <>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e5e7eb]">
                          <tr className="text-left text-zinc-400 uppercase font-bold tracking-wider">
                            <th className="py-2 pr-4 font-bold">Child ID</th>
                            <th className="py-2 px-3 font-bold">Grade</th>
                            <th className="py-2 px-3 font-bold">Gender</th>
                            <th className="py-2 px-3 font-bold text-right">Attendance</th>
                            <th className="py-2 px-3 font-bold text-right">FA Marks</th>
                            <th className="py-2 px-3 font-bold text-right">Risk</th>
                            <th className="py-2 pl-3 font-bold">Tier</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice(0, 200).map((r) => (
                            <tr key={r.child_sno} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                              <td className="py-2 pr-4">
                                {r._sim ? (
                                  <span className="text-zinc-400 font-bold">{r.child_sno}</span>
                                ) : (
                                  <Link href={`/student/${r.child_sno}`} className="text-[color:var(--ap-navy)] hover:underline font-bold">
                                    {r.child_sno}
                                  </Link>
                                )}
                              </td>
                              <td className="py-2 px-3 text-zinc-600 font-medium">{r.grade}th</td>
                              <td className="py-2 px-3 text-zinc-600">{r.gender_label}</td>
                              <td className="py-2 px-3 text-right tabular-nums text-zinc-600">{pctFormat(r.attendance_rate, 0)}</td>
                              <td className="py-2 px-3 text-right tabular-nums text-zinc-600">
                                {r.fa_avg === null ? "—" : r.fa_avg.toFixed(0)}
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums font-bold text-zinc-900">
                                {pctFormat(r.risk_score, 0)}
                              </td>
                              <td className="py-2 pl-3">
                                <RiskBadge tier={r.tier} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-4 font-medium italic">
                      Showing {Math.min(filtered.length, 200)} of {filtered.length} students
                      {(tierFilter !== "All" || gradeFilter !== "All" || studentSearch) ? ` (filtered from ${roster.length})` : ""}
                    </div>
                  </>
                );
              })() : (
                <div className="text-sm text-zinc-500 py-12 text-center bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <Users className="h-10 w-10 text-zinc-300" />
                  <div className="font-medium">
                    {selected.n_students > 0 
                      ? (lang === "en" ? `Detailed student list not available for ${selected.school_name}` : `${selected.school_name} కోసం పూర్తి విద్యార్థుల జాబితా అందుబాటులో లేదు`)
                      : (lang === "en" ? "No students found in this school" : "ఈ పాఠశాలలో విద్యార్థులు లేరు")}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {lang === "en" ? "This school has no students marked as at-risk." : "ఈ పాఠశాలలో ప్రమాదంలో ఉన్న విద్యార్థులు ఎవరూ లేరు."}
                  </p>
                </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-zinc-500 py-8 text-center">
            Pick a school from the sidebar to view detailed analytics and student roster.
          </div>
        )}
      </section>
    </div>
  </div>
);
}
