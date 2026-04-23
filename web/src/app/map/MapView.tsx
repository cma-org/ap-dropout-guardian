"use client";
import dynamic from "next/dynamic";
import type { School, Mandal } from "@/lib/types";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat } from "@/lib/utils";

const SchoolMap = dynamic(() => import("./SchoolMap"), { ssr: false, loading: () => <div className="text-sm text-zinc-500 p-8">Loading map…</div> });

export default function MapView({ schools, topMandals }: { schools: School[]; topMandals: Mandal[] }) {
  const { lang } = useLang();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{T.map.title[lang]}</h1>
        <p className="text-sm text-zinc-600 mt-1">{T.map.hint[lang]}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ height: "640px" }}>
          <SchoolMap schools={schools} />
        </div>
        <aside className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">{T.map.topMandals[lang]}</h2>
          <ol className="space-y-2">
            {topMandals.map((m, i) => (
              <li key={i} className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-50">
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
