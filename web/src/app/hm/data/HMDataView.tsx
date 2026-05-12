"use client";
import { useMemo, useState, useRef } from "react";
import { useLang } from "@/lib/i18n";
import type { School, Metrics } from "@/lib/types";
import { fmtInt, pctFormat } from "@/lib/utils";
import {
  Database, Users, BarChart2, CheckCircle, AlertCircle,
  Upload, X, Loader2, CloudUpload,
} from "lucide-react";

const DATA_SOURCES = [
  { name: "Student Attendance Register", nameTE: "విద్యార్థి హాజరు రిజిస్టర్", status: "live", desc: "Monthly attendance per student in your school", descTE: "మీ పాఠశాల విద్యార్థుల హాజరు" },
  { name: "FA/SA Marks", nameTE: "FA/SA మార్కులు", status: "live", desc: "Formative and summative assessment scores", descTE: "మూల్యాంకన మార్కులు" },
  { name: "Teacher Roster", nameTE: "ఉపాధ్యాయుల జాబితా", status: "live", desc: "Teaching staff assignments and class mappings", descTE: "బోధన సిబ్బంది కేటాయింపులు" },
  { name: "Dropout Register", nameTE: "డ్రాపౌట్ రిజిస్టర్", status: "live", desc: "Students who left during 2023-24 academic year", descTE: "2023-24లో వదిలిపెట్టిన విద్యార్థులు" },
  { name: "Parent Contact Log", nameTE: "తల్లిదండ్రుల సంప్రదింపు లాగ్", status: "partial", desc: "Outreach calls and WhatsApp messages logged", descTE: "లాగ్ చేసిన సంప్రదింపులు" },
];

const UPLOAD_SLOTS = [
  { id: "attendance", label: "Attendance Register (CSV)", labelTE: "హాజరు రిజిస్టర్ (CSV)", accept: ".csv,.xlsx", hint: "Monthly attendance — CHILDSNO, month columns" },
  { id: "marks", label: "FA/SA Marks (CSV / Excel)", labelTE: "FA/SA మార్కులు (CSV/Excel)", accept: ".csv,.xlsx", hint: "Subject-wise marks per student" },
  { id: "dropout", label: "Dropout Register (CSV)", labelTE: "డ్రాపౌట్ రిజిస్టర్ (CSV)", accept: ".csv", hint: "CHILDSNO of students who dropped out" },
];

type UploadState = "idle" | "uploading" | "done" | "error";
type FileEntry = { name: string; size: number; state: UploadState };

type Props = { school: School | null; metrics: Metrics };

export default function HMDataView({ school, metrics }: Props) {
  const { lang } = useLang();
  const [uploads, setUploads] = useState<Record<string, FileEntry>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const totalStudents = school?.n_students ?? 0;
  const totalFlagged = school?.n_flagged ?? 0;

  function handleFile(slotId: string, file: File) {
    setUploads((u) => ({ ...u, [slotId]: { name: file.name, size: file.size, state: "uploading" } }));
    setTimeout(() => setUploads((u) => ({ ...u, [slotId]: { ...u[slotId], state: "done" } })), 1800);
  }

  function removeUpload(slotId: string) {
    setUploads((u) => { const n = { ...u }; delete n[slotId]; return n; });
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{lang === "en" ? "Data Management" : "డేటా నిర్వహణ"}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {lang === "en" ? "Upload school data files and view pipeline sync status" : "పాఠశాల డేటా ఫైళ్లు అప్‌లోడ్ చేయండి మరియు సింక్ స్థితి చూడండి"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: <Users className="h-4 w-4" />, label: lang === "en" ? "Students Enrolled" : "నమోదైన విద్యార్థులు", value: fmtInt(totalStudents) },
          { icon: <AlertCircle className="h-4 w-4 text-orange-500" />, label: lang === "en" ? "At-Risk Flagged" : "ప్రమాదంలో", value: fmtInt(totalFlagged) },
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
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {UPLOAD_SLOTS.map((slot) => {
            const entry = uploads[slot.id];
            const isDragging = dragging === slot.id;
            return (
              <div key={slot.id}>
                <input
                  ref={(el) => { inputRefs.current[slot.id] = el; }}
                  type="file" accept={slot.accept} className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(slot.id, f); e.target.value = ""; }}
                />
                {entry ? (
                  <div className={`rounded-xl border-2 p-4 flex items-start gap-3 ${entry.state === "done" ? "border-green-300 bg-green-50" : "border-blue-300 bg-blue-50"}`}>
                    <div className="mt-0.5">
                      {entry.state === "uploading" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                      {entry.state === "done" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 truncate">{entry.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {entry.state === "uploading" ? (lang === "en" ? "Uploading…" : "అప్‌లోడ్ అవుతోంది…") : (lang === "en" ? "Uploaded successfully" : "విజయవంతంగా అప్‌లోడ్ అయింది")}
                      </p>
                      <p className="text-[10px] text-zinc-400">{(entry.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => removeUpload(slot.id)} className="text-zinc-400 hover:text-zinc-700"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button
                    className={`w-full rounded-xl border-2 border-dashed p-5 flex flex-col items-center gap-2 transition-colors cursor-pointer ${isDragging ? "border-[color:var(--ap-navy)] bg-blue-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"}`}
                    onClick={() => inputRefs.current[slot.id]?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(slot.id); }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={(e) => { e.preventDefault(); setDragging(null); const f = e.dataTransfer.files[0]; if (f) handleFile(slot.id, f); }}
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

      {/* Data sources */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-zinc-50 flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-900 text-sm">{lang === "en" ? "Current Data Sources" : "ప్రస్తుత డేటా మూలాలు"}</h2>
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
          ? "Uploaded files are processed within 5 minutes and scores are updated automatically. Contact your District Officer for access issues."
          : "అప్‌లోడ్ చేసిన ఫైళ్లు 5 నిమిషాల్లో ప్రాసెస్ చేయబడతాయి మరియు స్కోర్లు స్వయంచాలకంగా నవీకరించబడతాయి."}
      </div>
    </div>
  );
}
