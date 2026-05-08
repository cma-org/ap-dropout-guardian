"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { RosterStudent } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { pctFormat, fmtInt, cn } from "@/lib/utils";
import Link from "next/link";
import { Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";

export default function HMStudentsListPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("All");
  const [tierFilter, setTierFilter] = useState<string>("All");
  const [gradeFilter, setGradeFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const pageSize = 15;

  useEffect(() => {
    if (user?.schoolId) {
      fetch(`/api/schools/${user.schoolId}/roster`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          // Inject mock grades for consistency with dashboard logic
          const dataWithGrades = data.map((s: any, i: number) => ({
            ...s,
            grade: i < data.length / 3 ? 8 : i < (2 * data.length) / 3 ? 9 : 10
          }));
          setStudents(dataWithGrades);
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
    const matchesGrade = gradeFilter === "All" || (s.grade && s.grade.toString() === gradeFilter);
    return matchesSearch && matchesGender && matchesTier && matchesGrade;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, tierFilter]);

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
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90">
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{T.grade[lang]}:</span>
            <select 
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            >
              <option value="All">{T.all[lang]}</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                <th className="px-6 py-3">{lang === "en" ? "Student ID" : "విద్యార్థి ID"}</th>
                <th className="px-6 py-3">{T.student.gender[lang]}</th>
                <th className="px-6 py-3">{T.student.attendance[lang]}</th>
                <th className="px-6 py-3">{T.student.marks[lang]}</th>
                <th className="px-6 py-3">{T.student.riskScore[lang]}</th>
                <th className="px-6 py-3">{lang === "en" ? "Status" : "స్థితి"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">{T.teacherView.noStudentsFound[lang]}</td>
                </tr>
              ) : (
                paginated.map(s => (
                  <tr key={s.child_sno} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/student/${s.child_sno}`} className="font-semibold text-[color:var(--ap-navy)] hover:underline">
                        {s.child_sno}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{s.gender_label}</td>
                    <td className="px-6 py-4 tabular-nums">{pctFormat(s.attendance_rate, 0)}</td>
                    <td className="px-6 py-4 tabular-nums">{s.fa_avg?.toFixed(0) || "—"}</td>
                    <td className="px-6 py-4 font-medium tabular-nums">{pctFormat(s.risk_score, 0)}</td>
                    <td className="px-6 py-4">
                      <RiskBadge tier={s.tier} />
                    </td>
                  </tr>
                ))
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
