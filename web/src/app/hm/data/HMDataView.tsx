"use client";
import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { School, Metrics } from "@/lib/types";
import { fmtInt, pctFormat } from "@/lib/utils";
import { Database, School as SchoolIcon, Users, BarChart2, CheckCircle, AlertCircle } from "lucide-react";

const DATA_SOURCES = [
  { name: "Student Attendance Register", nameTE: "విద్యార్థి హాజరు రిజిస్టర్", records: "School-level", status: "live", desc: "Monthly attendance per student in your school", descTE: "మీ పాఠశాల విద్యార్థుల హాజరు" },
  { name: "FA/SA Marks", nameTE: "FA/SA మార్కులు", records: "School-level", status: "live", desc: "Formative and summative assessment scores", descTE: "సూచిక మరియు సమగ్ర మూల్యాంకన మార్కులు" },
  { name: "Teacher Roster", nameTE: "ఉపాధ్యాయుల జాబితా", records: "School-level", status: "live", desc: "Teaching staff assignments and class mappings", descTE: "బోధన సిబ్బంది కేటాయింపులు" },
  { name: "Dropout Register", nameTE: "డ్రాపౌట్ రిజిస్టర్", records: "School-level", status: "live", desc: "Students who left during 2023-24 academic year", descTE: "2023-24లో వదిలిపెట్టిన విద్యార్థులు" },
  { name: "Parent Contact Log", nameTE: "తల్లిదండ్రుల సంప్రదింపు లాగ్", records: "Intervention", status: "partial", desc: "Outreach calls and WhatsApp messages logged by teachers", descTE: "ఉపాధ్యాయులు లాగ్ చేసిన సంప్రదింపులు" },
];

type Props = { schools: School[]; metrics: Metrics };

export default function HMDataView({ schools, metrics }: Props) {
  const { lang } = useLang();

  const stats = useMemo(() => {
    const mySchool = schools[0];
    return {
      students: mySchool?.n_students ?? 0,
      flagged: mySchool?.n_flagged ?? 0,
    };
  }, [schools]);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{lang === "en" ? "Data Management" : "డేటా నిర్వహణ"}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {lang === "en" ? "School-level data pipeline — sources and sync status" : "పాఠశాల స్థాయి డేటా పైప్‌లైన్ స్థితి"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Students Enrolled" : "నమోదైన విద్యార్థులు", value: fmtInt(stats.students) },
          { icon: <AlertCircle className="h-4 w-4 text-orange-500" />, label: lang === "en" ? "At-Risk Flagged" : "ప్రమాదంలో", value: fmtInt(stats.flagged) },
          { icon: <BarChart2 className="h-4 w-4 text-blue-600" />, label: lang === "en" ? "Model Recall" : "మోడల్ రీకాల్", value: pctFormat(metrics.test_oot.recall, 1) },
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

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 text-sm text-blue-800">
        <strong>{lang === "en" ? "Data Sync:" : "డేటా సింక్:"}</strong>{" "}
        {lang === "en"
          ? "All data syncs automatically every 5 minutes from the AP School Education Department systems. Contact your District Officer for access issues."
          : "అన్ని డేటా ప్రతి 5 నిమిషాలకు AP పాఠశాల విద్యా శాఖ సిస్టమ్‌ల నుండి స్వయంచాలకంగా సమకాలీకరించబడతాయి."}
      </div>
    </div>
  );
}
