"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, MessagesSquare, Shield, Sparkles, GraduationCap } from "lucide-react";
import type { StudentDetail, CounsellorTemplate } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { useLang, T } from "@/lib/i18n";
import { pctFormat, fmtInt, cn } from "@/lib/utils";

function RiskGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? "#dc2626" : score >= 0.65 ? "#f97316" : score >= 0.5 ? "#eab308" : "#16a34a";
  return (
    <div className="relative w-full max-w-[220px] aspect-square mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 42}`}
          strokeDashoffset={`${2 * Math.PI * 42 * (1 - score)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold tabular-nums" style={{ color }}>{pct}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Risk</div>
      </div>
    </div>
  );
}

function DriverItem({
  driver,
  lang,
}: {
  driver: StudentDetail["drivers"][0];
  lang: "en" | "te";
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold text-red-900">{lang === "en" ? driver.label_en : driver.label_te}</div>
        <div className="text-xs text-red-600 tabular-nums shrink-0">+{driver.contrib.toFixed(2)}</div>
      </div>
      <div className="text-sm text-zinc-700 mt-1 leading-relaxed">
        {lang === "en" ? driver.sentence_en : driver.sentence_te}
      </div>
    </div>
  );
}

export default function StudentDetailClient({
  student,
  counsellorTemplate,
  counsellorTemplateKey,
}: {
  student: StudentDetail;
  counsellorTemplate: CounsellorTemplate;
  counsellorTemplateKey: string;
}) {
  const { lang } = useLang();
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("interventions");
      if (!raw) return;
      const list = JSON.parse(raw) as { child_sno: number }[];
      if (list.some((x) => x.child_sno === student.child_sno)) setLogged(true);
    } catch { /* ignore */ }
  }, [student.child_sno]);

  const logIntervention = () => {
    try {
      const raw = localStorage.getItem("interventions");
      const list = raw ? (JSON.parse(raw) as { child_sno: number; at: string }[]) : [];
      list.push({ child_sno: student.child_sno, at: new Date().toISOString() });
      localStorage.setItem("interventions", JSON.stringify(list));
      setLogged(true);
    } catch { /* ignore */ }
  };

  const sms = lang === "en" ? counsellorTemplate.parent_sms_en : counsellorTemplate.parent_sms_te;
  const script = lang === "en" ? counsellorTemplate.teacher_script_en : counsellorTemplate.teacher_script_te;
  const schoolStr = student.school_name ?? "ZPHS";
  const smsRendered = sms.replace(/\{school\}/g, schoolStr);

  const casteLabels = { 1: "OC", 2: "BC", 3: "SC", 4: "ST" } as const;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/teacher" className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> {lang === "en" ? "Back to class roster" : "తరగతి జాబితాకు తిరిగి"}
        </Link>
      </div>

      {/* Header: ID + risk gauge */}
      <div className="rounded-xl border bg-white p-5 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-5 items-center">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">{lang === "en" ? "Student ID" : "విద్యార్థి ID"}</div>
            <RiskBadge tier={student.tier} size="md" />
          </div>
          <div className="text-3xl font-semibold text-zinc-900 tabular-nums">#{student.child_sno}</div>
          <div className="text-sm text-zinc-600 mt-3 space-y-0.5">
            <div><span className="text-zinc-500">{T.student.school[lang]}:</span> <span className="font-medium">{student.school_name ?? "—"}</span></div>
            <div>
              <span className="text-zinc-500">{T.student.district[lang]}:</span> <span className="font-medium">{student.district_name ?? "—"}</span>
              {student.mandal_name && <> · <span className="text-zinc-500">{T.student.mandal[lang]}:</span> <span className="font-medium">{student.mandal_name}</span></>}
            </div>
          </div>
        </div>
        <RiskGauge score={student.risk_score} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[color:var(--ap-navy)]" /> {T.student.profile[lang]}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-zinc-500">{T.student.gender[lang]}</dt>
              <dd className="font-medium text-zinc-900">{student.gender_label}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{T.student.age[lang]}</dt>
              <dd className="font-medium text-zinc-900">{student.age ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{lang === "en" ? "Social category" : "సామాజిక వర్గం"}</dt>
              <dd className="font-medium text-zinc-900">
                {(casteLabels[student.caste_clean as 1|2|3|4] ?? "—")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{T.student.attendance[lang]}</dt>
              <dd className={cn("font-medium", student.attendance_rate < 0.5 ? "text-red-700" : "text-zinc-900")}>
                {pctFormat(student.attendance_rate, 0)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{lang === "en" ? "Longest absence streak" : "నిరంతర గైర్హాజరు"}</dt>
              <dd className="font-medium text-zinc-900">{fmtInt(student.max_consec_absence)} {lang === "en" ? "days" : "రోజులు"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{T.student.marks[lang]}</dt>
              <dd className="font-medium text-zinc-900">{student.fa_avg === null ? "—" : student.fa_avg.toFixed(0)}</dd>
            </div>
          </dl>

          <div className="mt-4 pt-4 border-t border-zinc-200">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-zinc-500" />
              {T.student.household[lang]}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 italic">{T.student.householdSynthNote[lang]}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-2">
              <div>
                <dt className="text-xs text-zinc-500">{T.student.migration[lang]}</dt>
                <dd className={cn("font-medium", student.migration_flag ? "text-red-700" : "text-zinc-900")}>
                  {student.migration_flag ? T.student.yes[lang] : T.student.no[lang]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">{T.student.parentLit[lang]}</dt>
                <dd className="font-medium text-zinc-900">{T.student.litLevels[lang][student.parent_literacy]}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">{T.student.income[lang]}</dt>
                <dd className="font-medium text-zinc-900">{T.student.incLevels[lang][student.family_income_bracket]}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">{T.student.transport[lang]}</dt>
                <dd className="font-medium text-zinc-900">{student.transport_allowance ? T.student.yes[lang] : T.student.no[lang]}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Drivers */}
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wide mb-3">
            {T.student.drivers[lang]}
          </h2>
          <div className="space-y-3">
            {student.drivers.map((d, i) => (
              <DriverItem key={i} driver={d} lang={lang} />
            ))}
          </div>
          <div className="text-[11px] text-zinc-500 mt-3 italic">
            {lang === "en" ? "Explanations generated from SHAP values for this student's XGBoost prediction." : "ఈ విద్యార్థి XGBoost అంచనా కోసం SHAP విలువల నుండి వివరణలు."}
          </div>
        </section>
      </div>

      {/* Counsellor card */}
      <section className="rounded-xl border-2 border-[color:var(--ap-orange)] bg-orange-50/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[color:var(--ap-orange)]" />
            {T.student.counsellor[lang]}
          </h2>
          <span className="text-[10px] uppercase tracking-wide text-zinc-500 bg-white border border-zinc-200 rounded px-2 py-0.5">
            {lang === "en" ? "Generated" : "రూపొందించబడింది"} · {counsellorTemplateKey}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-4 border">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              {T.student.parentSms[lang]}
            </h3>
            <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line">{smsRendered}</p>
          </div>
          <div className="rounded-lg bg-white p-4 border">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <MessagesSquare className="h-3.5 w-3.5 text-[color:var(--ap-navy)]" />
              {T.student.teacherScript[lang]}
            </h3>
            <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line">{script}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-white p-4 border">
          <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">{T.student.schemes[lang]}</h3>
          <ul className="space-y-1.5">
            {counsellorTemplate.schemes.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[color:var(--ap-green)] mt-0.5">•</span>
                <div><span className="font-medium text-zinc-900">{s.name}</span> <span className="text-zinc-600">— {s.benefit}</span></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={logIntervention}
            disabled={logged}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              logged
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-[color:var(--ap-navy)] text-white hover:bg-[color:var(--ap-navy)]/90"
            )}
          >
            {logged ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {T.student.loggedIntervention[lang]}
              </>
            ) : (
              T.student.logIntervention[lang]
            )}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 text-right mt-1">
          {lang === "en" ? "Feeds the closed-loop retrain pipeline → outcome tracking → monthly model refresh." : "క్లోజ్డ్-లూప్ రీ-ట్రైన్ పైప్‌లైన్‌కు → ఫలితాల ట్రాకింగ్ → నెలవారీ మోడల్ రిఫ్రెష్."}
        </p>
      </section>
    </div>
  );
}
