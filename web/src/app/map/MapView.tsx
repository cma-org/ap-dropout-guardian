"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { School, Mandal } from "@/lib/types";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import { MapPin, Users, AlertTriangle, X, ExternalLink } from "lucide-react";

const SchoolMap = dynamic(() => import("./SchoolMap"), {
  ssr: false,
  loading: () => <div className="text-sm text-zinc-500 p-8">Loading map…</div>,
});

function riskLabel(avg: number): { label: string; color: string } {
  if (avg >= 0.08) return { label: "Critical", color: "text-red-700 bg-red-50 border-red-200" };
  if (avg >= 0.05) return { label: "High", color: "text-orange-700 bg-orange-50 border-orange-200" };
  if (avg >= 0.03) return { label: "Medium", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
  return { label: "Low", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
}

function SchoolDetailPanel({ school, onClose, lang }: { school: School; onClose: () => void; lang: "en" | "te" }) {
  const { label, color } = riskLabel(school.avg_risk);
  const pct = school.n_students > 0 ? (school.n_flagged / school.n_students) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <MapPin className="h-3 w-3" />
            <span>{school.district_name} · {school.mandal_name}</span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-900 leading-snug">{school.school_name ?? `School #${school.school_id}`}</h2>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 shrink-0 mt-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold w-fit mb-4 ${color}`}>
        <AlertTriangle className="h-3 w-3" />
        {label} risk zone
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border bg-zinc-50 p-3 text-center">
          <div className="text-2xl font-bold text-zinc-900">{fmtInt(school.n_students)}</div>
          <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
            <Users className="h-3 w-3" /> {lang === "en" ? "Enrolled" : "నమోదైన"}
          </div>
        </div>
        <div className="rounded-lg border bg-red-50 p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{fmtInt(school.n_flagged)}</div>
          <div className="text-[11px] text-red-500 flex items-center justify-center gap-1 mt-0.5">
            <AlertTriangle className="h-3 w-3" /> {lang === "en" ? "At-risk" : "ప్రమాదంలో"}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-600">{lang === "en" ? "At-risk rate" : "ప్రమాద రేటు"}</span>
          <span className="font-semibold text-zinc-800">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, pct)}%`,
              backgroundColor: pct >= 8 ? "#dc2626" : pct >= 5 ? "#f97316" : pct >= 3 ? "#eab308" : "#16a34a",
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border p-3 mb-4 bg-white">
        <div className="text-xs text-zinc-500 mb-0.5">{lang === "en" ? "Average dropout probability" : "సగటు డ్రాపౌట్ సంభావ్యత"}</div>
        <div className="text-lg font-bold text-zinc-900">{pctFormat(school.avg_risk, 1)}</div>
        <div className="text-[10px] text-zinc-400">{lang === "en" ? "XGBoost model output, AY 2024-25" : "XGBoost మోడల్, AY 2024-25"}</div>
      </div>

      <Link
        href={`/dashboard/teacher?school=${school.school_id}`}
        className="flex items-center justify-center gap-2 rounded-lg bg-[color:var(--ap-navy)] text-white text-sm font-medium py-2.5 hover:opacity-90 transition mt-auto"
      >
        <ExternalLink className="h-4 w-4" />
        {lang === "en" ? "View student roster" : "విద్యార్థుల జాబితా చూడండి"}
      </Link>
    </div>
  );
}

export default function MapView({ schools, topMandals }: { schools: School[]; topMandals: Mandal[] }) {
  const { lang } = useLang();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [hoveredMandal, setHoveredMandal] = useState<Mandal | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{T.map.title[lang]}</h1>
        <p className="text-sm text-zinc-600 mt-1">{T.map.hint[lang]}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="rounded-xl border bg-white overflow-hidden relative" style={{ height: "640px" }}>
          <SchoolMap schools={schools} onSchoolSelect={setSelectedSchool} />

          {/* Hover overlay card for mandal list */}
          {hoveredMandal && !selectedSchool && (
            <div className="absolute top-4 right-4 z-[1000] w-64 p-4 bg-white rounded-xl shadow-2xl border-2 border-[color:var(--ap-navy)]/20">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Mandal Snapshot</div>
              <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-0.5">{hoveredMandal.mandal_name}</h3>
              <div className="text-xs text-zinc-500 mb-4">{hoveredMandal.district_name} District</div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Total Students</span>
                  <span className="text-sm font-bold text-zinc-900">{fmtInt(hoveredMandal.n_students)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Flagged at-risk</span>
                  <span className="text-sm font-bold text-red-600">{fmtInt(hoveredMandal.n_flagged)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">Average Risk</span>
                    <span className={cn("text-sm font-bold", hoveredMandal.avg_risk > 0.08 ? "text-red-600" : "text-amber-600")}>
                      {pctFormat(hoveredMandal.avg_risk, 1)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", hoveredMandal.avg_risk > 0.08 ? "bg-red-500" : "bg-amber-500")}
                      style={{ width: `${Math.min(100, hoveredMandal.avg_risk * 400)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-xl border bg-white p-4">
          {selectedSchool ? (
            <SchoolDetailPanel
              school={selectedSchool}
              onClose={() => setSelectedSchool(null)}
              lang={lang}
            />
          ) : (
            <>
              <h2 className="text-sm font-semibold text-zinc-800 mb-3">{T.map.topMandals[lang]}</h2>
              <ol className="space-y-2">
                {topMandals.map((m, i) => (
                  <li
                    key={i}
                    onMouseEnter={() => setHoveredMandal(m)}
                    onMouseLeave={() => setHoveredMandal(null)}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md transition-colors cursor-default",
                      hoveredMandal === m ? "bg-blue-50 ring-1 ring-[color:var(--ap-navy)]/10" : "hover:bg-zinc-50"
                    )}
                  >
                    <div className="text-xs text-zinc-400 font-semibold tabular-nums w-5 text-right">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">{m.mandal_name}</div>
                      <div className="text-xs text-zinc-500 truncate">{m.district_name}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">
                        {fmtInt(m.n_flagged)} / {fmtInt(m.n_students)} flagged
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-red-700 tabular-nums">{pctFormat(m.avg_risk, 0)}</div>
                      <div className="text-[10px] text-zinc-500">avg risk</div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-zinc-400 mt-4">{lang === "en" ? "Tap any school dot on the map to see details here." : "వివరాలు చూడటానికి మ్యాప్‌పై పాఠశాల బిందువును నొక్కండి."}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
