"use client";
import { useState } from "react";
import { Zap, CheckCircle2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import type { StudentDetail } from "@/lib/types";

function buildPayload(student: StudentDetail) {
  return {
    api_version: "v1",
    event: "student_risk_flag",
    timestamp: new Date().toISOString(),
    source: "ap_dropout_guardian",
    student: {
      child_sno: student.child_sno,
      school_id: student.school_id,
      school_name: student.school_name,
      district: student.district_name,
      mandal: student.mandal_name,
      gender: student.gender_label,
      risk_score: student.risk_score.toFixed(4),
      risk_tier: student.tier,
      top_risk_drivers: student.drivers.slice(0, 3).map((d) => ({
        factor: d.label_en,
        contribution: d.contrib.toFixed(3),
        detail: d.sentence_en,
      })),
    },
    recommended_actions: [
      "Schedule home visit within 48 hours",
      "Assign community volunteer for parent engagement",
      "Review scheme eligibility (Amma Vodi / Post-Matric Scholarship RTF+MTF / NTR Vidyonnathi)",
    ],
    callback_url: "https://ap-dropout-guardian.gov.in/api/leap/outcome",
  };
}

export default function LEAPApiPanel({ student }: { student: StudentDetail }) {
  const { lang } = useLang();
  const [pushed, setPushed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const payload = buildPayload(student);
  const payloadStr = JSON.stringify(payload, null, 2);

  const handlePush = () => {
    setPushed(true);
    // In production: POST to LEAP API endpoint
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          {lang === "en" ? "LEAP API Integration" : "LEAP API ఏకీకరణ"}
        </h2>
        <span className="text-[10px] uppercase tracking-wide bg-amber-50 border border-amber-200 text-amber-700 rounded px-2 py-0.5 font-medium">
          {lang === "en" ? "Mock — demo mode" : "మాక్ — డెమో మోడ్"}
        </span>
      </div>

      <p className="text-sm text-zinc-600 leading-relaxed">
        {lang === "en"
          ? "In production, this payload is pushed to the LEAP app via REST API when a student is flagged or an intervention is logged. Field officers receive a task in LEAP; outcomes sync back for model retraining."
          : "ప్రొడక్షన్‌లో, విద్యార్థి గుర్తించబడినప్పుడు లేదా జోక్యం నమోదైనప్పుడు ఈ పేలోడ్ LEAP యాప్‌కు REST API ద్వారా పంపబడుతుంది."}
      </p>

      {/* Payload preview */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <span className="text-xs text-zinc-400 font-mono">POST /api/leap/v1/flag-student</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
        <pre className={cn(
          "text-xs text-emerald-300 p-4 overflow-auto transition-all",
          expanded ? "max-h-[400px]" : "max-h-[160px]"
        )}>
          {payloadStr}
        </pre>
      </div>

      {/* Push status */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>Endpoint: <span className="text-zinc-700 font-mono">leap.ap.gov.in/api/v1</span></span>
          <span>Auth: <span className="text-zinc-700">Bearer token (not configured)</span></span>
        </div>
        <button
          onClick={handlePush}
          disabled={pushed}
          className={cn(
            "ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
            pushed
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-[color:var(--ap-navy)] text-white hover:opacity-90"
          )}
        >
          {pushed ? (
            <><CheckCircle2 className="h-4 w-4" /> {lang === "en" ? "Pushed to LEAP ✓" : "LEAP కి పంపబడింది ✓"}</>
          ) : (
            <><Zap className="h-4 w-4" /> {lang === "en" ? "Push to LEAP (mock)" : "LEAP కి పంపు (మాక్)"}</>
          )}
        </button>
      </div>

      {pushed && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="font-semibold">Mock response 200 OK:</span>{" "}
          {lang === "en"
            ? "Task created in LEAP for field officer. Outcome webhook registered at callback URL."
            : "LEAP లో ఫీల్డ్ ఆఫీసర్ కోసం టాస్క్ సృష్టించబడింది. ఫలితం వెబ్‌హుక్ రిజిస్టర్ చేయబడింది."}
        </div>
      )}
    </section>
  );
}
