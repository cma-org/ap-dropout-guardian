"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { RosterStudent, School } from "@/lib/types";
import { TIER_COLORS } from "@/lib/types";
import { pctFormat, fmtInt, cn } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  School as SchoolIcon, Users, AlertTriangle, TrendingDown,
  CheckCircle2, ArrowUpRight, Activity,
} from "lucide-react";

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function makeTrend(n_flagged: number) {
  return MONTHS.map((month, i) => ({
    month,
    flagged: Math.max(1, Math.round(n_flagged * (0.5 + i * 0.068))),
    interventions: Math.round(Math.random() * 3 + i * 0.5),
  }));
}

function gradeBreakdown(roster: RosterStudent[]) {
  const grades = ["Class 8", "Class 9", "Class 10"];
  return grades.map((g, i) => {
    const slice = roster.slice(
      Math.floor((i / 3) * roster.length),
      Math.floor(((i + 1) / 3) * roster.length)
    );
    return {
      grade: g,
      total: slice.length,
      critical: slice.filter((r) => r.tier === "Critical").length,
      high: slice.filter((r) => r.tier === "High").length,
      flagged: slice.filter((r) => r.tier !== "Low").length,
    };
  });
}

export default function HMDashboard({ roster, school }: { roster: RosterStudent[]; school: School | null }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const critical = roster.filter((r) => r.tier === "Critical");
  const high = roster.filter((r) => r.tier === "High");
  const flagged = roster.filter((r) => r.tier !== "Low");
  const avgAtt = roster.length ? roster.reduce((s, r) => s + r.attendance_rate, 0) / roster.length : 0;
  const trend = makeTrend(flagged.length);
  const breakdown = gradeBreakdown(roster);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
            <SchoolIcon className="h-6 w-6 text-[color:var(--ap-navy)]" />
            Head Master Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {school?.school_name ?? "My School"} · {school?.district_name} · AY 2024-25
          </p>
        </div>
        <div className="text-xs text-zinc-500 bg-zinc-100 rounded-lg px-3 py-2">
          Logged in as <span className="font-semibold text-zinc-700">{user?.name}</span> · Head Master
        </div>
      </div>

      {/* Alert */}
      {critical.length > 0 && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-900">
              ALERT: {critical.length} students escalated to Critical — {high.length} High-risk require teacher follow-up
            </div>
            <div className="text-sm text-red-700 mt-0.5">
              Ensure class teachers have reviewed and logged interventions within 48 hours. This is tracked at district level.
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total enrolled", value: fmtInt(roster.length), icon: <Users className="h-5 w-5 text-zinc-400" />, sub: "All classes" },
          { label: "At-risk flagged", value: fmtInt(flagged.length), icon: <TrendingDown className="h-5 w-5 text-amber-500" />, sub: pctFormat(flagged.length / Math.max(roster.length, 1), 0) + " of school" },
          { label: "Critical", value: fmtInt(critical.length), icon: <AlertTriangle className="h-5 w-5 text-red-500" />, tone: "bad", sub: "Immediate action" },
          { label: "Avg attendance", value: pctFormat(avgAtt, 0), icon: <Activity className="h-5 w-5 text-emerald-500" />, tone: avgAtt >= 0.75 ? "good" : "warn", sub: "School average" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border bg-white px-4 py-3", s.tone === "bad" ? "border-red-200 bg-red-50/30" : s.tone === "warn" ? "border-amber-200 bg-amber-50/30" : "")}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 font-medium">{s.label}</div>
              {s.icon}
            </div>
            <div className={cn("text-2xl font-bold", s.tone === "bad" ? "text-red-700" : s.tone === "warn" ? "text-amber-700" : s.tone === "good" ? "text-emerald-700" : "text-zinc-900")}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grade-wise breakdown */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-zinc-800 mb-4">Grade-wise risk breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" fill="#e5e7eb" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="flagged" fill="#f97316" name="Flagged" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critical" fill="#dc2626" name="Critical" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Flagged students over time</h2>
            <span className="text-xs text-zinc-400 italic">Simulated</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="flagged" stroke="#dc2626" strokeWidth={2} dot={false} name="Flagged" />
              <Line type="monotone" dataKey="interventions" stroke="#16a34a" strokeWidth={2} dot={false} name="Interventions logged" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top-risk students table */}
      <div className="rounded-xl border bg-white">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-800">Top at-risk students across school</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Click any student to view SHAP explanation + counsellor guide</p>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                <th className="px-5 py-2 font-medium">Student ID</th>
                <th className="px-4 py-2 font-medium">Risk tier</th>
                <th className="px-4 py-2 font-medium">Gender</th>
                <th className="px-4 py-2 font-medium text-right">Attendance</th>
                <th className="px-4 py-2 font-medium text-right">Marks (FA)</th>
                <th className="px-4 py-2 font-medium text-right">Risk score</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {roster.slice(0, 15).map((s) => (
                <tr key={s.child_sno} className="hover:bg-zinc-50">
                  <td className="px-5 py-2.5 font-mono text-zinc-600">#{s.child_sno}</td>
                  <td className="px-4 py-2.5"><RiskBadge tier={s.tier} size="sm" /></td>
                  <td className="px-4 py-2.5 text-zinc-700">{s.gender_label}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", s.attendance_rate < 0.5 ? "text-red-600 font-medium" : "text-zinc-700")}>
                    {pctFormat(s.attendance_rate, 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{s.fa_avg !== null ? s.fa_avg.toFixed(0) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-red-700">{(s.risk_score * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/student/${s.child_sno}`} className="text-[color:var(--ap-navy)] hover:underline text-xs flex items-center gap-1">
                      View <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intervention log summary */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Intervention activity this term
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Interventions logged", value: "24", sub: "By class teachers" },
            { label: "Pending review", value: fmtInt(critical.length + high.length), sub: "No intervention yet" },
            { label: "Coverage rate", value: pctFormat(24 / Math.max(flagged.length, 1), 0), sub: "Of flagged students" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-zinc-50 border px-4 py-3">
              <div className="text-xl font-bold text-zinc-900">{s.value}</div>
              <div className="text-xs font-medium text-zinc-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-zinc-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
