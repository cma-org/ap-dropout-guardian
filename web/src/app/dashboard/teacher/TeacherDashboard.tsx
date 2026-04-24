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
  ArrowUpRight, ChevronRight, Activity,
} from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

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
      <div className="rounded-xl border bg-white">
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
                {idx === 0 ? T.common.filter[lang] : T.tier[realTier as RiskTier][lang]} {realTier !== "All" && `(${roster.filter((r) => r.tier === realTier).length})`}
              </button>
            )})}
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          {displayed.slice(0, 30).map((s) => (
            <Link
              key={s.child_sno}
              href={`/student/${s.child_sno}`}
              className={cn(
                "flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition group",
                TIER_BG_SOFT[s.tier]
              )}
            >
              <div className="tabular-nums text-sm font-mono text-zinc-500 w-20 shrink-0">#{s.child_sno}</div>
              <RiskBadge tier={s.tier} size="sm" />
              <div className="flex-1 grid grid-cols-3 gap-2 text-sm text-zinc-700">
                <span>{s.gender_label}</span>
                <span className={s.attendance_rate < 0.5 ? "text-red-600 font-medium" : ""}>{pctFormat(s.attendance_rate, 0)} {T.common.attShort[lang]}</span>
                <span>{s.fa_avg !== null ? `${s.fa_avg.toFixed(0)} ${T.common.marksShort[lang]}` : "—"}</span>
              </div>
              {loggedSet.has(s.child_sno) ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 shrink-0" />
              )}
            </Link>
          ))}
          {displayed.length > 30 && (
            <div className="px-5 py-3 text-sm text-zinc-500 text-center">
              {T.teacherDashboard.showingTop[lang].replace("{count}", displayed.length.toString())}. <Link href="/teacher/students" className="text-[color:var(--ap-navy)] underline">{T.teacherDashboard.seeFullRoster[lang]} →</Link>
            </div>
          )}
        </div>
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
