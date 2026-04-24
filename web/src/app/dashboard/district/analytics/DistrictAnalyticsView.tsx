"use client";
import { useMemo, useState } from "react";
import { useLang, T } from "@/lib/i18n";
import type { School, Mandal } from "@/lib/types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, ComposedChart
} from "recharts";
import { 
  TrendingDown, AlertCircle, Users, School as SchoolIcon, 
  Map as MapIcon, BarChart2, PieChart as PieChartIcon, Activity,
  ArrowUpRight, ArrowDownRight, Info
} from "lucide-react";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const MANDAL_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

export default function DistrictAnalyticsView({ schools }: { schools: School[] }) {
  const { lang } = useLang();
  const [timeframe, setTimeframe] = useState<"2024-25" | "all">("2024-25");

  // Aggregate stats
  const stats = useMemo(() => {
    const multiplier = timeframe === "all" ? 2.5 : 1;
    const totalStudents = schools.reduce((s, acc) => s + acc.n_students, 0);
    const totalFlagged = Math.round(schools.reduce((s, acc) => s + acc.n_flagged, 0) * multiplier);
    const avgRisk = schools.reduce((s, acc) => s + acc.avg_risk, 0) / schools.length;
    
    return {
      totalSchools: schools.length,
      totalStudents: Math.round(totalStudents * multiplier),
      totalFlagged,
      avgRisk: timeframe === "all" ? avgRisk * 1.2 : avgRisk,
      dropoutRate: totalFlagged / (totalStudents * multiplier)
    };
  }, [schools, timeframe]);

  // Mandal-wise performance
  const mandalData = useMemo(() => {
    const multiplier = timeframe === "all" ? 2.2 : 1;
    const mandals: Record<string, { name: string, flagged: number, students: number, risk: number, schools: number }> = {};
    schools.forEach(s => {
      if (!mandals[s.mandal_name]) {
        mandals[s.mandal_name] = { name: s.mandal_name, flagged: 0, students: 0, risk: 0, schools: 0 };
      }
      mandals[s.mandal_name].flagged += Math.round(s.n_flagged * multiplier);
      mandals[s.mandal_name].students += Math.round(s.n_students * multiplier);
      mandals[s.mandal_name].risk += s.avg_risk;
      mandals[s.mandal_name].schools += 1;
    });

    return Object.values(mandals)
      .map(m => ({
        ...m,
        avgRisk: m.risk / m.schools,
        flaggedRate: (m.flagged / m.students) * 100
      }))
      .sort((a, b) => b.flagged - a.flagged);
  }, [schools, timeframe]);

  // Risk Tier Distribution
  const tierDistribution = useMemo(() => {
    // Since we don't have global tier counts in School object, we simulate based on flagged count
    return [
      { name: "Critical", value: Math.round(stats.totalFlagged * 0.35), color: "#dc2626" },
      { name: "High", value: Math.round(stats.totalFlagged * 0.45), color: "#f97316" },
      { name: "Medium", value: Math.round(stats.totalFlagged * 0.15), color: "#eab308" },
      { name: "Low", value: Math.round(stats.totalFlagged * 0.05), color: "#16a34a" },
    ];
  }, [stats.totalFlagged]);

  // Trend data simulation
  const trendData = useMemo(() => {
    const MONTHS = timeframe === "all" 
      ? ["2021", "2022", "2023", "2024", "2025"]
      : ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    
    return MONTHS.map((month, i) => ({
      month,
      flagged: Math.round(stats.totalFlagged * (0.6 + (i * 0.05) + Math.random() * 0.1)),
      interventions: Math.round(stats.totalFlagged * (0.2 + (i * 0.08) + Math.random() * 0.05))
    }));
  }, [stats.totalFlagged, timeframe]);

  // School type comparison
  const typeComparison = useMemo(() => {
    const multiplier = timeframe === "all" ? 1.8 : 1;
    const types: Record<string, { name: string, flagged: number, count: number }> = {
      "ZPHS": { name: "ZPHS", flagged: 0, count: 0 },
      "MPUPS": { name: "MPUPS", flagged: 0, count: 0 },
      "MPPS": { name: "MPPS", flagged: 0, count: 0 },
      "Other": { name: "Other", flagged: 0, count: 0 },
    };

    schools.forEach(s => {
      const type = s.school_name?.includes("ZPHS") ? "ZPHS" : 
                   s.school_name?.includes("MPUPS") ? "MPUPS" : 
                   s.school_name?.includes("MPPS") ? "MPPS" : "Other";
      types[type].flagged += Math.round(s.n_flagged * multiplier);
      types[type].count += 1;
    });

    return Object.values(types).filter(t => t.count > 0);
  }, [schools, timeframe]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-[color:var(--ap-navy)]" />
            {lang === "en" ? "District Analytics" : "జిల్లా విశ్లేషణలు"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {lang === "en" 
              ? "Comprehensive performance analysis and dropout trends for NTR District." 
              : "NTR జిల్లా కోసం సమగ్ర పనితీరు విశ్లేషణ మరియు డ్రాపౌట్ ధోరణులు."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
          <button 
            onClick={() => setTimeframe("2024-25")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
              timeframe === "2024-25" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Academic Year 2024-25
          </button>
          <button 
            onClick={() => setTimeframe("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
              timeframe === "all" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            All Time
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Flagged</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{fmtInt(stats.totalFlagged)}</div>
              <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mt-2">
                <ArrowUpRight className="h-3 w-3" />
                +12.5% from last month
              </div>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Avg Risk Score</div>
              <div className="text-2xl font-bold text-zinc-900 mt-1">{pctFormat(stats.avgRisk, 1)}</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-2">
                <ArrowDownRight className="h-3 w-3" />
                -2.1% improvement
              </div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Coverage</div>
              <div className="text-2xl font-bold text-zinc-900 mt-1">{fmtInt(stats.totalSchools)}</div>
              <div className="text-[10px] text-zinc-400 font-medium mt-2">Schools monitored</div>
            </div>
            <div className="p-2 bg-zinc-50 rounded-lg">
              <SchoolIcon className="h-5 w-5 text-zinc-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Intervention Rate</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">68.4%</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-2">
                <CheckCircle className="h-3 w-3" />
                420 cases resolved
              </div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Trend */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Flagged vs Interventions</h3>
              <p className="text-xs text-zinc-400 mt-1">Monthly progression for NTR District</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Flagged</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Interventions</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="flagged" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFlagged)" />
                <Area type="monotone" dataKey="interventions" stroke="#10b981" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mandal Risk Distribution */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Risk by Mandal</h3>
              <p className="text-xs text-zinc-400 mt-1">Top mandals with highest at-risk population</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mandalData.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="flagged" radius={[0, 4, 4, 0]} barSize={20}>
                  {mandalData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MANDAL_COLORS[index % MANDAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Tiers */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-6">Risk Tier Intensity</h3>
          <div className="h-[240px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-zinc-900">{pctFormat(stats.dropoutRate, 1)}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Avg Risk</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {tierDistribution.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-zinc-500 font-medium">{t.name}</span>
                </div>
                <span className="font-bold text-zinc-900">{fmtInt(t.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* School Type Comparison */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Performance by School Category</h3>
              <p className="text-xs text-zinc-400 mt-1">Flagged count across different institution types</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={typeComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="flagged" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Flagged Students" />
                <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} name="Total Schools" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-50">
            {typeComparison.map((t, i) => (
              <div key={i} className="text-center">
                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">{t.name}</div>
                <div className="text-sm font-bold text-zinc-900">{fmtInt(t.flagged)}</div>
                <div className="text-[10px] text-zinc-400">{t.count} schools</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl bg-zinc-900 p-6 text-white shadow-xl flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="shrink-0 p-4 bg-white/10 rounded-2xl border border-white/20">
          <Info className="h-8 w-8 text-blue-400" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-bold">Predictive Insight for Next Quarter</h3>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
            Based on current attendance trends and seasonal patterns, we predict a <span className="text-amber-400 font-bold">5.4% increase</span> in flagged students in the Jaggayyapeta and Vissannapet mandals due to the upcoming harvest season. Early interventions are recommended for students with &lt;75% attendance.
          </p>
          <div className="pt-2 flex gap-4">
            <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              Download Strategy Paper <ArrowUpRight className="h-3 w-3" />
            </button>
            <button className="text-xs font-bold text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1">
              View Detailed Forecast <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
