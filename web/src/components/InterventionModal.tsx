"use client";
import { useState } from "react";
import { CheckCircle2, X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, T } from "@/lib/i18n";

export type InterventionStatus = "pending" | "in_progress" | "completed";

export interface Intervention {
  child_sno: number;
  action_type: string;
  status: InterventionStatus;
  assigned_to: string;
  notes: string;
  at: string;
  completed_at?: string;
}

const ACTION_TYPES = [
  "Home visit",
  "Parent meeting",
  "Counselling session",
  "Academic support",
  "Financial aid referral",
  "Transport support",
  "Scheme enrollment (Amma Vodi / Post-Matric Scholarship RTF+MTF / NTR Vidyonnathi)",
  "Other",
];

const STATUS_LABELS: Record<InterventionStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<InterventionStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

function loadInterventions(): Intervention[] {
  try {
    return JSON.parse(localStorage.getItem("interventions") ?? "[]");
  } catch { return []; }
}

function saveInterventions(list: Intervention[]) {
  localStorage.setItem("interventions", JSON.stringify(list));
}

export function getInterventionsForStudent(child_sno: number): Intervention[] {
  return loadInterventions().filter((i) => i.child_sno === child_sno);
}

export function isInterventionLogged(child_sno: number): boolean {
  return loadInterventions().some((i) => i.child_sno === child_sno);
}

export default function InterventionModal({
  child_sno,
  onClose,
  onSaved,
}: {
  child_sno: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useLang();
  const existing = getInterventionsForStudent(child_sno);

  const [actionType, setActionType] = useState(ACTION_TYPES[0]);
  const [status, setStatus] = useState<InterventionStatus>("pending");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const all = loadInterventions();
    const entry: Intervention = {
      child_sno,
      action_type: actionType,
      status,
      assigned_to: assignedTo,
      notes,
      at: new Date().toISOString(),
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    };
    all.push(entry);
    saveInterventions(all);
    setSaved(true);
    setTimeout(() => { onSaved(); onClose(); }, 800);
  };

  const updateStatus = (index: number, newStatus: InterventionStatus) => {
    const all = loadInterventions();
    const target = all.filter((i) => i.child_sno === child_sno)[index];
    if (!target) return;
    const globalIdx = all.indexOf(target);
    all[globalIdx] = {
      ...all[globalIdx],
      status: newStatus,
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
    };
    saveInterventions(all);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[color:var(--ap-navy)]" />
            {T.interventions.logTitle[lang].replace("{id}", child_sno.toString())}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing interventions */}
        {existing.length > 0 && (
          <div className="px-6 py-4 border-b border-zinc-100 space-y-2">
            <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">{T.interventions.prevIv[lang]}</div>
            {existing.map((iv, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-800">
                    {(T.interventions.types as any)[iv.action_type]?.[lang] || iv.action_type}
                  </div>
                  {iv.notes && <div className="text-xs text-zinc-500 mt-0.5 truncate">{iv.notes}</div>}
                  <div className="text-[10px] text-zinc-400 mt-1">{new Date(iv.at).toLocaleString(lang === "en" ? "en-US" : "te-IN")}</div>
                </div>
                <select
                  defaultValue={iv.status}
                  onChange={(e) => updateStatus(i, e.target.value as InterventionStatus)}
                  className={cn("text-xs rounded border px-2 py-1 font-medium shrink-0", STATUS_COLORS[iv.status])}
                >
                  {Object.entries(T.interventions.statuses).map(([v, l]) => (
                    <option key={v} value={v}>{(l as any)[lang]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* New intervention form */}
        <div className="px-6 py-4 space-y-4">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">{T.interventions.newIv[lang]}</div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{T.interventions.actionType[lang]}</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {(T.interventions.types as any)[t]?.[lang] || t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{T.interventions.status[lang]}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InterventionStatus)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]"
              >
                {Object.entries(T.interventions.statuses).map(([v, l]) => (
                  <option key={v} value={v}>{(l as any)[lang]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{T.interventions.assignedTo[lang]}</label>
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder={T.interventions.placeholderAssign[lang]}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{T.interventions.notes[lang]}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={T.interventions.placeholderNotes[lang]}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saved}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition",
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[color:var(--ap-navy)] text-white hover:opacity-90"
              )}
            >
              {saved ? <><CheckCircle2 className="h-4 w-4" /> {T.common.saved[lang]}</> : T.interventions.saveIv[lang]}
            </button>
            <button
              onClick={onClose}
              className="px-4 rounded-lg border border-zinc-300 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              {T.common.cancel[lang]}
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 text-center">
            {T.interventions.feedbackNote[lang]}
          </p>
        </div>
      </div>
    </div>
  );
}
