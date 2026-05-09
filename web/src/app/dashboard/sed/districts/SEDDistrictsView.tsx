"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { School } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  Search, ChevronDown, ChevronUp, Building2, Users,
  AlertCircle, ChevronRight, Map as MapIcon,
} from "lucide-react";

interface DistrictStats {
  name: string;
  nSchools: number;
  nStudents: number;
  nFlagged: number;
  avgRisk: number;
  nCritical: number;
}

function buildDistrictStats(schools: School[]): DistrictStats[] {
  const map = new Map<string, School[]>();
  for (const s of schools) {
    const d = s.district_name ?? "Unknown";
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(s);
  }
  const stats: DistrictStats[] = [];
  for (const [name, list] of map.entries()) {
    stats.push({
      name,
      nSchools: list.length,
      nStudents: list.reduce((a, s) => a + s.n_students, 0),
      nFlagged:  list.reduce((a, s) => a + s.n_flagged, 0),
      avgRisk:   list.length > 0 ? list.reduce((a, s) => a + s.avg_risk, 0) / list.length : 0,
      nCritical: list.filter(s => s.pct_critical > 0.05).length,
    });
  }
  return stats;
}

type SortKey = "name" | "nSchools" | "nStudents" | "nFlagged" | "avgRisk" | "nCritical";

function riskColor(r: number) {
  if (r > 0.15) return "text-red-600";
  if (r > 0.08) return "text-orange-500";
  if (r > 0.04) return "text-amber-500";
  return "text-emerald-600";
}

export default function SEDDistrictsView({ schools }: { schools: School[] }) {
  const { lang } = useLang();
  const [search, setSearch]   = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nFlagged");
  const [sortAsc, setSortAsc] = useState(false);

  const districts = useMemo(() => buildDistrictStats(schools), [schools]);
  const maxFlagged = useMemo(() => Math.max(...districts.map(d => d.nFlagged), 1), [districts]);

  const filtered = useMemo(() => {
    let list = search
      ? districts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
      : districts;
    return [...list].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [districts, search, sortKey, sortAsc]);

  const totals = useMemo(() => ({
    districts: districts.length,
    schools:   districts.reduce((a, d) => a + d.nSchools, 0),
    students:  districts.reduce((a, d) => a + d.nStudents, 0),
    flagged:   districts.reduce((a, d) => a + d.nFlagged, 0),
  }), [districts]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  }

  const cols: [SortKey, string][] = [
    ["name",      lang === "en" ? "District"        : "జిల్లా"],
    ["nSchools",  lang === "en" ? "Schools"         : "పాఠశాలలు"],
    ["nStudents", lang === "en" ? "Students"        : "విద్యార్థులు"],
    ["nFlagged",  lang === "en" ? "Flagged at-risk" : "ప్రమాదంలో"],
    ["avgRisk",   lang === "en" ? "Avg Risk"        : "సగటు ప్రమాదం"],
    ["nCritical", lang === "en" ? "Critical Schools": "క్రిటికల్ పాఠశాలలు"],
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <MapIcon className="h-6 w-6 text-[color:var(--ap-navy)]" />
            {lang === "en" ? "Districts" : "జిల్లాలు"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {lang === "en"
              ? "Andhra Pradesh · state-wide district risk overview — click a row to drill into schools."
              : "ఆంధ్ర ప్రదేశ్ · రాష్ట్రవ్యాప్త జిల్లా ప్రమాద సమీక్ష — పాఠశాలల వివరాల కోసం వరుసపై క్లిక్ చేయండి."}
          </p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: lang === "en" ? "Total Districts" : "మొత్తం జిల్లాలు",
            value: totals.districts,
            icon: <MapIcon className="h-5 w-5 text-zinc-400" />,
          },
          {
            label: lang === "en" ? "Total Schools" : "మొత్తం పాఠశాలలు",
            value: totals.schools,
            icon: <Building2 className="h-5 w-5 text-zinc-400" />,
          },
          {
            label: lang === "en" ? "Students Monitored" : "పర్యవేక్షించిన విద్యార్థులు",
            value: totals.students,
            icon: <Users className="h-5 w-5 text-zinc-400" />,
          },
          {
            label: lang === "en" ? "Flagged At-Risk" : "ప్రమాదంలో ఉన్నవారు",
            value: totals.flagged,
            icon: <AlertCircle className="h-5 w-5 text-red-400" />,
            red: true,
          },
        ].map(c => (
          <div key={c.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className={cn(
              "text-[10px] font-bold uppercase tracking-wider mb-1",
              c.red ? "text-red-400" : "text-zinc-400"
            )}>
              {c.label}
            </div>
            <div className={cn(
              "text-2xl font-bold flex items-center gap-2",
              c.red ? "text-red-600" : "text-zinc-900"
            )}>
              {c.icon}
              {fmtInt(c.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Districts table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search district…" : "జిల్లా వెతకండి…"}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/20"
              suppressHydrationWarning
            />
          </div>
          <span className="text-xs text-zinc-400 ml-auto">
            {filtered.length} {lang === "en" ? "districts" : "జిల్లాలు"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                {cols.map(([k, label]) => (
                  <th
                    key={k}
                    className="px-5 py-3 cursor-pointer hover:text-zinc-800 select-none whitespace-nowrap"
                    onClick={() => toggleSort(k)}
                  >
                    {label}<SortIcon k={k} />
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(d => (
                <tr key={d.name} className="hover:bg-zinc-50/70 transition-colors group">
                  <td className="px-5 py-3.5 font-semibold text-zinc-900 whitespace-nowrap">
                    {d.name}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-zinc-600">
                    {fmtInt(d.nSchools)}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-zinc-600">
                    {fmtInt(d.nStudents)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-semibold text-red-600 w-10 shrink-0">
                        {fmtInt(d.nFlagged)}
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${Math.min(100, (d.nFlagged / maxFlagged) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {d.nStudents > 0 ? pctFormat(d.nFlagged / d.nStudents, 1) : "—"}
                      </span>
                    </div>
                  </td>
                  <td className={cn("px-5 py-3.5 tabular-nums font-semibold", riskColor(d.avgRisk))}>
                    {pctFormat(d.avgRisk, 1)}
                  </td>
                  <td className="px-5 py-3.5">
                    {d.nCritical > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        {d.nCritical}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/sed/districts/${encodeURIComponent(d.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ap-navy)] hover:underline whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {lang === "en" ? "View schools" : "పాఠశాలలు"} <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-sm">
                    {lang === "en" ? "No districts match your search." : "జిల్లాలు కనుగొనబడలేదు."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
