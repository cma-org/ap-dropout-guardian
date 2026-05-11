"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import type { RosterStudent, RiskTier } from "@/lib/types";
import { useLang, T } from "@/lib/i18n";
import InfoTooltip from "./InfoTooltip";
import { TrendingUp, AlertTriangle, Activity, BookOpen } from "lucide-react";

const TIER_COLOR: Record<RiskTier, string> = {
  Critical: "#dc2626",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#16a34a",
};

function bucket<T extends string>(
  items: number[],
  buckets: { label: T; min: number; max: number }[]
): { label: T; count: number }[] {
  return buckets.map(({ label, min, max }) => ({
    label,
    count: items.filter((v) => v >= min && v < max).length,
  }));
}

function SectionTitle({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2 flex items-center gap-1">
      <span className="flex-1">{children}</span>
      {info && <InfoTooltip text={info} />}
    </div>
  );
}

export default function StudentAnalyticsPanel({ roster }: { roster: RosterStudent[] }) {
  const { lang } = useLang();
  if (!roster.length) return null;

  // ── Computed stats ────────────────────────────────────────────────────────
  const faScores = roster.map((r) => r.fa_avg).filter((v): v is number => v !== null);
  const highConfidence = roster.filter((r) => r.risk_score >= 0.65).length;
  const interventionWindow = roster.filter((r) => r.tier === "Medium").length;
  const attRisk = roster.filter((r) => r.attendance_rate < 0.60).length;
  const marksRisk = faScores.filter((v) => v < 25).length;
  const avgRiskPct = Math.round(roster.reduce((s, r) => s + r.risk_score, 0) / roster.length * 100);
  const flaggedRate = Math.round(roster.filter(r => r.tier !== "Low").length / roster.length * 100);

  // ── Attendance distribution ───────────────────────────────────────────────
  const attBuckets = bucket(
    roster.map((r) => r.attendance_rate * 100),
    [
      { label: "< 50%", min: 0, max: 50 },
      { label: "50–75%", min: 50, max: 75 },
      { label: "75–90%", min: 75, max: 90 },
      { label: "> 90%", min: 90, max: 101 },
    ]
  );

  // ── FA marks distribution ─────────────────────────────────────────────────
  const faBuckets = bucket(faScores, [
    { label: "< 25", min: 0, max: 25 },
    { label: "25–50", min: 25, max: 50 },
    { label: "50–75", min: 50, max: 75 },
    { label: "75–100", min: 75, max: 101 },
  ]);
  const noMarks = roster.length - faScores.length;

  // ── Gender split ──────────────────────────────────────────────────────────
  const genderData = ["Female", "Male"].map((g) => {
    const grp = roster.filter((r) => r.gender_label === g);
    const flagged = grp.filter((r) => r.tier !== "Low").length;
    return { gender: g, total: grp.length, flagged, safe: grp.length - flagged };
  });

  // ── Risk tier donut ───────────────────────────────────────────────────────
  const tierData = (["Critical", "High", "Medium", "Low"] as RiskTier[]).map((t) => ({
    name: t,
    value: roster.filter((r) => r.tier === t).length,
    color: TIER_COLOR[t],
  })).filter((d) => d.value > 0);

  // ── Risk score distribution ───────────────────────────────────────────────
  const riskBuckets = bucket(
    roster.map((r) => r.risk_score * 100),
    [
      { label: "0–25", min: 0, max: 25 },
      { label: "25–50", min: 25, max: 50 },
      { label: "50–65", min: 50, max: 65 },
      { label: "65–85", min: 65, max: 85 },
      { label: "85–100", min: 85, max: 101 },
    ]
  );
  const riskColors = ["#16a34a", "#84cc16", "#eab308", "#f97316", "#dc2626"];

  return (
    <div className="rounded-xl border bg-white p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-800">{T.analytics.title[lang]}</div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {lang === "en"
              ? `XGBoost model · ${roster.length} students · operating threshold p ≥ 0.51`
              : `XGBoost మోడల్ · ${roster.length} విద్యార్థులు · నిర్వహణ థ్రెషోల్డ్ p ≥ 0.51`}
          </div>
        </div>
        <div className="text-xs font-mono bg-[color:var(--ap-navy)] text-white rounded px-2.5 py-1">
          {lang === "en" ? `${flaggedRate}% flagged` : `${flaggedRate}% గుర్తించారు`}
        </div>
      </div>

      {/* KPI stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: <TrendingUp className="h-4 w-4 text-red-500" />,
            label: T.analytics.kpi_highRisk[lang],
            value: highConfidence,
            sub: T.analytics.kpi_highRiskSub[lang],
            color: "border-red-200 bg-red-50/40",
            valueColor: "text-red-700",
          },
          {
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            label: T.analytics.kpi_opportunity[lang],
            value: interventionWindow,
            sub: T.analytics.kpi_opportunitySub[lang],
            color: "border-amber-200 bg-amber-50/40",
            valueColor: "text-amber-700",
          },
          {
            icon: <Activity className="h-4 w-4 text-orange-500" />,
            label: T.analytics.kpi_attRisk[lang],
            value: attRisk,
            sub: T.analytics.kpi_attRiskSub[lang],
            color: "border-orange-200 bg-orange-50/40",
            valueColor: "text-orange-700",
          },
          {
            icon: <BookOpen className="h-4 w-4 text-purple-500" />,
            label: T.analytics.kpi_marksRisk[lang],
            value: marksRisk,
            sub: T.analytics.kpi_marksRiskSub[lang],
            color: "border-purple-200 bg-purple-50/40",
            valueColor: "text-purple-700",
          },
        ].map((k) => (
          <div key={k.label} className={`rounded-lg border px-3 py-2.5 ${k.color}`}>
            <div className="flex items-center gap-1.5 mb-1">
              {k.icon}
              <div className="text-[11px] font-medium text-zinc-600 leading-tight">{k.label}</div>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${k.valueColor}`}>{k.value}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Attendance risk patterns */}
        <div>
          <SectionTitle info="Daily attendance rate = days present ÷ total school days. Below 50% is the strongest single predictor of dropout — 3× higher probability. The ML model weights this as the top feature.">
            {T.analytics.attendance[lang]}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={attBuckets} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => [`${Number(v ?? 0)} students`]} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {attBuckets.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#dc2626" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {attBuckets[0].count} {T.analytics.highestRisk[lang]}
          </p>
        </div>

        {/* Academic performance predictor */}
        <div>
          <SectionTitle info="Formative Assessment average across subjects. Students scoring <25 are at significantly higher dropout risk. Missing records (null FA) are also a dropout signal — indicate disengagement from assessments.">
            {T.analytics.marks[lang]}{noMarks > 0 && <span className="text-zinc-400 normal-case font-normal ml-1">({noMarks} {T.analytics.noData[lang]})</span>}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={faBuckets} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => [`${Number(v ?? 0)} students`]} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {faBuckets.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#dc2626" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {faBuckets[0].count + faBuckets[1].count} {T.analytics.below50Marks[lang]}
          </p>
        </div>

        {/* ML dropout probability distribution */}
        <div>
          <SectionTitle info="XGBoost-predicted dropout probability (0–100%). Operating threshold at p=0.51. The distribution shape shows how well the model separates the cohort — a bimodal curve indicates strong signal.">
            {T.analytics.riskDist[lang]}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={riskBuckets} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => [`${Number(v ?? 0)} students`]} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {riskBuckets.map((_, i) => (
                  <Cell key={i} fill={riskColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {riskBuckets[4].count} {T.analytics.criticalBand[lang]}
          </p>
        </div>

        {/* Equity risk analysis */}
        <div>
          <SectionTitle info="Model-flagged count per gender. Disproportionate flagging of girls may indicate distance barriers, early marriage risk, or KGBV eligibility gaps. Disproportionate flagging of boys may signal labour migration or economic stress.">
            {T.analytics.gender[lang]}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={genderData} barSize={32}>
              <XAxis dataKey="gender" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="flagged" name={T.analytics.atRisk[lang]} stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="safe" name={T.analytics.lowRisk[lang]} stackId="a" fill="#d1fae5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {T.analytics.girlsFlagged[lang]}: {genderData.find(g => g.gender === "Female")?.flagged ?? 0} &nbsp;·&nbsp;
            {T.analytics.boysFlagged[lang]}: {genderData.find(g => g.gender === "Male")?.flagged ?? 0}
          </p>
        </div>

        {/* Predictive risk classification */}
        <div>
          <SectionTitle info="Tier boundaries: Critical p≥0.85, High p=0.65–0.85, Medium p=0.51–0.65, Low p<0.51. Critical <5% of roster is the target. If higher, escalate to Head Master for systemic review.">
            {T.analytics.tierBreak[lang]}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={tierData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {tierData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${Number(v ?? 0)} students`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cohort risk indicators */}
        <div className="flex flex-col justify-center gap-3">
          <SectionTitle info="Cohort-level ML output summary. Mean risk score >30% signals a systemic school-level issue — investigate teacher vacancies, infrastructure, or seasonal migration in the mandal.">
            {T.analytics.quickStats[lang]}
          </SectionTitle>
          {[
            { label: T.analytics.avgAtt[lang], value: `${Math.round(roster.reduce((s, r) => s + r.attendance_rate, 0) / roster.length * 100)}%` },
            { label: T.analytics.avgMarks[lang], value: faScores.length ? `${(faScores.reduce((a, b) => a + b, 0) / faScores.length).toFixed(1)}` : "—" },
            { label: T.analytics.avgRisk[lang], value: `${avgRiskPct}%` },
            { label: T.analytics.female[lang], value: `${genderData.find(g => g.gender === "Female")?.total ?? 0}` },
            { label: T.analytics.atRiskRate[lang], value: `${flaggedRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm border-b border-zinc-100 pb-1 last:border-0 last:pb-0">
              <span className="text-zinc-500 text-xs">{label}</span>
              <span className="font-semibold text-zinc-900 tabular-nums text-sm">{value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
