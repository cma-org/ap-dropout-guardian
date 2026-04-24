"use client";
import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { School, Mandal, Metrics } from "@/lib/types";
import { fmtInt, pctFormat } from "@/lib/utils";
import { Database, School as SchoolIcon, Users, BarChart2, CheckCircle, AlertCircle } from "lucide-react";

const DATA_SOURCES = [
  { name: "Student Attendance Register", nameTE: "విద్యార్థి హాజరు రిజిస్టర్", records: "3,95,000+", status: "live", desc: "Monthly attendance per student, 2023-25", descTE: "నెలవారీ హాజరు డేటా" },
  { name: "FA/SA Marks (Formative & Summative)", nameTE: "FA/SA మార్కులు", records: "3,95,000+", status: "live", desc: "Subject-wise scores; null counts as risk signal", descTE: "సబ్జెక్టు వారీ మార్కులు" },
  { name: "School Location Master", nameTE: "పాఠశాల స్థాన డేటా", records: "9,149", status: "live", desc: "Lat/long, mandal, district, rural/urban classification", descTE: "పాఠశాల జిల్లా, మండల వివరాలు" },
  { name: "Dropout Register (CHILDSNO)", nameTE: "డ్రాపౌట్ రిజిస్టర్", records: "6,200+", status: "live", desc: "2023-24 confirmed dropouts used as training labels", descTE: "నిర్ధారిత డ్రాపౌట్ల జాబితా" },
  { name: "GSWS Socio-Economic Survey", nameTE: "GSWS సర్వే డేటా", records: "~1.2M HH", status: "partial", desc: "Parent literacy, income bracket — privacy-safe linkage", descTE: "తల్లిదండ్రుల విద్య, ఆదాయ వివరాలు" },
  { name: "Migration / Seasonal Movement", nameTE: "వలస డేటా", records: "Synthetic proxy", status: "synthetic", desc: "Flagged via attendance gap patterns; GSWS linkage in production", descTE: "హాజరు విరామాల ఆధారంగా" },
];

type Props = { schools: School[]; mandals: Mandal[]; metrics: Metrics };

export default function DistrictDataView({ schools, mandals, metrics }: Props) {
  const { lang } = useLang();

  const stats = useMemo(() => {
    const ntrSchools = schools.filter((s) => s.district_name === "NTR");
    const ntrMandals = mandals.filter((m) => m.district_name === "NTR");
    const totalStudents = ntrSchools.reduce((s, sc) => s + sc.n_students, 0);
    const totalFlagged = ntrSchools.reduce((s, sc) => s + sc.n_flagged, 0);
    return { schools: ntrSchools.length, mandals: ntrMandals.length, students: totalStudents, flagged: totalFlagged };
  }, [schools, mandals]);

  const { test_oot } = metrics;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{lang === "en" ? "Data Management" : "డేటా నిర్వహణ"}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {lang === "en" ? "NTR District — live data pipeline summary and source registry" : "NTR జిల్లా — లైవ్ డేటా పైప్‌లైన్ సారాంశం"}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <SchoolIcon className="h-4 w-4" />, label: lang === "en" ? "Schools" : "పాఠశాలలు", value: fmtInt(stats.schools) },
          { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Students Tracked" : "విద్యార్థులు", value: fmtInt(stats.students) },
          { icon: <AlertCircle className="h-4 w-4 text-orange-500" />, label: lang === "en" ? "At-Risk Flagged" : "ప్రమాదంలో ఉన్నవారు", value: fmtInt(stats.flagged) },
          { icon: <BarChart2 className="h-4 w-4 text-blue-600" />, label: lang === "en" ? "Model Recall" : "మోడల్ రీకాల్", value: pctFormat(test_oot.recall, 1) },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">{c.icon}<span className="text-xs font-medium">{c.label}</span></div>
            <div className="text-2xl font-bold text-zinc-900">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Data sources table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-zinc-50 flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 text-sm">{lang === "en" ? "Data Sources" : "డేటా మూలాలు"}</h2>
        </div>
        <div className="divide-y">
          {DATA_SOURCES.map((src) => (
            <div key={src.name} className="px-6 py-4 flex items-start gap-4">
              <div className="mt-0.5">
                {src.status === "live" && <CheckCircle className="h-4 w-4 text-green-500" />}
                {src.status === "partial" && <CheckCircle className="h-4 w-4 text-yellow-500" />}
                {src.status === "synthetic" && <AlertCircle className="h-4 w-4 text-zinc-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-800">{lang === "en" ? src.name : src.nameTE}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    src.status === "live" ? "bg-green-100 text-green-700" :
                    src.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>
                    {src.status === "live" ? (lang === "en" ? "Live" : "లైవ్") :
                     src.status === "partial" ? (lang === "en" ? "Partial" : "పాక్షిక") :
                     (lang === "en" ? "Synthetic" : "సింథటిక్")}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{lang === "en" ? src.desc : src.descTE}</p>
              </div>
              <div className="text-xs font-mono text-zinc-400 shrink-0">{src.records}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 text-sm text-blue-800">
        <strong>{lang === "en" ? "DPDP Compliance:" : "DPDP అనుపాలన:"}</strong>{" "}
        {lang === "en"
          ? "Aadhaar numbers are hashed (SHA-256) at ingest and never stored in plaintext. DPDP-restricted fields (parental income, caste) are shown as calibrated stand-ins in this demo. Production deployment uses AP Government secure data enclave."
          : "ఆధార్ నంబర్లు ఇంజెస్ట్ వద్దే హ్యాష్ చేయబడతాయి. DPDP-నిర్బంధిత ఫీల్డ్‌లు ఈ డెమోలో ప్రాతినిధ్య విలువలుగా చూపబడతాయి."}
      </div>
    </div>
  );
}
