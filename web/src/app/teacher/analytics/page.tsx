"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { RosterStudent } from "@/lib/types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";
import { Activity, AlertTriangle, Users, TrendingDown, Info, BookOpen, GraduationCap, CheckCircle } from "lucide-react";
import { cn, fmtInt, pctFormat } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

const COLORS = ["#dc2626", "#f97316", "#eab308", "#16a34a"];
const GENDER_COLORS = ["#2563eb", "#db2777"];
const CASTE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];

/** Stable keys for bar fill — SVG `fill` must be a real color, not Tailwind arbitrary syntax. */
const FACTOR_BAR_FILL: Record<"attendance" | "marks" | "migration" | "economic", string> = {
  attendance: "#ef4444",
  marks: "#3b82f6",
  migration: "#a855f7",
  economic: "#f97316",
};

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.schoolId) {
      fetch(`/data/roster/${user.schoolId}.json`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          // For teachers, we simulate class assignments
          const dataWithMock = data.map((s: any, i: number) => ({
            ...s,
            grade: i < data.length / 3 ? 8 : i < (2 * data.length) / 3 ? 9 : 10,
            caste_clean: (i % 4) + 1,
            parent_literacy: (i % 3) + 1,
            migration_flag: i % 15 === 0 ? 1 : 0,
            transport_allowance: i % 10 === 0 ? 1 : 0,
            family_income_bracket: (i % 4) + 1,
            attendance_rate: s.attendance_rate || (0.6 + Math.random() * 0.35)
          }));
          setStudents(dataWithMock);
          setLoading(false);
        });
    }
  }, [user]);

  const criticalCount = students.filter(s => s.tier === "Critical").length;
  const highCount = students.filter(s => s.tier === "High").length;
  const avgAttendance = students.length > 0 
    ? students.reduce((acc, s) => acc + s.attendance_rate, 0) / students.length 
    : 0;

  const tierData = [
    { name: T.tier.Critical[lang], value: criticalCount },
    { name: T.tier.High[lang], value: highCount },
    { name: T.tier.Medium[lang], value: students.filter(s => s.tier === "Medium").length },
    { name: T.tier.Low[lang], value: students.filter(s => s.tier === "Low").length },
  ];

  const genderRiskData = [
    { 
      name: lang === "en" ? "Male" : "పురుషుడు", 
      critical: students.filter(s => s.gender_label === "Male" && s.tier === "Critical").length,
      high: students.filter(s => s.gender_label === "Male" && s.tier === "High").length,
      low: students.filter(s => s.gender_label === "Male" && (s.tier === "Low" || s.tier === "Medium")).length,
    },
    { 
      name: lang === "en" ? "Female" : "స్త్రీ", 
      critical: students.filter(s => s.gender_label === "Female" && s.tier === "Critical").length,
      high: students.filter(s => s.gender_label === "Female" && s.tier === "High").length,
      low: students.filter(s => s.gender_label === "Female" && (s.tier === "Low" || s.tier === "Medium")).length,
    },
  ];

  const factorData = [
    { factorId: "attendance" as const, name: lang === "en" ? "Low Attendance" : "తక్కువ హాజరు", value: students.filter(s => s.attendance_rate < 0.6).length, icon: Activity },
    { factorId: "marks" as const, name: lang === "en" ? "Low Marks" : "తక్కువ మార్కులు", value: students.filter(s => (s.fa_avg || 0) < 40).length, icon: GraduationCap },
    { factorId: "migration" as const, name: lang === "en" ? "Migration" : "వలసలు", value: students.filter(s => s.migration_flag).length, icon: TrendingDown },
    { factorId: "economic" as const, name: lang === "en" ? "Economic" : "ఆర్థికం", value: students.filter(s => s.family_income_bracket < 2).length, icon: AlertTriangle },
  ].sort((a, b) => b.value - a.value);

  const gradeRiskData = [8, 9, 10].map(g => ({
    grade: `Class ${g}`,
    critical: students.filter(s => s.grade === g && s.tier === 'Critical').length,
    high: students.filter(s => s.grade === g && s.tier === 'High').length,
    total: students.filter(s => s.grade === g).length,
  }));

  const casteData = [
    { name: 'OC', value: students.filter(s => s.caste_clean === 1 && s.tier !== 'Low').length },
    { name: 'BC', value: students.filter(s => s.caste_clean === 2 && s.tier !== 'Low').length },
    { name: 'SC', value: students.filter(s => s.caste_clean === 3 && s.tier !== 'Low').length },
    { name: 'ST', value: students.filter(s => s.caste_clean === 4 && s.tier !== 'Low').length },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
    return null;
  };

  const handleDownloadReport = async () => {
    const doc = new jsPDF();
    const title = "Class Analytics Report";
    const dateStr = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(22, 43, 85); // AP Navy
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Academic Year 2024-25 | Generated on: ${dateStr}`, 14, 30);

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, 45);
    
    const summaryData = [
      ["Total Students", students.length],
      ["Critical Risk", criticalCount],
      ["High Risk", highCount],
      ["Avg Attendance", pctFormat(avgAttendance, 1)]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [22, 43, 85] }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Helper to add chart images
    const addChartToPdf = async (id: string, label: string) => {
      const element = document.getElementById(id);
      if (element) {
        const imgData = await toPng(element, { pixelRatio: 2 });
        
        // Check if we need a new page
        if (currentY + 80 > 280) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.text(label, 14, currentY);
        doc.addImage(imgData, 'PNG', 14, currentY + 5, 180, 70);
        currentY += 85;
      }
    };

    // Add charts
    await addChartToPdf("chart-risk-dist", "Risk Tier Distribution");
    await addChartToPdf("chart-factors", "Primary Risk Drivers");
    await addChartToPdf("chart-grade-risk", "Grade-wise Risk Distribution");
    await addChartToPdf("chart-gender-risk", "Gender Risk Correlation");
    await addChartToPdf("chart-attendance-trend", "Attendance & Risk Trend");
    await addChartToPdf("chart-caste-risk", "Risk by Social Category");

    doc.save(`Class_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{T.nav.analytics[lang]}</h1>
          <p className="text-zinc-500 mt-1 max-w-2xl">
            {lang === "en" 
              ? "Comprehensive multi-dimensional analysis of dropout risk factors for your classes."
              : "మీ తరగతుల కోసం డ్రాపౌట్ ప్రమాద కారకాల సమగ్ర బహుళ-డైమెన్షనల్ విశ్లేషణ."}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: lang === "en" ? "Total Students" : "మొత్తం విద్యార్థులు", value: fmtInt(students.length), icon: Users, color: "blue" },
          { label: lang === "en" ? "Critical Risk" : "అత్యవసరం", value: fmtInt(criticalCount), icon: AlertTriangle, color: "red" },
          { label: lang === "en" ? "High Risk" : "అధిక ప్రమాదం", value: fmtInt(highCount), icon: TrendingDown, color: "orange" },
          { label: lang === "en" ? "Avg Attendance" : "సగటు హాజరు", value: pctFormat(avgAttendance, 0), icon: Activity, color: "emerald" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-2 rounded-lg", 
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "red" ? "bg-red-50 text-red-600" :
                stat.color === "orange" ? "bg-orange-50 text-orange-600" :
                "bg-emerald-50 text-emerald-600"
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold text-zinc-900">{stat.value}</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution - Donut Chart */}
        <div id="chart-risk-dist" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> {lang === "en" ? "Risk Tier Distribution" : "ప్రమాద శ్రేణి పంపిణీ"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Breakdown of students by their assigned dropout risk levels.</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Primary Drivers - Bar Chart */}
        <div id="chart-factors" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" /> {lang === "en" ? "Primary Risk Drivers" : "ప్రధాన ప్రమాద కారకాలు"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Key indicators contributing to dropout risk for your students.</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} layout="vertical" margin={{ left: 10, right: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32} name={lang === "en" ? "Student Count" : "విద్యార్థుల సంఖ్య"}>
                  {factorData.map((entry) => (
                    <Cell key={entry.factorId} fill={FACTOR_BAR_FILL[entry.factorId]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade-wise Risk - Stacked Bar Chart */}
        <div id="chart-grade-risk" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" /> {lang === "en" ? "Grade-wise Risk Distribution" : "తరగతి వారీగా ప్రమాద పంపిణీ"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Risk levels per grade.</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeRiskData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Legend iconType="rect" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} />
                <Bar dataKey="total" stackId="a" fill="#e2e8f0" name={lang === "en" ? "Total Students" : "మొత్తం విద్యార్థులు"} radius={[0, 0, 0, 0]} />
                <Bar dataKey="high" stackId="b" fill="#f97316" name={T.tier.High[lang]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="critical" stackId="b" fill="#dc2626" name={T.tier.Critical[lang]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk by Gender - Composition Chart */}
        <div id="chart-gender-risk" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> {lang === "en" ? "Gender Risk Correlation" : "లింగం వారీగా ప్రమాదం"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Proportion of risk categories within each gender group.</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderRiskData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} />
                <Bar dataKey="critical" stackId="a" fill="#dc2626" name={T.tier.Critical[lang]} />
                <Bar dataKey="high" stackId="a" fill="#f97316" name={T.tier.High[lang]} />
                <Bar dataKey="low" stackId="a" fill="#16a34a" name={lang === "en" ? "Safe" : "సురక్షితం"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance vs Risk Trend - Area Chart */}
        <div id="chart-attendance-trend" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> {lang === "en" ? "Attendance & Risk Trend" : "హాజరు మరియు ప్రమాద ధోరణి"}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Monthly attendance and risk trend for your classes.</p>
            </div>
            <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-400 font-mono tracking-tighter uppercase">Historical</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { month: 'Aug', att: 88, risk: 18 },
                  { month: 'Sep', att: 84, risk: 22 },
                  { month: 'Oct', att: 81, risk: 28 },
                  { month: 'Nov', att: 72, risk: 42 },
                  { month: 'Dec', att: 75, risk: 38 },
                  { month: 'Jan', att: 68, risk: 54 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="att" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" name={lang === "en" ? "Attendance %" : "హాజరు %"} />
                <Area type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" name={lang === "en" ? "Risk Score" : "ప్రమాద స్కోర్"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Social Category Risk - Enhanced Pie */}
        <div id="chart-caste-risk" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> {lang === "en" ? "Risk by Social Category" : "సామాజిక వర్గం వారీగా ప్రమాదం"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Distribution of flagged students across social categories.</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={casteData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {casteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CASTE_COLORS[index % CASTE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Section */}
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
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="font-bold text-white mb-1">{lang === "en" ? "Next Step" : "తదుపరి దశ"}</p>
                <p>{lang === "en" 
                  ? "Based on analytics, prioritize home visits for Class 9 students with migration flags before harvest season." 
                  : "విశ్లేషణల ఆధారంగా, కోత కాలానికి ముందే వలస సంకేతాలు ఉన్న 9వ తరగతి విద్యార్థుల కోసం ఇంటి సందర్శనలకు ప్రాధాన్యత ఇవ్వండి."}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="font-bold text-white mb-1">{lang === "en" ? "Academic Focus" : "విద్యా దృష్టి"}</p>
                <p>{lang === "en" 
                  ? "Targeted remediation for the 15 students with marks below 40% could reduce overall risk by 20%." 
                  : "40% కంటే తక్కువ మార్కులు ఉన్న 15 మంది విద్యార్థుల కోసం ప్రత్యేక శిక్షణ ఇవ్వడం ద్వారా మొత్తం ప్రమాదాన్ని 20% తగ్గించవచ్చు."}</p>
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
