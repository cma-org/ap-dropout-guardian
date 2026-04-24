"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import type { RosterStudent, RiskTier } from "@/lib/types";
import { useLang, T } from "@/lib/i18n";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2">
      {children}
    </div>
  );
}

export default function StudentAnalyticsPanel({ roster }: { roster: RosterStudent[] }) {
  const { lang } = useLang();
  if (!roster.length) return null;

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
  const faScores = roster.map((r) => r.fa_avg).filter((v): v is number => v !== null);
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
      <div className="text-sm font-semibold text-zinc-800">{T.analytics.title[lang]}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Attendance distribution */}
        <div>
          <SectionTitle>{T.analytics.attendance[lang]}</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={attBuckets} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v: number) => [`${v} students`]} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {attBuckets.map((d, i) => (
                  <Cell key={i} fill={i === 0 ? "#dc2626" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {attBuckets[0].count} {T.analytics.highestRisk[lang]}
          </p>
        </div>

        {/* FA marks distribution */}
        <div>
          <SectionTitle>{T.analytics.marks[lang]} {noMarks > 0 && <span className="text-zinc-400 normal-case font-normal">({noMarks} {T.analytics.noData[lang]})</span>}</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={faBuckets} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v: number) => [`${v} students`]} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {faBuckets.map((d, i) => (
                  <Cell key={i} fill={i === 0 ? "#dc2626" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {faBuckets[0].count + faBuckets[1].count} {T.analytics.below50Marks[lang]}
          </p>
        </div>

        {/* Risk score distribution */}
        <div>
          <SectionTitle>{T.analytics.riskDist[lang]}</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={riskBuckets} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v: number) => [`${v} students`]} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {riskBuckets.map((d, i) => (
                  <Cell key={i} fill={riskColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-zinc-400 mt-1">
            {riskBuckets[4].count} {T.analytics.criticalBand[lang]}
          </p>
        </div>

        {/* Gender vs flagged */}
        <div>
          <SectionTitle>{T.analytics.gender[lang]}</SectionTitle>
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

        {/* Tier donut */}
        <div>
          <SectionTitle>{T.analytics.tierBreak[lang]}</SectionTitle>
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
              <Tooltip formatter={(v: number) => [`${v} students`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="flex flex-col justify-center gap-3">
          <SectionTitle>{T.analytics.quickStats[lang]}</SectionTitle>
          {[
            { label: T.analytics.avgAtt[lang], value: `${Math.round(roster.reduce((s, r) => s + r.attendance_rate, 0) / roster.length * 100)}%` },
            { label: T.analytics.avgMarks[lang], value: faScores.length ? `${(faScores.reduce((a, b) => a + b, 0) / faScores.length).toFixed(1)}` : "—" },
            { label: T.analytics.avgRisk[lang], value: `${Math.round(roster.reduce((s, r) => s + r.risk_score, 0) / roster.length * 100)}` },
            { label: T.analytics.female[lang], value: `${genderData.find(g => g.gender === "Female")?.total ?? 0}` },
            { label: T.analytics.atRiskRate[lang], value: `${Math.round(roster.filter(r => r.tier !== "Low").length / roster.length * 100)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className="font-semibold text-zinc-900 tabular-nums">{value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
