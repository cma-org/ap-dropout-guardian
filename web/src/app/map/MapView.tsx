"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { School, Mandal } from "@/lib/types";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat, cn } from "@/lib/utils";

const SchoolMap = dynamic(() => import("./SchoolMap"), { ssr: false, loading: () => <div className="text-sm text-zinc-500 p-8">Loading map…</div> });

export default function MapView({ schools, topMandals }: { schools: School[]; topMandals: Mandal[] }) {
  const { lang } = useLang();
  const [hoveredMandal, setHoveredMandal] = useState<Mandal | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{T.map.title[lang]}</h1>
        <p className="text-sm text-zinc-600 mt-1">{T.map.hint[lang]}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="rounded-xl border bg-white overflow-hidden relative" style={{ height: "640px" }}>
          <SchoolMap schools={schools} />
          
          {/* Overlay Hover Card */}
          {hoveredMandal && (
            <div className="absolute top-4 right-4 z-[1000] w-64 p-4 bg-white rounded-xl shadow-2xl border-2 border-[color:var(--ap-navy)]/20 animate-in fade-in zoom-in-95 duration-200">
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
                    <span className={cn(
                      "text-sm font-bold",
                      hoveredMandal.avg_risk > 0.08 ? "text-red-600" : "text-amber-600"
                    )}>
                      {pctFormat(hoveredMandal.avg_risk, 1)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        hoveredMandal.avg_risk > 0.08 ? "bg-red-500" : "bg-amber-500"
                      )} 
                      style={{ width: `${Math.min(100, hoveredMandal.avg_risk * 400)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <aside className="rounded-xl border bg-white p-4">
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
        </aside>
      </div>
    </div>
  );
}
