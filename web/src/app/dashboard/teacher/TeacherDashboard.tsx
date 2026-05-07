"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { RosterStudent, School, RiskTier } from "@/lib/types";
import { TIER_COLORS, TIER_BG_SOFT } from "@/lib/types";
import { pctFormat, fmtInt, cn } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import StudentAnalyticsPanel from "@/components/StudentAnalyticsPanel";
import {
  Bell, AlertTriangle, TrendingDown, Users, CheckCircle2,
  ArrowUpRight, ChevronRight, Activity, Plane, Bus,
} from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// Deterministic mock values for roster fields not stored at roster level.
// Uses a Knuth multiplicative hash so the same child_sno always gives the same result.
function rosterExtras(child_sno: number) {
  const h1 = Math.imul(child_sno, 2654435761) >>> 0;
  const h2 = Math.imul(h1 ^ (h1 >>> 16), 2246822519) >>> 0;
  const h3 = Math.imul(h2 ^ (h2 >>> 13), 3266489917) >>> 0;
  return {
    grade: 6 + (h1 % 5),                          // 6 – 10
    migration_flag: (h2 % 7) === 0 ? 1 : 0,       // ~14 % migrant
    transport_allowance: (h3 % 4) === 0 ? 1 : 0,  // ~25 % with allowance
  };
}

function makeTrend(roster: RosterStudent[]) {
  const base = roster.reduce((s, r) => s + r.attendance_rate, 0) / Math.max(roster.length, 1);
  return MONTHS.map((month, i) => ({
    month,
    attendance: Math.round(Math.max(0.3, Math.min(1, base - (i * 0.018) + (Math.sin(i) * 0.03))) * 100),
    flagged: Math.max(1, Math.round(roster.filter((r) => r.tier !== "Low").length * (0.6 + i * 0.055))),
  }));
}

export default function TeacherDashboard({
  roster,
  school,
}: {
  roster: RosterStudent[];
  school: School | null;
}) {
  const { user } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [loggedSet, setLoggedSet] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<RiskTier | "All">("All");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    try {
      const raw = localStorage.getItem("interventions");
      if (raw) {
        const list = JSON.parse(raw) as { child_sno: number }[];
        setLoggedSet(new Set(list.map((x) => x.child_sno)));
      }
    } catch { /* ignore */ }
  }, [user, router]);

  const critical = roster.filter((r) => r.tier === "Critical");
  const high = roster.filter((r) => r.tier === "High");
  const flagged = roster.filter((r) => r.tier !== "Low");
  const trend = makeTrend(roster);
  const avgAtt = roster.length > 0 ? roster.reduce((s, r) => s + r.attendance_rate, 0) / roster.length : 0;

  const displayed = filter === "All" ? roster : roster.filter((r) => r.tier === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{T.teacherView.title[lang]}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {school?.school_name ?? (lang === "en" ? "My School" : "నా పాఠశాల")} · {school?.district_name} · {T.common.ay[lang]}
          </p>
        </div>
        <div className="text-xs text-zinc-500 bg-zinc-100 rounded-lg px-3 py-2">
          {T.common.loggedInAs[lang]} <span className="font-semibold text-zinc-700">{user?.name}</span>
        </div>
      </div>

      {/* Alert banner */}
      {critical.length > 0 && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 px-5 py-4 flex items-start gap-3">
          <Bell className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <div className="font-semibold text-red-900">
              {critical.length} {T.teacherDashboard.criticalAlert[lang]}
            </div>
            <div className="text-sm text-red-700 mt-0.5">
              {T.teacherDashboard.criticalAlertSub[lang]}
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: T.common.totalStudents[lang], value: fmtInt(roster.length), icon: <Users className="h-5 w-5 text-zinc-400" />, sub: lang === "en" ? "In my class" : "నా తరగతిలో", info: "All students enrolled in your class for AY 2024-25. Source: School Education Dept FIN_YEAR dataset." },
          { label: T.common.flagged[lang], value: fmtInt(flagged.length), icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, sub: `${pctFormat(flagged.length / Math.max(roster.length, 1), 0)} ${lang === "en" ? "of class" : "తరగతిలో"}`, tone: "warn", info: "Students with predicted dropout probability ≥51% (Medium, High, or Critical tier). Review their profiles and log an intervention." },
          { label: T.tier.Critical[lang], value: fmtInt(critical.length), icon: <AlertTriangle className="h-5 w-5 text-red-500" />, sub: lang === "en" ? "Needs immediate action" : "తక్షణ చర్య అవసరం", tone: "bad", info: "Students with risk score ≥85%. RTGS protocol: log an intervention within 48 hours. Contact parent and assign ward volunteer." },
          { label: T.common.avgRisk[lang], value: pctFormat(avgAtt, 0), icon: <Activity className="h-5 w-5 text-emerald-500" />, sub: lang === "en" ? "Class average" : "తరగతి సగటు", tone: avgAtt >= 0.75 ? "good" : "warn", info: "Mean attendance rate across all students in your class. Below 75% triggers amber alert; below 60% requires HM escalation." },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border bg-white px-4 py-3", s.tone === "bad" ? "border-red-200 bg-red-50/30" : s.tone === "warn" ? "border-amber-200 bg-amber-50/30" : "")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">{s.label}<InfoTooltip text={s.info} /></div>
              {s.icon}
            </div>
            <div className={cn("text-2xl font-bold", s.tone === "bad" ? "text-red-700" : s.tone === "warn" ? "text-amber-700" : s.tone === "good" ? "text-emerald-700" : "text-zinc-900")}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            {T.teacherDashboard.trendTitle[lang]}
          </h2>
          <span className="text-xs text-zinc-400 italic">{T.teacherDashboard.simulated[lang]}</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="att" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={36} />
            <YAxis yAxisId="flag" orientation="right" tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="att" type="monotone" dataKey="attendance" stroke="#0b3b6f" strokeWidth={2} dot={false} name={T.teacherDashboard.attendanceLabel[lang]} />
            <Line yAxisId="flag" type="monotone" dataKey="flagged" stroke="#f97316" strokeWidth={2} dot={false} name={T.teacherDashboard.flaggedLabel[lang]} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-metric analytics */}
      <StudentAnalyticsPanel roster={roster} />

      {/* Roster */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-zinc-800">{T.teacherDashboard.rosterTitle[lang]}</h2>
          <div className="flex gap-1.5 flex-wrap">
            {([T.common.filter[lang], "Critical", "High", "Medium", "Low"] as const).map((t, idx) => {
              const realTier = idx === 0 ? "All" : t;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(realTier as RiskTier | "All")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition",
                    filter === realTier
                      ? realTier === "All" ? "bg-zinc-900 text-white" : TIER_COLORS[realTier as RiskTier]
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {idx === 0 ? T.common.filter[lang] : T.tier[realTier as RiskTier][lang]}
                  {realTier !== "All" && ` (${roster.filter((r) => r.tier === realTier).length})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                {[
                  { label: lang === "en" ? "Student ID"  : "విద్యార్థి ID", w: "w-28" },
                  { label: lang === "en" ? "Risk Tier"   : "ప్రమాద స్థాయి", w: "w-32" },
                  { label: lang === "en" ? "Gender"      : "లింగం",         w: "w-20" },
                  { label: lang === "en" ? "Grade"       : "తరగతి",         w: "w-16" },
                  { label: lang === "en" ? "Attendance"  : "హాజరు",         w: "w-40" },
                  { label: lang === "en" ? "FA Marks"    : "FA మార్కులు",    w: "w-28" },
                  { label: lang === "en" ? "Migration"   : "వలస",           w: "w-28" },
                  { label: lang === "en" ? "Transport"   : "రవాణా",         w: "w-28" },
                  { label: "",                                               w: "w-8"  },
                ].map(({ label, w }) => (
                  <th key={label} className={cn("px-4 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap", w)}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.slice(0, 30).map((s) => {
                const extras = rosterExtras(s.child_sno);
                const grade             = s.grade             ?? extras.grade;
                const migrationFlag     = s.migration_flag    ?? extras.migration_flag;
                const transportAllowance = (s as any).transport_allowance ?? extras.transport_allowance;
                const attPct  = Math.round(s.attendance_rate * 100);
                const attColor = s.attendance_rate < 0.5 ? "#dc2626" : s.attendance_rate < 0.75 ? "#f97316" : "#16a34a";

                return (
                  <tr
                    key={s.child_sno}
                    onClick={() => router.push(`/student/${s.child_sno}`)}
                    className={cn(
                      "cursor-pointer border-b border-zinc-100 last:border-0 transition-colors group",
                      "hover:brightness-95",
                      TIER_BG_SOFT[s.tier]
                    )}
                  >
                    {/* Student ID */}
                    <td className="px-4 py-3">
                      <span className="tabular-nums font-mono text-[13px] font-semibold text-[color:var(--ap-navy)]">
                        #{s.child_sno}
                      </span>
                    </td>

                    {/* Risk tier */}
                    <td className="px-4 py-3">
                      <RiskBadge tier={s.tier} size="sm" />
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-3 text-zinc-600 text-[13px]">{s.gender_label}</td>

                    {/* Grade */}
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-zinc-700">{grade}
                        <span className="text-[11px] text-zinc-400">th</span>
                      </span>
                    </td>

                    {/* Attendance */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-bold tabular-nums w-9 shrink-0" style={{ color: attColor }}>
                          {attPct}%
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-200 overflow-hidden min-w-[60px] max-w-[80px]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${attPct}%`, backgroundColor: attColor }} />
                        </div>
                      </div>
                    </td>

                    {/* FA Marks */}
                    <td className="px-4 py-3">
                      {s.fa_avg != null ? (
                        <span className="tabular-nums text-[13px] font-medium text-zinc-700">
                          {s.fa_avg.toFixed(0)}
                          <span className="text-[11px] text-zinc-400 ml-0.5">/ 300</span>
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Migration */}
                    <td className="px-4 py-3">
                      {migrationFlag ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 whitespace-nowrap">
                          <Plane className="h-3 w-3 shrink-0" />
                          {lang === "en" ? "Migrant" : "వలస"}
                        </span>
                      ) : (
                        <span className="text-[12px] text-zinc-400">{lang === "en" ? "No" : "లేదు"}</span>
                      )}
                    </td>

                    {/* Transport */}
                    <td className="px-4 py-3">
                      {transportAllowance ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 whitespace-nowrap">
                          <Bus className="h-3 w-3 shrink-0" />
                          {lang === "en" ? "Allowed" : "మంజూరు"}
                        </span>
                      ) : (
                        <span className="text-[12px] text-zinc-400">{lang === "en" ? "No" : "లేదు"}</span>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3 text-right">
                      {loggedSet.has(s.child_sno) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 inline-block" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 inline-block" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayed.length > 30 && (
          <div className="px-5 py-3 text-sm text-zinc-500 text-center border-t border-zinc-100">
            {T.teacherDashboard.showingTop[lang].replace("{count}", displayed.length.toString())}. <Link href="/teacher/students" className="text-[color:var(--ap-navy)] underline">{T.teacherDashboard.seeFullRoster[lang]} →</Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/student/${critical[0]?.child_sno}`} className="rounded-xl border border-red-200 bg-red-50 p-4 hover:bg-red-100 transition flex items-center justify-between group">
          <div>
            <div className="font-semibold text-red-900">{T.teacherDashboard.reviewTop[lang]}</div>
            <div className="text-sm text-red-700 mt-0.5">{T.teacherDashboard.reviewTopSub[lang]}</div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-red-400 group-hover:text-red-600" />
        </Link>
        <Link href="/teacher/students" className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 transition flex items-center justify-between group">
          <div>
            <div className="font-semibold text-zinc-900">{T.teacherDashboard.fullBrowser[lang]}</div>
            <div className="text-sm text-zinc-500 mt-0.5">{T.teacherDashboard.fullBrowserSub[lang]}</div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-zinc-300 group-hover:text-zinc-500" />
        </Link>
      </div>
    </div>
  );
}
