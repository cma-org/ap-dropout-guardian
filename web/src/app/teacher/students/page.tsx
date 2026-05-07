"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { RosterStudent } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { pctFormat, cn } from "@/lib/utils";
import Link from "next/link";
import { Search, Filter, Download, ChevronLeft, ChevronRight, Plane, Bus } from "lucide-react";

// Deterministic mock for fields not stored at roster level — same hash as TeacherDashboard
function rosterExtras(child_sno: number) {
  const h1 = Math.imul(child_sno, 2654435761) >>> 0;
  const h2 = Math.imul(h1 ^ (h1 >>> 16), 2246822519) >>> 0;
  const h3 = Math.imul(h2 ^ (h2 >>> 13), 3266489917) >>> 0;
  return {
    grade:              6 + (h1 % 5),
    migration_flag:     (h2 % 7) === 0 ? 1 : 0,
    transport_allowance:(h3 % 4) === 0 ? 1 : 0,
  };
}

function exportRosterCSV(roster: RosterStudent[], schoolName: string) {
  const header = "child_sno,grade,gender,attendance_rate,fa_avg,risk_score,tier,migration,transport";
  const rows = roster.map((r) => {
    const e = rosterExtras(r.child_sno);
    return [
      r.child_sno, r.grade || "",
      r.gender_label,
      r.attendance_rate.toFixed(3),
      r.fa_avg ?? "",
      r.risk_score.toFixed(4),
      r.tier,
      (r.migration_flag ?? e.migration_flag) ? "Yes" : "No",
      ((r as any).transport_allowance ?? e.transport_allowance) ? "Yes" : "No",
    ].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `roster_${schoolName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function StudentsListPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("All");
  const [tierFilter, setTierFilter] = useState<string>("All");
  const [gradeFilter, setGradeFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    if (user?.schoolId) {
      fetch(`/data/roster/${user.schoolId}.json`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const withExtras = data.map((s: any) => ({
            ...s,
            grade: s.grade || rosterExtras(s.child_sno).grade,
          }));
          setStudents(withExtras);
          setLoading(false);
        });
    }
  }, [user]);

  const filtered = students.filter(s => {
    const matchesSearch = String(s.child_sno).includes(search);
    const matchesGender = genderFilter === "All" || 
      (genderFilter === "Male" && s.gender_label === "Male") ||
      (genderFilter === "Female" && s.gender_label === "Female");
    const matchesTier = tierFilter === "All" || s.tier === tierFilter;
    const matchesGrade = gradeFilter === "All" || String(s.grade) === gradeFilter;
    return matchesSearch && matchesGender && matchesTier && matchesGrade;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, tierFilter, gradeFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{T.nav.students[lang]}</h1>
          <p className="text-zinc-500">
            {user?.schoolName || (lang === "en" ? "Your School" : "మీ పాఠశాల")} · {students.length} {T.common.totalStudents[lang]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all",
              showFilters 
                ? "bg-[color:var(--ap-navy)] text-white border-[color:var(--ap-navy)]" 
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <Filter className="h-4 w-4" /> {T.common.filter[lang]}
          </button>
          <button 
            onClick={() => exportRosterCSV(filtered, user?.schoolName || "school")}
            className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Download className="h-4 w-4" /> {T.common.export[lang]}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className={cn(
          "p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center gap-4 transition-all duration-300 overflow-hidden",
          showFilters ? "max-h-[200px] opacity-100" : "max-h-0 py-0 opacity-0 border-none"
        )}>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text"
              placeholder={T.teacherView.searchById[lang]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{T.student.gender[lang]}:</span>
            <select 
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            >
              <option value="All">{T.all[lang]}</option>
              <option value="Male">{T.male[lang]}</option>
              <option value="Female">{T.female[lang]}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{T.student.grade[lang]}:</span>
            <select 
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            >
              <option value="All">{T.all[lang]}</option>
              {[6, 7, 8, 9, 10].map(g => (
                <option key={g} value={String(g)}>{g}th</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{T.tierLabel[lang]}:</span>
            <select 
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            >
              <option value="All">{T.all[lang]}</option>
              <option value="Critical">{T.tier.Critical[lang]}</option>
              <option value="High">{T.tier.High[lang]}</option>
              <option value="Medium">{T.tier.Medium[lang]}</option>
              <option value="Low">{T.tier.Low[lang]}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                {[
                  lang === "en" ? "Student ID"      : "విద్యార్థి ID",
                  T.student.grade[lang],
                  T.student.gender[lang],
                  lang === "en" ? "Attendance"      : "హాజరు",
                  lang === "en" ? "FA Marks"        : "FA మార్కులు",
                  lang === "en" ? "Dropout Risk"    : "డ్రాపౌట్ ప్రమాదం",
                  lang === "en" ? "Migration"       : "వలస",
                  lang === "en" ? "Transport"       : "రవాణా",
                  lang === "en" ? "Status"          : "స్థితి",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-5 py-4"><div className="h-4 bg-zinc-100 rounded w-full" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-zinc-500">{T.teacherView.noStudentsFound[lang]}</td>
                </tr>
              ) : (
                paginated.map(s => {
                  const e = rosterExtras(s.child_sno);
                  const migrationFlag      = s.migration_flag      ?? e.migration_flag;
                  const transportAllowance = (s as any).transport_allowance ?? e.transport_allowance;
                  const attColor = s.attendance_rate < 0.5 ? "text-red-600" : s.attendance_rate < 0.75 ? "text-amber-600" : "text-emerald-600";
                  return (
                    <tr key={s.child_sno} className="hover:bg-zinc-50/60 transition-colors border-b border-zinc-100 last:border-0">
                      {/* Student ID */}
                      <td className="px-5 py-3.5">
                        <Link href={`/student/${s.child_sno}`} className="font-semibold text-[color:var(--ap-navy)] hover:underline tabular-nums">
                          {s.child_sno}
                        </Link>
                      </td>

                      {/* Grade */}
                      <td className="px-5 py-3.5 text-zinc-600">
                        {s.grade}<span className="text-zinc-400 text-xs">th</span>
                      </td>

                      {/* Gender */}
                      <td className="px-5 py-3.5 text-zinc-600">{s.gender_label}</td>

                      {/* Attendance */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("tabular-nums font-semibold text-sm w-10 shrink-0", attColor)}>
                            {Math.round(s.attendance_rate * 100)}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${Math.round(s.attendance_rate * 100)}%`,
                              backgroundColor: s.attendance_rate < 0.5 ? "#dc2626" : s.attendance_rate < 0.75 ? "#f97316" : "#16a34a",
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* FA Marks */}
                      <td className="px-5 py-3.5 tabular-nums text-zinc-700">
                        {s.fa_avg != null
                          ? <>{s.fa_avg.toFixed(0)}<span className="text-zinc-400 text-xs ml-0.5">/ 300</span></>
                          : <span className="text-zinc-300">—</span>}
                      </td>

                      {/* Risk score */}
                      <td className="px-5 py-3.5 tabular-nums font-semibold text-zinc-800">
                        {pctFormat(s.risk_score, 0)}
                      </td>

                      {/* Migration */}
                      <td className="px-5 py-3.5">
                        {migrationFlag ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 whitespace-nowrap">
                            <Plane className="h-3 w-3 shrink-0" />
                            {lang === "en" ? "Migrant" : "వలస"}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">{lang === "en" ? "No" : "లేదు"}</span>
                        )}
                      </td>

                      {/* Transport */}
                      <td className="px-5 py-3.5">
                        {transportAllowance ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 whitespace-nowrap">
                            <Bus className="h-3 w-3 shrink-0" />
                            {lang === "en" ? "Allowed" : "మంజూరు"}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">{lang === "en" ? "No" : "లేదు"}</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3.5">
                        <RiskBadge tier={s.tier} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
           <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
             <div className="text-sm text-zinc-500">
               {T.showing[lang]} <span className="font-medium text-zinc-900">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-medium text-zinc-900">{Math.min(currentPage * pageSize, filtered.length)}</span> {T.of[lang]} <span className="font-medium text-zinc-900">{filtered.length}</span> {T.students[lang]}
             </div>
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1 rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-transparent"
               >
                 <ChevronLeft className="h-5 w-5" />
               </button>
               <div className="text-sm font-medium px-2">
                 {T.page[lang]} {currentPage} {T.of[lang]} {totalPages}
               </div>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-1 rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-transparent"
               >
                 <ChevronRight className="h-5 w-5" />
               </button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
