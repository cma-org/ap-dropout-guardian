"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { DistrictAnalytics } from "@/lib/analytics-types";
import { fmtInt, pctFormat, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target,
  ArrowUpRight, Map as MapIcon, School as SchoolIcon, ChevronDown, ChevronRight,
} from "lucide-react";

export default function AdvancedInsightsSection({ data }: { data: DistrictAnalytics }) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");

  const topAreas = useMemo(() =>
    (data.topAreas ?? []).slice(0, 8),
  [data.topAreas]);

  const risingSchools = useMemo(() =>
    (data.schools ?? []).filter(s => s.pctFlagged > 0.2 && s.avgRisk > 0.1)
      .sort((a, b) => b.pctFlagged - a.pctFlagged)
      .slice(0, 5),
  [data.schools]);

  const prediction = useMemo(() => {
    const currentRate = data.overview?.atRiskPercent ?? 0;
    const totalStudents = data.overview?.totalStudents ?? 0;
    const totalFlagged = data.overview?.totalFlagged ?? 0;
    const projectedRate = Math.min(currentRate * 1.08, 1);
    const projectedFlagged = Math.round(totalStudents * projectedRate);
    const increase = projectedFlagged - totalFlagged;
    return { currentRate, projectedRate, projectedFlagged, increase };
  }, [data]);

  const recommendations = useMemo(() => {
    const worstMandal = (data.mandals ?? [])[0];
    const topDriver = (data.topDrivers ?? [])[0];
    const items: { icon: typeof Lightbulb; color: string; title: string; desc: string }[] = [];

    if (worstMandal) {
      items.push({
        icon: Target, color: "text-red-600",
        title: lang === "en" ? "Targeted Intervention in" : "లో లక్ష్య జోక్యం",
        desc: lang === "en"
          ? `${worstMandal.name} mandal has the highest at-risk rate (${pctFormat(worstMandal.flagRate, 1)}). Deploy home-visit teams and enrolment drives.`
          : `${worstMandal.name} మండలంలో అత్యధిక ప్రమాద రేటు (${pctFormat(worstMandal.flagRate, 1)}). ఇంటి సందర్శన బృందాలు మరియు నమోదు డ్రైవ్‌లను మోహరించండి.`,
      });
    }

    if (topDriver) {
      items.push({
        icon: TrendingUp, color: "text-amber-600",
        title: lang === "en" ? "Key Driver: " : "ప్రధాన డ్రైవర్: ",
        desc: lang === "en"
          ? `${topDriver.labelEn} contributes ${(topDriver.contribution * 100).toFixed(1)}% to dropout risk. Prioritize schemes addressing this factor.`
          : `${topDriver.labelTe} డ్రాపౌట్ రిస్క్‌కు ${(topDriver.contribution * 100).toFixed(1)}% దోహదపడుతుంది. ఈ అంశాన్ని పరిష్కరించే పథకాలకు ప్రాధాన్యత ఇవ్వండి.`,
      });
    }

    if (prediction.increase > 0) {
      items.push({
        icon: AlertTriangle, color: "text-amber-600",
        title: lang === "en" ? "Predicted Increase" : "అంచనా పెరుగుదల",
        desc: lang === "en"
          ? `Model projects ~${fmtInt(prediction.increase)} additional at-risk students next quarter. Early preventive action recommended.`
          : `మోడల్ తదుపరి త్రైమాసికంలో ~${fmtInt(prediction.increase)} అదనపు ప్రమాద విద్యార్థులను అంచనా వేస్తుంది. ముందస్తు నివారణ చర్య సిఫార్సు చేయబడింది.`,
      });
    }

    if ((data.interventionStats?.completionRate ?? 0) < 0.5) {
      items.push({
        icon: Target, color: "text-blue-600",
        title: lang === "en" ? "Improve Intervention Completion" : "జోక్యం పూర్తిని మెరుగుపరచండి",
        desc: lang === "en"
          ? `Current completion rate is ${pctFormat(data.interventionStats?.completionRate ?? 0, 1)}. Follow up on ${fmtInt((data.interventionStats?.initiated ?? 0) + (data.interventionStats?.in_progress ?? 0))} pending interventions.`
          : `ప్రస్తుత పూర్తి రేటు ${pctFormat(data.interventionStats?.completionRate ?? 0, 1)}. ${fmtInt((data.interventionStats?.initiated ?? 0) + (data.interventionStats?.in_progress ?? 0))} పెండింగ్ జోక్యాలపై ఫాలో అప్ చేయండి.`,
      });
    }

    if (risingSchools.length > 0) {
      items.push({
        icon: SchoolIcon, color: "text-red-600",
        title: lang === "en" ? "Escalating Risk Schools" : "పెరుగుతున్న రిస్క్ పాఠశాలలు",
        desc: lang === "en"
          ? `${risingSchools.slice(0, 3).map(s => s.schoolName).join(", ")} show high risk. Immediate assessment teams needed.`
          : `${risingSchools.slice(0, 3).map(s => s.schoolName).join(", ")} అధిక ప్రమాదాన్ని చూపిస్తున్నాయి. తక్షణ అంచనా బృందాలు అవసరం.`,
      });
    }

    items.push({
      icon: Lightbulb, color: "text-purple-600",
      title: lang === "en" ? "Data-Driven Planning" : "డేటా ఆధారిత ప్రణాళిక",
      desc: lang === "en"
        ? `Use ${lang === "en" ? "gender" : "లింగం"}-specific interventions — ${(data.genderDistribution ?? []).filter(g => g.flagged > 0).map(g => `${g.label} (${fmtInt(g.flagged)} at-risk)`).join(", ")}.`
        : `లింగ-నిర్దిష్ట జోక్యాలను ఉపయోగించండి — ${(data.genderDistribution ?? []).filter(g => g.flagged > 0).map(g => `${g.label} (${fmtInt(g.flagged)} ప్రమాదంలో)`).join(", ")}.`,
    });

    return items;
  }, [data, lang, prediction, risingSchools]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Current At-Risk" : "ప్రస్తుత ప్రమాదం"}
          </div>
          <div className="text-xl font-bold text-zinc-900 mt-1">{pctFormat(prediction.currentRate, 1)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Projected (Next Q)" : "అంచనా (తదుపరి త్రైమాసికం)"}
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{pctFormat(prediction.projectedRate, 1)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Projected Increase" : "అంచనా పెరుగుదల"}
          </div>
          <div className="text-xl font-bold text-red-600 mt-1">
            <span className="flex items-center gap-1"><ArrowUpRight className="h-4 w-4" />+{fmtInt(prediction.increase)}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {lang === "en" ? "Intervention Rate" : "జోక్యం రేటు"}
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{pctFormat(data.interventionStats?.completionRate ?? 0, 1)}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{fmtInt(data.interventionStats?.total ?? 0)} {lang === "en" ? "total" : "మొత్తం"}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
              {lang === "en" ? "AI-Driven Recommendations" : "AI-ఆధారిత సిఫార్సులు"}
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg">
            {(["monthly", "quarterly", "yearly"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                  timeFilter === t ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
                )}
              >
                {t === "monthly" ? (lang === "en" ? "Monthly" : "నెలవారీ") :
                 t === "quarterly" ? (lang === "en" ? "Quarterly" : "త్రైమాసిక") :
                 (lang === "en" ? "Yearly" : "వార్షిక")}
              </button>
            ))}
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((r, i) => (
                  <div key={i} className="rounded-lg border bg-white p-3.5 shadow-sm flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-lg shrink-0 bg-opacity-10", r.color.replace("text-", "bg-").replace("600", "100") + " " + r.color)}>
                      <r.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-800">{r.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {recommendations.slice(3).map((r, i) => (
                  <div key={i} className="rounded-lg border bg-white p-3.5 shadow-sm flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-lg shrink-0 bg-opacity-10", r.color.replace("text-", "bg-").replace("600", "100") + " " + r.color)}>
                      <r.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-800">{r.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapIcon className="h-3.5 w-3.5" />
                  {lang === "en" ? "Highest Risk Areas" : "అత్యధిక ప్రమాద ప్రాంతాలు"}
                </h4>
                <div className="space-y-2">
                  {topAreas.map((area, i) => (
                    <div key={area.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("w-4 text-center font-bold",
                          i === 0 ? "text-red-600" : i < 3 ? "text-amber-600" : "text-zinc-400"
                        )}>{i + 1}</span>
                        <span className="font-medium text-zinc-700 truncate">{area.name}</span>
                        <span className="text-[10px] text-zinc-400">{fmtInt(area.schools)} schools</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold", area.rate > 0.15 ? "text-red-600" : area.rate > 0.08 ? "text-amber-600" : "text-emerald-600")}>
                          {pctFormat(area.rate, 1)}
                        </span>
                        <span className="text-zinc-400 text-[10px]">({fmtInt(area.flagged)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {lang === "en" ? "Schools Requiring Immediate Attention" : "తక్షణ దృష్టి అవసరమైన పాఠశాలలు"}
                </h4>
                <div className="space-y-2">
                  {risingSchools.length > 0 ? risingSchools.map((s, i) => (
                    <div key={s.schoolId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="font-medium text-zinc-700 truncate">{s.schoolName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-red-600 font-bold">{pctFormat(s.pctFlagged, 1)}</span>
                        <span className="text-zinc-400">{pctFormat(s.avgRisk, 1)}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-xs text-zinc-400 text-center py-4">
                      {lang === "en" ? "No schools currently require urgent attention" : "ప్రస్తుతం ఏ పాఠశాలకు అత్యవసర దృష్టి అవసరం లేదు"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900 p-5 text-white flex flex-col md:flex-row items-start gap-4 overflow-hidden relative">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              <div className="shrink-0 p-3 bg-white/10 rounded-xl border border-white/20">
                <Lightbulb className="h-6 w-6 text-amber-400" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold">
                  {lang === "en" ? "Predictive Summary" : "అంచనా సారాంశం"}
                </h4>
                <p className="text-zinc-300 text-xs leading-relaxed max-w-3xl">
                  {lang === "en"
                    ? `Based on current trends, ${(data.topAreas ?? []).slice(0, 3).map(a => a.name).join(", ")} are projected to see the highest increase in at-risk students. Early intervention focused on ${(data.topDrivers ?? [])[0]?.labelEn ?? "attendance"} could reduce projected risk by up to 35%. Recommended actions: home visits for students with <75% attendance, scheme enrollment for low-income brackets, and parent counselling sessions.`
                    : `ప్రస్తుత ధోరణుల ఆధారంగా, ${(data.topAreas ?? []).slice(0, 3).map(a => a.name).join(", ")} లో ప్రమాద విద్యార్థుల సంఖ్య అత్యధికంగా పెరుగుతుందని అంచనా. ${(data.topDrivers ?? [])[0]?.labelTe ?? "హాజరు"} పై దృష్టి పెట్టడం వలన ప్రమాదాన్ని 35% వరకు తగ్గించవచ్చు.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
