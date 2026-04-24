"use client";
import { useMemo, useState, useRef } from "react";
import { useLang } from "@/lib/i18n";
import type { School, Mandal, Metrics } from "@/lib/types";
import { fmtInt, pctFormat } from "@/lib/utils";
import {
  Database, Users, BarChart2, CheckCircle, AlertCircle,
  Upload, FileText, X, Loader2, CloudUpload,
} from "lucide-react";

const DATA_SOURCES = [
  { name: "Student Attendance Register", nameTE: "విద్యార్థి హాజరు రిజిస్టర్", records: "3,95,000+", status: "live", desc: "Monthly attendance per student, 2023-25", descTE: "నెలవారీ హాజరు డేటా" },
  { name: "FA/SA Marks (Formative & Summative)", nameTE: "FA/SA మార్కులు", records: "3,95,000+", status: "live", desc: "Subject-wise scores; null counts as risk signal", descTE: "సబ్జెక్టు వారీ మార్కులు" },
  { name: "School Location Master", nameTE: "పాఠశాల స్థాన డేటా", records: "9,149", status: "live", desc: "Lat/long, mandal, district, rural/urban classification", descTE: "పాఠశాల జిల్లా, మండల వివరాలు" },
  { name: "Dropout Register (CHILDSNO)", nameTE: "డ్రాపౌట్ రిజిస్టర్", records: "6,200+", status: "live", desc: "2023-24 confirmed dropouts used as training labels", descTE: "నిర్ధారిత డ్రాపౌట్ల జాబితా" },
  { name: "GSWS Socio-Economic Survey", nameTE: "GSWS సర్వే డేటా", records: "~1.2M HH", status: "partial", desc: "Parent literacy, income bracket — privacy-safe linkage", descTE: "తల్లిదండ్రుల విద్య, ఆదాయ వివరాలు" },
  { name: "Migration / Seasonal Movement", nameTE: "వలస డేటా", records: "Synthetic proxy", status: "synthetic", desc: "Flagged via attendance gap patterns; GSWS linkage in production", descTE: "హాజరు విరామాల ఆధారంగా" },
];

const UPLOAD_SLOTS = [
  { id: "attendance", label: "Attendance Register (CSV)", labelTE: "హాజరు రిజిస్టర్ (CSV)", accept: ".csv,.xlsx", hint: "FIN_YEAR format — CHILDSNO, month columns" },
  { id: "marks", label: "FA/SA Marks (CSV / Excel)", labelTE: "FA/SA మార్కులు (CSV/Excel)", accept: ".csv,.xlsx", hint: "Subject-wise marks per student" },
  { id: "dropout", label: "Dropout Register (CSV)", labelTE: "డ్రాపౌట్ రిజిస్టర్ (CSV)", accept: ".csv", hint: "CHILDSNO_Dropped format" },
  { id: "schools", label: "School Location Master (CSV)", labelTE: "పాఠశాల స్థాన మాస్టర్ (CSV)", accept: ".csv,.xlsx", hint: "SCHOOL_CODE, lat, long, mandal, district" },
];

type UploadState = "idle" | "uploading" | "done" | "error";
type FileEntry = { name: string; size: number; state: UploadState };

type Props = { schools: School[]; mandals: Mandal[]; metrics: Metrics };

export default function DistrictDataView({ schools, mandals, metrics }: Props) {
  const { lang } = useLang();
  const [uploads, setUploads] = useState<Record<string, FileEntry>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const stats = useMemo(() => {
    const ntrSchools = schools.filter((s) => s.district_name === "NTR");
    const ntrMandals = mandals.filter((m) => m.district_name === "NTR");
    return {
      schools: ntrSchools.length,
      mandals: ntrMandals.length,
      students: ntrSchools.reduce((s, sc) => s + sc.n_students, 0),
      flagged: ntrSchools.reduce((s, sc) => s + sc.n_flagged, 0),
    };
  }, [schools, mandals]);

  function handleFile(slotId: string, file: File) {
    setUploads((u) => ({ ...u, [slotId]: { name: file.name, size: file.size, state: "uploading" } }));
    setTimeout(() => {
      setUploads((u) => ({ ...u, [slotId]: { ...u[slotId], state: "done" } }));
    }, 1800);
  }

  function removeUpload(slotId: string) {
    setUploads((u) => { const n = { ...u }; delete n[slotId]; return n; });
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{lang === "en" ? "Data Management" : "డేటా నిర్వహణ"}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {lang === "en" ? "NTR District — upload data files and view pipeline status" : "NTR జిల్లా — డేటా ఫైళ్లు అప్‌లోడ్ చేయండి మరియు పైప్‌లైన్ స్థితి చూడండి"}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Students Tracked" : "విద్యార్థులు", value: fmtInt(stats.students) },
          { icon: <AlertCircle className="h-4 w-4 text-orange-500" />, label: lang === "en" ? "At-Risk Flagged" : "ప్రమాదంలో", value: fmtInt(stats.flagged) },
          { icon: <BarChart2 className="h-4 w-4 text-blue-600" />, label: lang === "en" ? "Model Recall" : "రీకాల్", value: pctFormat(metrics.test_oot.recall, 1) },
          { icon: <Database className="h-4 w-4 text-violet-600" />, label: lang === "en" ? "Files Uploaded" : "అప్‌లోడ్ ఫైళ్లు", value: Object.values(uploads).filter((u) => u.state === "done").length.toString() },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">{c.icon}<span className="text-xs font-medium">{c.label}</span></div>
            <div className="text-2xl font-bold text-zinc-900">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Upload section */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-zinc-50 flex items-center gap-2">
          <CloudUpload className="h-4 w-4 text-[color:var(--ap-navy)]" />
          <h2 className="font-semibold text-zinc-900 text-sm">{lang === "en" ? "Upload Data Files" : "డేటా ఫైళ్లు అప్‌లోడ్ చేయండి"}</h2>
          <span className="ml-auto text-[10px] text-zinc-400">{lang === "en" ? "CSV or Excel · Max 50 MB" : "CSV లేదా Excel · గరిష్టం 50 MB"}</span>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UPLOAD_SLOTS.map((slot) => {
            const entry = uploads[slot.id];
            const isDragging = dragging === slot.id;

            return (
              <div key={slot.id}>
                <input
                  ref={(el) => { inputRefs.current[slot.id] = el; }}
                  type="file"
                  accept={slot.accept}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(slot.id, f); e.target.value = ""; }}
                />
                {entry ? (
                  <div className={`rounded-xl border-2 p-4 flex items-start gap-3 transition-colors ${entry.state === "done" ? "border-green-300 bg-green-50" : entry.state === "error" ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}`}>
                    <div className="mt-0.5">
                      {entry.state === "uploading" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                      {entry.state === "done" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {entry.state === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 truncate">{entry.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {entry.state === "uploading" ? (lang === "en" ? "Uploading…" : "అప్‌లోడ్ అవుతోంది…") :
                         entry.state === "done" ? (lang === "en" ? "Uploaded successfully" : "విజయవంతంగా అప్‌లోడ్ అయింది") :
                         (lang === "en" ? "Upload failed" : "అప్‌లోడ్ విఫలమైంది")}
                      </p>
                      <p className="text-[10px] text-zinc-400">{(entry.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => removeUpload(slot.id)} className="text-zinc-400 hover:text-zinc-700 transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    className={`w-full rounded-xl border-2 border-dashed p-5 flex flex-col items-center gap-2 transition-colors cursor-pointer text-left ${isDragging ? "border-[color:var(--ap-navy)] bg-blue-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"}`}
                    onClick={() => inputRefs.current[slot.id]?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(slot.id); }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragging(null);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFile(slot.id, f);
                    }}
                  >
                    <Upload className="h-5 w-5 text-zinc-400" />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-zinc-700">{lang === "en" ? slot.label : slot.labelTE}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{slot.hint}</p>
                    </div>
                    <span className="text-[10px] text-[color:var(--ap-navy)] font-medium">
                      {lang === "en" ? "Click to browse or drag & drop" : "క్లిక్ చేయండి లేదా డ్రాగ్ చేయండి"}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data sources table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-zinc-50 flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 text-sm">{lang === "en" ? "Current Data Sources" : "ప్రస్తుత డేటా మూలాలు"}</h2>
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
          ? "Aadhaar numbers are hashed (SHA-256) at ingest and never stored in plaintext. DPDP-restricted fields are shown as calibrated stand-ins in this demo."
          : "ఆధార్ నంబర్లు ఇంజెస్ట్ వద్దే హ్యాష్ చేయబడతాయి. DPDP-నిర్బంధిత ఫీల్డ్‌లు ఈ డెమోలో ప్రాతినిధ్య విలువలుగా చూపబడతాయి."}
      </div>
    </div>
  );
}
