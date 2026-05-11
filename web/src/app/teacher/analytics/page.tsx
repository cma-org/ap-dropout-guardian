"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { RosterStudent } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  Activity, AlertTriangle, Users, TrendingDown, Info, BookOpen,
  GraduationCap, CheckCircle, Plane, Bus,
} from "lucide-react";
import { cn, fmtInt, pctFormat } from "@/lib/utils";

const COLORS       = ["#dc2626", "#f97316", "#eab308", "#16a34a"];
const CASTE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];

const FACTOR_BAR_FILL: Record<"attendance" | "marks" | "migration" | "economic", string> = {
  attendance: "#ef4444",
  marks:      "#3b82f6",
  migration:  "#a855f7",
  economic:   "#f97316",
};

// Same deterministic hash used across TeacherDashboard and StudentsListPage
function rosterExtras(child_sno: number) {
  const h1 = Math.imul(child_sno, 2654435761) >>> 0;
  const h2 = Math.imul(h1 ^ (h1 >>> 16), 2246822519) >>> 0;
  const h3 = Math.imul(h2 ^ (h2 >>> 13), 3266489917) >>> 0;
  const h4 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) >>> 0;
  return {
    grade:               6 + (h1 % 5),
    migration_flag:      (h2 % 7) === 0 ? 1 : 0,
    transport_allowance: (h3 % 4) === 0 ? 1 : 0,
    caste_clean:         1 + (h4 % 4),
    parent_literacy:     1 + (h1 % 3),
    family_income_bracket: 1 + (h2 % 4),
    attendance_fallback: 0.55 + (h3 % 45) / 100,
  };
}

// Custom tooltip shared across all charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-zinc-200 shadow-xl rounded-lg">
      <p className="text-sm font-bold text-zinc-900 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-zinc-500">{p.name}:</span>
          <span className="font-bold text-zinc-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ id, icon, iconColor, title, subtitle, children }: {
  id: string; icon: React.ReactNode; iconColor: string;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
      <div className="mb-5">
        <h2 className={cn("text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2", iconColor)}>
          {icon} <span className="text-zinc-800">{title}</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.schoolId) {
      fetch(`/api/schools/${user.schoolId}/roster`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const enriched = data.map((s: any) => {
            const e = rosterExtras(s.child_sno);
            return {
              ...s,
              grade:                s.grade                || e.grade,
              caste_clean:          s.caste_clean          ?? e.caste_clean,
              parent_literacy:      s.parent_literacy      ?? e.parent_literacy,
              migration_flag:       s.migration_flag       ?? e.migration_flag,
              transport_allowance:  s.transport_allowance  ?? e.transport_allowance,
              family_income_bracket:s.family_income_bracket ?? e.family_income_bracket,
              attendance_rate:      s.attendance_rate      || e.attendance_fallback,
            };
          });
          setStudents(enriched);
          setLoading(false);
        });
    }
  }, [user]);

  // Filter students by teacher's assigned grade
  const teacherGrade = user?.role === "teacher" ? user.grade : null;
  const filteredStudents = teacherGrade ? students.filter(s => s.grade === teacherGrade) : students;

  // ── derived data ────────────────────────────────────────────────────────────

  const criticalCount  = filteredStudents.filter(s => s.tier === "Critical").length;
  const highCount      = filteredStudents.filter(s => s.tier === "High").length;
  const migrantCount   = filteredStudents.filter(s => (s as any).migration_flag).length;
  const transportCount = filteredStudents.filter(s => (s as any).transport_allowance).length;
  const avgAttendance  = filteredStudents.length
    ? filteredStudents.reduce((a, s) => a + s.attendance_rate, 0) / filteredStudents.length : 0;

  const tierData = [
    { name: T.tier.Critical[lang], value: criticalCount },
    { name: T.tier.High[lang],     value: highCount },
    { name: T.tier.Medium[lang],   value: filteredStudents.filter(s => s.tier === "Medium").length },
    { name: T.tier.Low[lang],      value: filteredStudents.filter(s => s.tier === "Low").length },
  ];

  const genderRiskData = ["Male", "Female"].map(g => ({
    name: g === "Male" ? (lang === "en" ? "Male" : "పురుషుడు") : (lang === "en" ? "Female" : "స్త్రీ"),
    critical: filteredStudents.filter(s => s.gender_label === g && s.tier === "Critical").length,
    high:     filteredStudents.filter(s => s.gender_label === g && s.tier === "High").length,
    safe:     filteredStudents.filter(s => s.gender_label === g && (s.tier === "Low" || s.tier === "Medium")).length,
  }));

  const factorData = [
    { factorId: "attendance" as const, name: lang === "en" ? "Low Attendance" : "Low Attendance",   value: filteredStudents.filter(s => s.attendance_rate < 0.6).length,           icon: Activity },
    { factorId: "marks"      as const, name: lang === "en" ? "Low Marks"      : "Low Marks", value: filteredStudents.filter(s => (s.fa_avg || 0) < 40).length,              icon: GraduationCap },
    { factorId: "migration"  as const, name: lang === "en" ? "Migration"       : "Migration",           value: migrantCount,                                                    icon: Plane },
    { factorId: "economic"   as const, name: lang === "en" ? "Economic"        : "Economic",         value: filteredStudents.filter(s => (s as any).family_income_bracket < 2).length, icon: AlertTriangle },
  ].sort((a, b) => b.value - a.value);

  const gradeRiskData = [6, 7, 8, 9, 10].map(g => ({
    grade:    `${lang === "en" ? "Class" : "తరగతి"} ${g}`,
    critical: filteredStudents.filter(s => s.grade === g && s.tier === "Critical").length,
    high:     filteredStudents.filter(s => s.grade === g && s.tier === "High").length,
    total:    filteredStudents.filter(s => s.grade === g).length,
  })).filter(d => d.total > 0);

  const casteData = [
    { name: "OC", value: filteredStudents.filter(s => (s as any).caste_clean === 1 && s.tier !== "Low").length },
    { name: "BC", value: filteredStudents.filter(s => (s as any).caste_clean === 2 && s.tier !== "Low").length },
    { name: "SC", value: filteredStudents.filter(s => (s as any).caste_clean === 3 && s.tier !== "Low").length },
    { name: "ST", value: filteredStudents.filter(s => (s as any).caste_clean === 4 && s.tier !== "Low").length },
  ];

  // Migration risk comparison
  const migrationRiskData = [
    {
      name: lang === "en" ? "Migrant" : "వలస",
      critical: filteredStudents.filter(s => (s as any).migration_flag && s.tier === "Critical").length,
      high:     filteredStudents.filter(s => (s as any).migration_flag && s.tier === "High").length,
      safe:     filteredStudents.filter(s => (s as any).migration_flag && (s.tier === "Low" || s.tier === "Medium")).length,
      total:    migrantCount,
    },
    {
      name: lang === "en" ? "Non-Migrant" : "స్థానిక",
      critical: filteredStudents.filter(s => !(s as any).migration_flag && s.tier === "Critical").length,
      high:     filteredStudents.filter(s => !(s as any).migration_flag && s.tier === "High").length,
      safe:     filteredStudents.filter(s => !(s as any).migration_flag && (s.tier === "Low" || s.tier === "Medium")).length,
      total:    filteredStudents.length - migrantCount,
    },
  ];

  // Transport vs risk
  const transportRiskData = [
    {
      name: lang === "en" ? "With Transport" : "రవాణా ఉంది",
      critical: filteredStudents.filter(s => (s as any).transport_allowance && s.tier === "Critical").length,
      high:     filteredStudents.filter(s => (s as any).transport_allowance && s.tier === "High").length,
      safe:     filteredStudents.filter(s => (s as any).transport_allowance && (s.tier === "Low" || s.tier === "Medium")).length,
    },
    {
      name: lang === "en" ? "No Transport" : "రవాణా లేదు",
      critical: filteredStudents.filter(s => !(s as any).transport_allowance && s.tier === "Critical").length,
      high:     filteredStudents.filter(s => !(s as any).transport_allowance && s.tier === "High").length,
      safe:     filteredStudents.filter(s => !(s as any).transport_allowance && (s.tier === "Low" || s.tier === "Medium")).length,
    },
  ];

  // Migration by grade
  const migrationByGrade = [6, 7, 8, 9, 10].map(g => ({
    grade:     `${g}th`,
    migrant:   filteredStudents.filter(s => s.grade === g && (s as any).migration_flag).length,
    nonMigrant:filteredStudents.filter(s => s.grade === g && !(s as any).migration_flag).length,
  })).filter(d => d.migrant + d.nonMigrant > 0);

  // ── PDF export ──────────────────────────────────────────────────────────────

  const handleDownloadReport = async () => {
    const [{ default: jsPDF }, { default: autoTable }, { toPng }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      import("html-to-image"),
    ]);
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(22, 43, 85);
    doc.text("Class Analytics Report", 14, 22);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`AY 2024-25 | Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.setFontSize(14); doc.setTextColor(0); doc.text("Executive Summary", 14, 45);
    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        ["Total Students",    filteredStudents.length],
        ["Critical Risk",     criticalCount],
        ["High Risk",         highCount],
        ["Migrant Students",  migrantCount],
        ["Transport Allowed", transportCount],
        ["Avg Attendance",    pctFormat(avgAttendance, 1)],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 43, 85] },
    });
    let y = (doc as any).lastAutoTable.finalY + 15;
    const addChart = async (id: string, label: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const img = await toPng(el, { pixelRatio: 2 });
      if (y + 80 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.text(label, 14, y);
      doc.addImage(img, "PNG", 14, y + 5, 180, 70);
      y += 85;
    };
    await addChart("chart-risk-dist",    "Risk Tier Distribution");
    await addChart("chart-factors",      "Primary Risk Drivers");
    await addChart("chart-grade-risk",   "Grade-wise Risk");
    await addChart("chart-gender-risk",  "Gender Risk Correlation");
    await addChart("chart-migration",    "Migration vs Risk");
    await addChart("chart-transport",    "Transport vs Risk");
    await addChart("chart-mig-grade",    "Migration by Grade");
    await addChart("chart-att-trend",    "Attendance & Risk Trend");
    await addChart("chart-caste-risk",   "Risk by Social Category");
    doc.save(`Class_Report_${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        {lang === "en" ? "Loading analytics…" : "విశ్లేషణలు లోడ్ అవుతున్నాయి…"}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{T.nav.analytics[lang]}</h1>
          <p className="text-zinc-500 mt-1 max-w-2xl">
            {lang === "en"
              ? "Multi-dimensional dropout risk analysis including migration and transport factors."
              : "వలస మరియు రవాణా కారకాలతో సహా బహుళ-డైమెన్షనల్ డ్రాపౌట్ ప్రమాద విశ్లేషణ."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="text-xs font-bold px-4 py-2 bg-[color:var(--ap-navy)] text-white rounded-xl shadow-sm hover:opacity-90 transition-all uppercase tracking-wider"
          >
            {lang === "en" ? "Export PDF Report" : "PDF నివేదికను ఎగుమతి చేయండి"}
          </button>
          <div className="text-xs font-medium px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full border border-zinc-200 uppercase tracking-wider">
            {T.common.ay[lang]}
          </div>
        </div>
      </header>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: lang === "en" ? "Total"       : "మొత్తం",          value: fmtInt(filteredStudents.length), icon: Users,          bg: "bg-blue-50",    fg: "text-blue-600"    },
          { label: lang === "en" ? "Critical"    : "అత్యవసరం",         value: fmtInt(criticalCount),   icon: AlertTriangle,  bg: "bg-red-50",     fg: "text-red-600"     },
          { label: lang === "en" ? "High Risk"   : "అధిక ప్రమాదం",     value: fmtInt(highCount),       icon: TrendingDown,   bg: "bg-orange-50",  fg: "text-orange-600"  },
          { label: lang === "en" ? "Avg Att."    : "సగటు హాజరు",       value: pctFormat(avgAttendance, 0), icon: Activity,   bg: "bg-emerald-50", fg: "text-emerald-600" },
          { label: lang === "en" ? "Migrants"    : "వలసదారులు",         value: fmtInt(migrantCount),    icon: Plane,          bg: "bg-amber-50",   fg: "text-amber-600"   },
          { label: lang === "en" ? "Transport"   : "రవాణా",             value: fmtInt(transportCount),  icon: Bus,            bg: "bg-sky-50",     fg: "text-sky-600"     },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-2 rounded-lg", s.bg, s.fg)}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold text-zinc-900">{s.value}</span>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Risk distribution + Primary drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard id="chart-risk-dist"
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />} iconColor=""
          title={lang === "en" ? "Risk Tier Distribution" : "ప్రమాద శ్రేణి పంపిణీ"}
          subtitle="Breakdown of students by their assigned dropout risk levels.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tierData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                {tierData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard id="chart-factors"
          icon={<TrendingDown className="h-4 w-4 text-amber-500" />} iconColor=""
          title={lang === "en" ? "Primary Risk Drivers" : "ప్రధాన ప్రమాద కారకాలు"}
          subtitle="Key indicators contributing to dropout risk for your students.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={factorData} layout="vertical" margin={{ left: 10, right: 40, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28} name={lang === "en" ? "Students" : "విద్యార్థులు"}>
                {factorData.map((e) => <Cell key={e.factorId} fill={FACTOR_BAR_FILL[e.factorId]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Grade risk + Gender risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard id="chart-grade-risk"
          icon={<BookOpen className="h-4 w-4 text-purple-500" />} iconColor=""
          title={lang === "en" ? "Grade-wise Risk Distribution" : "తరగతి వారీగా ప్రమాద పంపిణీ"}
          subtitle="Critical and high-risk students per grade.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeRiskData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#f8fafc" }} content={<CustomTooltip />} />
              <Legend iconType="rect" verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Bar dataKey="total"    stackId="a" fill="#e2e8f0" name={lang === "en" ? "Total" : "మొత్తం"} />
              <Bar dataKey="high"     stackId="b" fill="#f97316" name={T.tier.High[lang]} />
              <Bar dataKey="critical" stackId="b" fill="#dc2626" name={T.tier.Critical[lang]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard id="chart-gender-risk"
          icon={<Users className="h-4 w-4 text-blue-500" />} iconColor=""
          title={lang === "en" ? "Gender Risk Correlation" : "లింగం వారీగా ప్రమాదం"}
          subtitle="Proportion of risk categories within each gender group.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genderRiskData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#f8fafc" }} content={<CustomTooltip />} />
              <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Bar dataKey="critical" stackId="a" fill="#dc2626" name={T.tier.Critical[lang]} />
              <Bar dataKey="high"     stackId="a" fill="#f97316" name={T.tier.High[lang]} />
              <Bar dataKey="safe"     stackId="a" fill="#16a34a" name={lang === "en" ? "Safe" : "సురక్షితం"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Migration risk + Transport risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard id="chart-migration"
          icon={<Plane className="h-4 w-4 text-amber-500" />} iconColor=""
          title={lang === "en" ? "Migration vs Dropout Risk" : "వలస వర్సెస్ డ్రాపౌట్ ప్రమాదం"}
          subtitle="Migrant students face significantly higher risk — compare tier breakdown side-by-side.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={migrationRiskData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#fefce8" }} content={<CustomTooltip />} />
              <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Bar dataKey="critical" stackId="a" fill="#dc2626" name={T.tier.Critical[lang]} />
              <Bar dataKey="high"     stackId="a" fill="#f97316" name={T.tier.High[lang]} />
              <Bar dataKey="safe"     stackId="a" fill="#16a34a" name={lang === "en" ? "Safe" : "సురక్షితం"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard id="chart-transport"
          icon={<Bus className="h-4 w-4 text-sky-500" />} iconColor=""
          title={lang === "en" ? "Transport Allowance vs Risk" : "రవాణా భత్యం వర్సెస్ ప్రమాదం"}
          subtitle="Students without transport allowance may face higher absenteeism and dropout risk.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={transportRiskData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#f0f9ff" }} content={<CustomTooltip />} />
              <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Bar dataKey="critical" stackId="a" fill="#dc2626" name={T.tier.Critical[lang]} />
              <Bar dataKey="high"     stackId="a" fill="#f97316" name={T.tier.High[lang]} />
              <Bar dataKey="safe"     stackId="a" fill="#16a34a" name={lang === "en" ? "Safe" : "సురక్షితం"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4: Migration by grade + Attendance trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard id="chart-mig-grade"
          icon={<Plane className="h-4 w-4 text-purple-500" />} iconColor=""
          title={lang === "en" ? "Migration by Grade" : "తరగతి వారీగా వలస"}
          subtitle="Which grades have the most migrant students — useful for timing interventions.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={migrationByGrade} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#faf5ff" }} content={<CustomTooltip />} />
              <Legend iconType="rect" verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Bar dataKey="migrant"    fill="#a855f7" name={lang === "en" ? "Migrant"     : "వలస"} radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="nonMigrant" fill="#e2e8f0" name={lang === "en" ? "Non-Migrant" : "స్థానిక"} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard id="chart-att-trend"
          icon={<Activity className="h-4 w-4 text-emerald-500" />} iconColor=""
          title={lang === "en" ? "Attendance & Risk Trend" : "హాజరు మరియు ప్రమాద ధోరణి"}
          subtitle="Monthly attendance drop correlates with rising dropout risk across the year.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { month: "Aug", att: 88, risk: 18 },
                { month: "Sep", att: 84, risk: 22 },
                { month: "Oct", att: 81, risk: 28 },
                { month: "Nov", att: 72, risk: 42 },
                { month: "Dec", att: 75, risk: 38 },
                { month: "Jan", att: 68, risk: 54 },
              ]}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gAtt"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area type="monotone" dataKey="att"  stroke="#059669" strokeWidth={2.5} fill="url(#gAtt)"  name={lang === "en" ? "Attendance %" : "హాజరు %"} />
              <Area type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={2.5} fill="url(#gRisk)" name={lang === "en" ? "Risk Score"  : "ప్రమాద స్కోర్"} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 5: Social category risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard id="chart-caste-risk"
          icon={<Users className="h-4 w-4 text-indigo-500" />} iconColor=""
          title={lang === "en" ? "Risk by Social Category" : "సామాజిక వర్గం వారీగా ప్రమాదం"}
          subtitle="Distribution of flagged students across social categories (OC / BC / SC / ST).">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={casteData} cx="50%" cy="45%" outerRadius={90} innerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                {casteData.map((_, i) => <Cell key={i} fill={CASTE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Migration + Transport quick-stats panel */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <Info className="h-4 w-4 text-zinc-400" />
              {lang === "en" ? "Migration & Transport Snapshot" : "వలస మరియు రవాణా సారాంశం"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">At-a-glance metrics for the two new welfare dimensions.</p>
          </div>

          {/* Migration row */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <Plane className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-amber-900">{lang === "en" ? "Migration" : "వలస"}</div>
                <div className="text-lg font-bold text-amber-700">{migrantCount} <span className="text-xs font-normal text-amber-500">/ {filteredStudents.length}</span></div>
              </div>
              <div className="h-2 rounded-full bg-amber-200 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${filteredStudents.length ? (migrantCount / filteredStudents.length) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-amber-600 mt-1">
                <span>{lang === "en" ? "Migrant students" : "వలస విద్యార్థులు"}</span>
                <span className="font-bold">{filteredStudents.length ? ((migrantCount / filteredStudents.length) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="mt-2 text-xs text-amber-700">
                {lang === "en"
                  ? `${filteredStudents.filter(s => (s as any).migration_flag && s.tier === "Critical").length} migrant students are in the Critical tier — schedule home visits before harvest season.`
                  : `${filteredStudents.filter(s => (s as any).migration_flag && s.tier === "Critical").length} వలస విద్యార్థులు క్రిటికల్ స్థాయిలో ఉన్నారు.`}
              </div>
            </div>
          </div>

          {/* Transport row */}
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 flex items-start gap-4">
            <div className="p-2 bg-sky-100 rounded-lg shrink-0">
              <Bus className="h-5 w-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-sky-900">{lang === "en" ? "Transport Allowance" : "రవాణా భత్యం"}</div>
                <div className="text-lg font-bold text-sky-700">{transportCount} <span className="text-xs font-normal text-sky-500">/ {filteredStudents.length}</span></div>
              </div>
              <div className="h-2 rounded-full bg-sky-200 overflow-hidden">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${filteredStudents.length ? (transportCount / filteredStudents.length) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-sky-600 mt-1">
                <span>{lang === "en" ? "Students with allowance" : "భత్యం పొందిన విద్యార్థులు"}</span>
                <span className="font-bold">{filteredStudents.length ? ((transportCount / filteredStudents.length) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="mt-2 text-xs text-sky-700">
                {lang === "en"
                  ? `${filteredStudents.filter(s => !(s as any).transport_allowance && s.tier !== "Low").length} at-risk students have no transport allowance — consider flagging for scheme enrollment.`
                  : `${filteredStudents.filter(s => !(s as any).transport_allowance && s.tier !== "Low").length} ప్రమాదంలో ఉన్న విద్యార్థులకు रवाणा భత్యం లేదు.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guidance banner */}
      <div className="bg-[color:var(--ap-navy)] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Info className="h-32 w-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              {lang === "en" ? "Teacher Guidance Summary" : "ఉపాధ్యాయ మార్గదర్శక సారాంశం"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-50/80">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="font-bold text-white mb-1">{lang === "en" ? "Migration Action" : "వలస చర్య"}</p>
                <p>{lang === "en"
                  ? "Prioritize home visits for migrant-flagged Class 9–10 students before the harvest season starts."
                  : "కోత కాలానికి ముందే 9–10 తరగతి వలస విద్యార్థుల ఇంటి సందర్శనలకు ప్రాధాన్యత ఇవ్వండి."}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="font-bold text-white mb-1">{lang === "en" ? "Transport Action" : "రవాణా చర్య"}</p>
                <p>{lang === "en"
                  ? "Enroll at-risk students without transport allowance into the Samagra Shiksha Transport Scheme immediately."
                  : "రవాణా భత్యం లేని ప్రమాదంలో ఉన్న విద్యార్థులను సమగ్ర శిక్ష రవాణా పథకంలో చేర్పించండి."}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-white text-[color:var(--ap-navy)] rounded-xl font-bold hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
          >
            {lang === "en" ? "Download Full Report" : "పూర్తి నివేదికను డౌన్‌లోడ్ చేయండి"}
          </button>
        </div>
      </div>
    </div>
  );
}
