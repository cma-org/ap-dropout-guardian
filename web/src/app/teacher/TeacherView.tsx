"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { School, RosterStudent } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import { Search, Users, AlertCircle } from "lucide-react";

export default function TeacherView({ schools }: { schools: School[] }) {
  const { lang } = useLang();
  const [selectedId, setSelectedId] = useState<number>(schools[0]?.school_id ?? 0);
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const selected = schools.find((s) => s.school_id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/data/roster/${selectedId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: RosterStudent[] | null) => setRoster(data ?? []))
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 min-h-[calc(100vh-200px)]">
      {/* School selector sidebar */}
      <aside className="rounded-xl border bg-white overflow-hidden flex flex-col max-h-[calc(100vh-160px)]">
        <div className="px-4 py-3 border-b bg-zinc-50">
          <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">
            {T.teacherView.selectSchool[lang]}
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/30"
              placeholder={lang === "en" ? "Search school / district / mandal" : "పాఠశాల / జిల్లా / మండలం"}
            />
          </div>
        </div>
        <div className="overflow-auto flex-1 divide-y divide-zinc-100">
          {filteredSchools.slice(0, 80).map((s) => (
            <button
              key={s.school_id}
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

      {/* Main roster panel */}
      <section className="rounded-xl border bg-white p-5 min-w-0">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">{selected.school_name}</h1>
                <div className="text-sm text-zinc-600">
                  {selected.district_name} · {selected.mandal_name}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide">{lang === "en" ? "Total students" : "మొత్తం విద్యార్థులు"}</div>
                  <div className="text-lg font-semibold flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-zinc-400" />
                    {fmtInt(selected.n_students)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-red-600 uppercase tracking-wide">{lang === "en" ? "Flagged" : "గుర్తించినవి"}</div>
                  <div className="text-lg font-semibold text-red-700">{fmtInt(selected.n_flagged)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide">{lang === "en" ? "Avg risk" : "సగటు ప్రమాదం"}</div>
                  <div className="text-lg font-semibold">{pctFormat(selected.avg_risk, 0)}</div>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
              {T.teacherView.roster[lang]}
            </h2>

            {loading ? (
              <div className="text-sm text-zinc-500 py-8 text-center">Loading…</div>
            ) : !roster || roster.length === 0 ? (
              <div className="text-sm text-zinc-500 py-8 text-center">{T.teacherView.noFlags[lang]}</div>
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-360px)]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e5e7eb]">
                    <tr className="text-left text-zinc-600">
                      <th className="py-2 pr-4 font-medium">Child ID</th>
                      <th className="py-2 px-3 font-medium">Gender</th>
                      <th className="py-2 px-3 font-medium text-right">Attendance</th>
                      <th className="py-2 px-3 font-medium text-right">FA Marks</th>
                      <th className="py-2 px-3 font-medium text-right">Risk</th>
                      <th className="py-2 pl-3 font-medium">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.slice(0, 200).map((r) => (
                      <tr key={r.child_sno} className="border-t border-zinc-100 hover:bg-zinc-50">
                        <td className="py-2 pr-4">
                          <Link href={`/student/${r.child_sno}`} className="text-[color:var(--ap-navy)] hover:underline font-medium">
                            {r.child_sno}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-zinc-700">{r.gender_label}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{pctFormat(r.attendance_rate, 0)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-zinc-700">
                          {r.fa_avg === null ? "—" : r.fa_avg.toFixed(0)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">
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
            )}
          </>
        ) : (
          <div className="text-sm text-zinc-500 py-8 text-center">
            {lang === "en" ? "Pick a school from the sidebar" : "పక్కనుండి పాఠశాలను ఎంచుకోండి"}
          </div>
        )}
      </section>
    </div>
  );
}
