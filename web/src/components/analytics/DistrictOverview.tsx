"use client";
import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { DistrictAnalytics, TrendPoint } from "@/lib/analytics-types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Activity, AlertCircle, Building2, Users, TrendingDown,
  CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  Critical: "#dc2626", High: "#f97316", Medium: "#eab308", Low: "#16a34a",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-zinc-700 mb-1">{label}</p>
      {payload.map((p: any) => {
        const isRate = p.name?.toLowerCase().includes("rate") || p.name?.toLowerCase().includes("contrib") || p.dataKey?.toLowerCase().includes("rate");
        let displayValue = p.value;

        if (typeof p.value === "number") {
          if (isRate) {
            // If it's a rate and less than 1, it's likely a ratio. If > 1, it's likely already a percentage.
            const val = p.value < 1.1 ? p.value * 100 : p.value;
            displayValue = `${val.toFixed(1)}%`;
          } else if (p.value > 100) {
            displayValue = fmtInt(p.value);
          }
        }

        return (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {displayValue}
          </p>
        );
      })}
    </div>
  );
}

export default function DistrictOverview({ data }: { data: DistrictAnalytics }) {
  const { lang } = useLang();
  const d = {
    ...data,
    overview: data.overview ?? { totalSchools: 0, totalStudents: 0, totalFlagged: 0, atRiskPercent: 0, avgRisk: 0, avgAttendance: 0, criticalSchools: 0, highRiskSchools: 0 },
    interventionStats: data.interventionStats ?? { initiated: 0, completed: 0, in_progress: 0, total: 0, completionRate: 0 },
    tierDistribution: data.tierDistribution ?? [],
    genderDistribution: data.genderDistribution ?? [],
    topDrivers: data.topDrivers ?? [],
    attendanceCorrelation: data.attendanceCorrelation ?? [],
    gradeDistribution: data.gradeDistribution ?? [],
    trends: data.trends ?? [],
  };
  const o = d.overview;

  const tierDonut = useMemo(() =>
    d.tierDistribution.map(t => ({
      name: t.tier,
      value: t.count,
      color: TIER_COLORS[t.tier] ?? "#94a3b8",
    })), [d.tierDistribution]);

  const genderChart = useMemo(() =>
    d.genderDistribution.map(g => ({
      name: g.label,
      total: g.count,
      flagged: g.flagged,
      rate: g.count > 0 ? g.flagged / g.count : 0,
    })), [d.genderDistribution]);

  const gradeChart = useMemo(() =>
    d.gradeDistribution.map(g => ({
      grade: `Grade ${g.grade}`,
      total: g.total,
      flagged: g.flagged,
      rate: g.rate,
    })), [d.gradeDistribution]);

  const driverChart = useMemo(() =>
    d.topDrivers.slice(0, 8).map(driver => ({
      name: driver.labelEn.length > 25 ? driver.labelEn.slice(0, 25) + "…" : driver.labelEn,
      contrib: driver.contribution * 100,
    })), [d.topDrivers]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: lang === "en" ? "Schools" : "పాఠశాలలు", value: fmtInt(o.totalSchools), icon: <Building2 className="h-4 w-4" />, bg: "bg-blue-50", txt: "text-blue-700", sub: lang === "en" ? `${fmtInt(o.criticalSchools)} critical` : `${fmtInt(o.criticalSchools)} క్రిటికల్` },
          { label: lang === "en" ? "Students" : "విద్యార్థులు", value: fmtInt(o.totalStudents), icon: <Users className="h-4 w-4" />, bg: "bg-sky-50", txt: "text-sky-700", sub: `${fmtInt(o.totalFlagged)} ${lang === "en" ? "at risk" : "ప్రమాదంలో"}` },
          { label: lang === "en" ? "At-Risk Rate" : "ప్రమాద రేటు", value: pctFormat(o.atRiskPercent, 1), icon: <AlertCircle className="h-4 w-4" />, bg: "bg-red-50", txt: "text-red-700", sub: `${fmtInt(o.highRiskSchools)} ${lang === "en" ? "high-risk schools" : "అధిక-ప్రమాద పాఠశాలలు"}` },
          { label: lang === "en" ? "Avg Attendance" : "సగటు హాజరు", value: pctFormat(o.avgAttendance, 1), icon: <Activity className="h-4 w-4" />, bg: "bg-emerald-50", txt: "text-emerald-700", sub: `${fmtInt(Math.round(o.avgAttendance * o.totalStudents))} ${lang === "en" ? "present daily" : "రోజూ హాజరు"}` },
        ].map(c => (
          <div key={c.label} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={cn("inline-flex p-1.5 rounded-lg mb-2", c.bg)}>{c.icon}</div>
            <div className={cn("text-xl font-bold", c.txt)}>{c.value}</div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mt-0.5">{c.label}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Risk Score Trend" : "రిస్క్ ట్రెండ్"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "Monthly flagged students vs interventions initiated" : "నెలవారీ ప్రమాద విద్యార్థులు vs జోక్యాలు"}
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.trends}>
                <defs>
                  <linearGradient id="olFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => fmtInt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="flagged" stroke="#ef4444" strokeWidth={2.5} fill="url(#olFlagged)" name="Flagged" />
                <Area type="monotone" dataKey="interventions" stroke="#3b82f6" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Interventions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase mt-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Flagged</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Interventions</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Intervention Overview" : "జోక్యం అవలోకనం"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "Status breakdown of all interventions" : "అన్ని జోక్యాల స్థితి విభజన"}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: lang === "en" ? "Completed" : "పూర్తయినవి", value: fmtInt(d.interventionStats.completed), color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-4 w-4" /> },
              { label: lang === "en" ? "In Progress" : "ప్రగతిలో", value: fmtInt(d.interventionStats.in_progress), color: "text-blue-600", bg: "bg-blue-50", icon: <Clock className="h-4 w-4" /> },
              { label: lang === "en" ? "Pending" : "పెండింగ్", value: fmtInt(d.interventionStats.initiated), color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="h-4 w-4" /> },
            ].map(s => (
              <div key={s.label} className={cn("rounded-lg p-3 text-center", s.bg)}>
                <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
                <div className="text-[10px] font-semibold text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-medium">{lang === "en" ? "Completion Rate" : "పూర్తి రేటు"}</span>
              <span className="font-bold text-zinc-900">{pctFormat(d.interventionStats.completionRate, 1)}</span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, d.interventionStats.completionRate * 100)}%` }} />
            </div>
            <div className="text-[10px] text-zinc-400">
              {fmtInt(d.interventionStats.total)} {lang === "en" ? "total interventions logged" : "మొత్తం జోక్యాలు నమోదు చేయబడ్డాయి"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Risk Tier Distribution" : "రిస్క్ స్థాయి పంపిణీ"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "Students by dropout risk severity" : "డ్రాపౌట్ రిస్క్ స్థాయి వారీగా విద్యార్థులు"}
          </p>
          <div className="flex items-center gap-6">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {tierDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {tierDonut.map(t => (
                <div key={t.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-zinc-500 font-medium">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900 tabular-nums">{fmtInt(t.value)}</span>
                    <span className="text-zinc-400 w-10 text-right">
                      {o.totalStudents > 0 ? pctFormat(t.value / o.totalStudents, 1) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Top Dropout Drivers" : "ప్రధాన డ్రాపౌట్ డ్రైవర్లు"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "Leading factors contributing to dropout risk" : "డ్రాపౌట్ రిస్క్‌కు దోహదపడే ప్రధాన అంశాలు"}
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} formatter={(v: any) => typeof v === "number" ? `${v.toFixed(1)}%` : String(v)} />
                <Bar dataKey="contrib" radius={[0, 4, 4, 0]} barSize={14}>
                  {driverChart.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? "#dc2626" : i < 6 ? "#f97316" : "#eab308"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Gender-wise Risk" : "లింగ వారీ రిస్క్"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "At-risk analysis by gender" : "లింగం వారీగా ప్రమాద విశ్లేషణ"}
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => fmtInt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Students" fill="#6aa3eeff" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="flagged" name="At Risk" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-100 text-center text-[10px]">
            {genderChart.map(g => (
              <div key={g.name}>
                <span className="font-bold text-zinc-700">{g.name}</span>
                <div className="text-zinc-500">{fmtInt(g.total)} total · {fmtInt(g.flagged)} at risk</div>
                <div className={cn("font-bold", g.rate > 0.15 ? "text-red-600" : g.rate > 0.08 ? "text-amber-600" : "text-emerald-600")}>{pctFormat(g.rate, 1)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Grade-wise Risk" : "తరగతి వారీ రిస్క్"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "At-risk students by grade level" : "తరగతి స్థాయి వారీగా ప్రమాద విద్యార్థులు"}
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => fmtInt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Students" fill="#6aa3eeff" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="flagged" name="At Risk" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-zinc-100 text-center text-[10px]">
            {gradeChart.map(g => (
              <div key={g.grade}>
                <span className="font-bold text-zinc-700">{g.grade}</span>
                <div className={cn("font-bold", g.rate > 0.15 ? "text-red-600" : g.rate > 0.08 ? "text-amber-600" : "text-emerald-600")}>{pctFormat(g.rate, 1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Attendance vs Risk" : "హాజరు vs రిస్క్"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "Correlation between attendance rate and dropout risk" : "హాజరు రేటు మరియు డ్రాపౌట్ రిస్క్ మధ్య సహసంబంధం"}
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.attendanceCorrelation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => fmtInt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Students" fill="#6aa3eeff" radius={[4, 4, 0, 0]} barSize={36} stackId="a" />
                <Bar dataKey="atRisk" name="At Risk" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={36} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {lang === "en" ? "Attendance vs Risk Correlation" : "హాజరు vs రిస్క్ సహసంబంధం"}
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            {lang === "en" ? "Risk rate across attendance brackets" : "హాజరు శ్రేణుల వారీగా రిస్క్ రేటు"}
          </p>
          <div className="space-y-3">
            {d.attendanceCorrelation.map(a => (
              <div key={a.range}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-zinc-600">{a.range}</span>
                  <span className={cn("font-bold", a.rate > 0.2 ? "text-red-600" : a.rate > 0.1 ? "text-amber-600" : "text-emerald-600")}>
                    {pctFormat(a.rate, 1)}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", a.rate > 0.2 ? "bg-red-500" : a.rate > 0.1 ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${Math.min(100, a.rate * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
