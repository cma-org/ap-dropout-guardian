"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { RosterStudent } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { pctFormat, fmtInt } from "@/lib/utils";
import Link from "next/link";
import { Search, Filter, Download } from "lucide-react";

export default function StudentsListPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.schoolId) {
      fetch(`/data/roster/${user.schoolId}.json`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setStudents(data);
          setLoading(false);
        });
    }
  }, [user]);

  const filtered = students.filter(s => 
    String(s.child_sno).includes(search)
  );

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
          <button className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50">
            <Filter className="h-4 w-4" /> {T.common.filter[lang]}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90">
            <Download className="h-4 w-4" /> {T.common.export[lang]}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text"
              placeholder={T.teacherView.searchById[lang]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            />
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">{T.teacherView.noStudentsFound[lang]}</td>
                </tr>
              ) : (
                filtered.map(s => (
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
      </div>
    </div>
  );
}
