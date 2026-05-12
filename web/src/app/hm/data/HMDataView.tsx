"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { School, Metrics } from "@/lib/types";
import { fmtInt, pctFormat } from "@/lib/utils";
import {
  Database, Users, BarChart2, CheckCircle, AlertCircle,
  Upload, X, Loader2, CloudUpload, Download
} from "lucide-react";

const DATA_SOURCES = [
  { name: "Student Attendance Register", nameTE: "విద్యార్థి హాజరు రిజిస్టర్", status: "live", desc: "Monthly attendance per student in your school", descTE: "మీ పాఠశాల విద్యార్థుల హాజరు" },
  { name: "FA/SA Marks", nameTE: "FA/SA మార్కులు", status: "live", desc: "Formative and summative assessment scores", descTE: "మూల్యాంకన మార్కులు" },
  { name: "Teacher Roster", nameTE: "ఉపాధ్యాయుల జాబితా", status: "live", desc: "Teaching staff assignments and class mappings", descTE: "బోధన సిబ్బంది కేటాయింపులు" },
  { name: "Dropout Register", nameTE: "డ్రాపౌట్ రిజిస్టర్", status: "live", desc: "Students who left during 2023-24 academic year", descTE: "2023-24లో వదిలిపెట్టిన విద్యార్థులు" },
  { name: "Parent Contact Log", nameTE: "తల్లిదండ్రుల సంప్రదింపు లాగ్", status: "partial", desc: "Outreach calls and WhatsApp messages logged", descTE: "లాగ్ చేసిన సంప్రదింపులు" },
];

const UPLOAD_SLOTS = [
  { id: "attendance", label: "Attendance Register (CSV)", labelTE: "హాజరు రిజిస్టర్ (CSV)", accept: ".csv", hint: "Monthly attendance — CHILDSNO, attendanceRate", template: "/templates/attendance.csv?v=2" },
  { id: "marks", label: "FA/SA Marks (CSV)", nameTE: "FA/SA మార్కులు (CSV)", accept: ".csv", hint: "Subject-wise marks per student", template: "/templates/marks.csv?v=2" },
  { id: "dropout", label: "Dropout Register (CSV)", labelTE: "డ్రాపౌట్ రిజిస్టర్ (CSV)", accept: ".csv", hint: "CHILDSNO of students who dropped out", template: "/templates/dropout.csv?v=2" },
];

type UploadState = "idle" | "uploading" | "done" | "error";
type FileEntry = { name: string; size: number; state: UploadState };

type RecentUpload = { id: number; slotId: string; fileName: string; recordCount: number; createdAt: string; user?: { name: string } };

type Props = { school: School | null; metrics: Metrics };

function parseCsv(text: string) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.trim());
    const record: any = {};
    headers.forEach((h, idx) => { record[h] = values[idx]; });
    records.push(record);
  }
  return records;
}

function formatDate(dateStr: string, lang: string) {
  const date = new Date(dateStr);
  if (lang === "te") {
    return date.toLocaleDateString("te-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HMDataView({ school, metrics }: Props) {
  const { lang } = useLang();
  const { user } = useAuth();
  const [uploads, setUploads] = useState<Record<string, FileEntry>>({});
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const totalStudents = school?.n_students ?? 0;
  const totalFlagged = school?.n_flagged ?? 0;

  // Fetch recent uploads on mount
  useEffect(() => {
    async function fetchRecentUploads() {
      try {
        const params = new URLSearchParams();
        if (school?.school_id) params.set("schoolId", String(school.school_id));
        params.set("limit", "20");

        const res = await fetch(`/api/upload?${params}`);
        if (res.ok) {
          const data = await res.json();
          setRecentUploads(data.uploads || []);
        }
      } catch (err) {
        console.error("Failed to fetch recent uploads:", err);
      }
    }
    fetchRecentUploads();
  }, [school?.school_id]);

  // Sync recent uploads with local upload state
  useEffect(() => {
    const completedSlots = Object.entries(uploads)
      .filter(([, entry]) => entry.state === "done")
      .map(([slotId, entry]) => {
        const recentMatch = recentUploads.find(u => u.slotId === slotId);
        return {
          id: recentMatch?.id ?? Date.now(),
          slotId,
          fileName: entry.name,
          recordCount: 0,
          createdAt: recentMatch?.createdAt ?? new Date().toISOString(),
          user: user ? { name: user.name } : undefined,
        };
      });

    if (completedSlots.length > 0) {
      setRecentUploads(prev => {
        const existingIds = new Set(completedSlots.map(s => s.id));
        const filteredPrev = prev.filter(u => !existingIds.has(u.id));
        return [...completedSlots, ...filteredPrev].slice(0, 20);
      });
    }
  }, [uploads, user]);

  const totalFilesUploaded = recentUploads.length;

  async function handleFile(slotId: string, file: File) {
    setUploads((u) => ({ ...u, [slotId]: { name: file.name, size: file.size, state: "uploading" } }));
    try {
      const text = await file.text();
      const records = parseCsv(text);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          records,
          fileName: file.name,
          userId: user?.id,
          schoolId: school?.school_id,
        })
      });
      if (res.ok) {
        setUploads((u) => ({ ...u, [slotId]: { ...u[slotId], state: "done" } }));
        // Refresh recent uploads
        const params = new URLSearchParams();
        if (school?.school_id) params.set("schoolId", String(school.school_id));
        params.set("limit", "20");
        const recentRes = await fetch(`/api/upload?${params}`);
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentUploads(data.uploads || []);
        }
      } else {
        setUploads((u) => ({ ...u, [slotId]: { ...u[slotId], state: "error" } }));
      }
    } catch (err) {
      console.error(err);
      setUploads((u) => ({ ...u, [slotId]: { ...u[slotId], state: "error" } }));
    }
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
          { icon: <Database className="h-4 w-4 text-violet-600" />, label: lang === "en" ? "Files Uploaded" : "అప్‌లోడ్ ఫైళ్లు", value: totalFilesUploaded.toString() },
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
          <span className="ml-auto text-[10px] text-zinc-400">{lang === "en" ? "CSV Only · Max 50 MB" : "CSV మాత్రమే · గరిష్టం 50 MB"}</span>
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
                  <div className={`rounded-xl border-2 p-4 flex items-start gap-3 ${entry.state === "done" ? "border-green-300 bg-green-50" : entry.state === "error" ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}`}>
                    <div className="mt-0.5">
                      {entry.state === "uploading" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                      {entry.state === "done" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {entry.state === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 truncate">{entry.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {entry.state === "uploading" ? (lang === "en" ? "Uploading and processing…" : "అప్‌లోడ్ అవుతోంది…") : entry.state === "error" ? (lang === "en" ? "Upload failed" : "అప్‌లోడ్ విఫలమైంది") : (lang === "en" ? "Uploaded and processed" : "విజయవంతంగా అప్‌లోడ్ అయింది")}
                      </p>
                      <p className="text-[10px] text-zinc-400">{(entry.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => removeUpload(slot.id)} className="text-zinc-400 hover:text-zinc-700"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div
                    className={`w-full rounded-xl border-2 border-dashed p-5 flex flex-col items-center gap-2 transition-colors cursor-pointer ${isDragging ? "border-[color:var(--ap-navy)] bg-blue-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zenc-50"}`}
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
                    <a
                      href={slot.template}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:underline z-10"
                    >
                      <Download className="h-3 w-3" />
                      {lang === "en" ? "Download Template" : "టెంప్లేట్‌ను డౌన్‌లోడ్ చేయండి"}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent uploads */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-zinc-50 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <h2 className="font-semibold text-zinc-900 text-sm">{lang === "en" ? "Recent Uploads" : "ఇటీవల అప్‌లోడ్‌లు"}</h2>
          <span className="ml-auto text-[10px] text-zinc-400">{lang === "en" ? "Last 20 uploads" : "చివరి 20 అప్‌లోడ్‌లు"}</span>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {recentUploads.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-500 text-sm">
              {lang === "en" ? "No recent uploads." : "ఇటీవల అప్‌లోడ్‌లు లేవు."}
            </div>
          ) : (
            recentUploads.map((upload) => (
              <div key={upload.id} className="px-6 py-3 flex items-center gap-4">
                <div className="mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{upload.fileName}</p>
                  <p className="text-[10px] text-zinc-500">
                    {UPLOAD_SLOTS.find(s => s.id === upload.slotId)?.labelTE ?? upload.slotId}
                    {upload.recordCount > 0 && ` · ${upload.recordCount} records`}
                  </p>
                </div>
                <div className="w-32 sm:w-48 shrink-0 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 hidden sm:flex">
                    <Users className="h-3 w-3 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-400 leading-none mb-0.5">{lang === "en" ? "Uploaded by" : "అప్‌లోడ్ చేసినవారు"}</p>
                    <p className="text-xs text-zinc-700 truncate font-medium">{upload.user?.name || (lang === "en" ? "Unknown" : "తెలియదు")}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-400">{formatDate(upload.createdAt, lang)}</p>
                </div>
              </div>
            ))
          )}
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
