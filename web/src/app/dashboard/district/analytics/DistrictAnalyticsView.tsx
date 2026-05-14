"use client";
import { useState, useMemo } from "react";
import { useLang, T } from "@/lib/i18n";
import type { DistrictAnalytics } from "@/lib/analytics-types";
import { cn } from "@/lib/utils";
import {
  BarChart2, TrendingUp, TrendingDown, School, Map as MapIcon,
  Activity, Brain, Layers,
} from "lucide-react";
import DistrictOverview from "@/components/analytics/DistrictOverview";
import SchoolComparisonPanel from "@/components/analytics/SchoolComparisonPanel";
import MandalComparisonPanel from "@/components/analytics/MandalComparisonPanel";
import MandalDrilldownSection from "@/components/analytics/MandalDrilldownSection";
import SchoolDrilldownSection from "@/components/analytics/SchoolDrilldownSection";
import AdvancedInsightsSection from "@/components/analytics/AdvancedInsightsSection";

const TABS = [
  { id: "overview", icon: BarChart2 },
  { id: "schools", icon: School },
  { id: "mandals", icon: MapIcon },
  { id: "drilldown", icon: Layers },
  { id: "insights", icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DistrictAnalyticsView({ data }: { data: DistrictAnalytics }) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const safe = useMemo(() => ({
    ...data,
    overview: data.overview ?? { totalSchools: 0, totalStudents: 0, totalFlagged: 0, atRiskPercent: 0, avgRisk: 0, avgAttendance: 0, criticalSchools: 0, highRiskSchools: 0 },
    interventionStats: data.interventionStats ?? { initiated: 0, completed: 0, in_progress: 0, total: 0, completionRate: 0 },
    tierDistribution: data.tierDistribution ?? [],
    genderDistribution: data.genderDistribution ?? [],
    topDrivers: data.topDrivers ?? [],
    incomeCorrelation: data.incomeCorrelation ?? [],
    attendanceCorrelation: data.attendanceCorrelation ?? [],
    gradeDistribution: data.gradeDistribution ?? [],
    mandals: data.mandals ?? [],
    schools: data.schools ?? [],
    topAreas: data.topAreas ?? [],
    trends: data.trends ?? [],
  }), [data]);

  const tabLabels: Record<TabId, string> = {
    overview: lang === "en" ? "Overview" : "అవలోకనం",
    schools: lang === "en" ? "School Comparison" : "పాఠశాల పోలిక",
    mandals: lang === "en" ? "Mandal Comparison" : "మండల పోలిక",
    drilldown: lang === "en" ? "Drill-Down" : "డ్రిల్-డౌన్",
    insights: lang === "en" ? "Predictive Insights" : "అంచనా అంతర్దృష్టులు",
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-[color:var(--ap-navy)]" />
            {lang === "en" ? "District Analytics" : "జిల్లా విశ్లేషణలు"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {lang === "en"
              ? `${safe.districtName} District · ${safe.overview.totalSchools} schools · ${safe.overview.totalStudents.toLocaleString("en-IN")} students · AY 2024-25`
              : `${safe.districtName} జిల్లా · ${safe.overview.totalSchools} పాఠశాలలు · ${safe.overview.totalStudents.toLocaleString("en-IN")} విద్యార్థులు`}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  activeTab === t.id
                    ? "bg-white shadow-sm text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tabLabels[t.id]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-[color:var(--ap-navy)] p-4 md:p-5 text-white flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="shrink-0 p-2 bg-white/10 rounded-lg border border-white/20">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold">
            {lang === "en" ? "Predictive Alert" : "అంచనా హెచ్చరిక"}
          </span>
          <p className="text-xs text-zinc-300 mt-0.5">
            {lang === "en"
              ? `Model projects increased risk in ${safe.mandals.slice(0, 2).map(m => m.name).join(", ")}. Early intervention recommended for ${safe.topAreas[0]?.name ?? "high-risk"} areas.`
              : `${safe.mandals.slice(0, 2).map(m => m.name).join(", ")} లో ప్రమాదం పెరుగుతుందని మోడల్ అంచనా వేస్తుంది. ముందస్తు జోక్యం సిఫార్సు చేయబడింది.`}
          </p>
        </div>
      </div>

      {activeTab === "overview" && <DistrictOverview data={safe} />}
      {activeTab === "schools" && <SchoolComparisonPanel schools={safe.schools} />}
      {activeTab === "mandals" && <MandalComparisonPanel mandals={safe.mandals} />}
      {activeTab === "drilldown" && (
        <div className="space-y-4">
          <MandalDrilldownSection mandals={safe.mandals} schools={safe.schools} />
          <SchoolDrilldownSection schools={safe.schools} />
        </div>
      )}
      {activeTab === "insights" && <AdvancedInsightsSection data={safe} />}
    </div>
  );
}
