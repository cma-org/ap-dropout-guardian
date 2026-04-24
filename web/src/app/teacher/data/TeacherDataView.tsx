"use client";
import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { School, Metrics } from "@/lib/types";
import { fmtInt, pctFormat } from "@/lib/utils";
import { Database, Users, BarChart2, CheckCircle, AlertCircle, ClipboardList } from "lucide-react";

const DATA_SOURCES = [
  { name: "Class Attendance Register", nameTE: "తరగతి హాజరు రిజిస్టర్", records: "Class-level", status: "live", desc: "Daily attendance entries for your classes", descTE: "మీ తరగతుల రోజువారీ హాజరు" },
  { name: "FA/SA Marks — Your Classes", nameTE: "FA/SA మార్కులు", records: "Class-level", status: "live", desc: "Assessment scores for students you teach", descTE: "మీరు బోధించే విద్యార్థుల మూల్యాంకన మార్కులు" },
  { name: "Intervention Log", nameTE: "జోక్యం లాగ్", records: "Per student", status: "partial", desc: "Parent contacts and counselling sessions you have logged", descTE: "మీరు లాగ్ చేసిన తల్లిదండ్రుల సంప్రదింపులు" },
  { name: "Risk Scores (Model Output)", nameTE: "రిస్క్ స్కోర్లు", records: "Per student", status: "live", desc: "XGBoost predictions updated each week from pipeline", descTE: "వారానికోసారి నవీకరించబడిన AI అంచనాలు" },
];

type Props = { schools: School[]; metrics: Metrics };

export default function TeacherDataView({ schools, metrics }: Props) {
  const { lang } = useLang();

  const totalStudents = useMemo(() => schools.reduce((s, sc) => s + sc.n_students, 0), [schools]);
  const totalFlagged = useMemo(() => schools.reduce((s, sc) => s + sc.n_flagged, 0), [schools]);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{lang === "en" ? "Data Overview" : "డేటా సమీక్ష"}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {lang === "en" ? "Class-level data sources and sync status for your students" : "మీ విద్యార్థులకు తరగతి-స్థాయి డేటా మూలాలు"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Your Students" : "మీ విద్యార్థులు", value: fmtInt(totalStudents) },
          { icon: <AlertCircle className="h-4 w-4 text-orange-500" />, label: lang === "en" ? "Flagged At-Risk" : "ప్రమాదంలో ఉన్నవారు", value: fmtInt(totalFlagged) },
          { icon: <BarChart2 className="h-4 w-4 text-blue-600" />, label: lang === "en" ? "Detection Rate" : "గుర్తింపు రేటు", value: pctFormat(metrics.test_oot.recall, 1) },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">{c.icon}<span className="text-xs font-medium">{c.label}</span></div>
            <div className="text-2xl font-bold text-zinc-900">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-zinc-50 flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 text-sm">{lang === "en" ? "Data Sources" : "డేటా మూలాలు"}</h2>
        </div>
        <div className="divide-y">
          {DATA_SOURCES.map((src) => (
            <div key={src.name} className="px-6 py-4 flex items-start gap-4">
              <div className="mt-0.5">
                {src.status === "live" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <CheckCircle className="h-4 w-4 text-yellow-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-800">{lang === "en" ? src.name : src.nameTE}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${src.status === "live" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {src.status === "live" ? (lang === "en" ? "Live" : "లైవ్") : (lang === "en" ? "Partial" : "పాక్షిక")}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{lang === "en" ? src.desc : src.descTE}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
        <div className="flex items-start gap-2">
          <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <strong>{lang === "en" ? "Tip:" : "సూచన:"}</strong>{" "}
            {lang === "en"
              ? "Log your intervention calls using the 'Log Intervention' button on each student's detail page. This feedback helps the model improve its predictions each week."
              : "ప్రతి విద్యార్థి వివరాల పేజీలో 'జోక్యం లాగ్' బటన్‌ని ఉపయోగించండి. ఈ ఫీడ్‌బ్యాక్ మోడల్‌ను మెరుగుపరుస్తుంది."}
          </span>
        </div>
      </div>
    </div>
  );
}
