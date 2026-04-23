"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, MessagesSquare, Shield, Sparkles, GraduationCap, ClipboardList } from "lucide-react";
import type { StudentDetail, CounsellorTemplate } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import InterventionModal, { getInterventionsForStudent, isInterventionLogged } from "@/components/InterventionModal";
import ParentEngagementCard from "@/components/ParentEngagementCard";
import LEAPApiPanel from "@/components/LEAPApiPanel";
import { useLang, T } from "@/lib/i18n";
import { pctFormat, fmtInt, cn } from "@/lib/utils";

type Scheme = { name: string; benefit: string };

function getPersonalisedSchemes(student: StudentDetail, base: Scheme[]): Scheme[] {
  const seen = new Set(base.map((s) => s.name));
  const add = (s: Scheme) => { if (!seen.has(s.name)) { seen.add(s.name); out.push(s); } };
  const out: Scheme[] = [...base];
  const isFemale = student.gender === 2;
  const caste = student.caste_clean as 1 | 2 | 3 | 4;
  const isSCST = caste === 3 || caste === 4;
  const isBC = caste === 2;

  // Amma Vodi — all students with school-going children
  add({ name: "Amma Vodi", benefit: "₹15,000/year to mother — keep child enrolled in government school" });

  // Gender-specific
  if (isFemale) {
    add({ name: "Kasturba Gandhi Balika Vidyalaya (KGBV)", benefit: "Free residential schooling for girls from vulnerable/migrant families" });
    add({ name: "Aadabidda Nidhi", benefit: "₹1,500 financial assistance for economically vulnerable girls (TDP 2024)" });
    add({ name: "AP Girls Hostel (Social Welfare)", benefit: "Free hostel for SC/ST/BC girls in district headquarters" });
  }

  // SC / ST specific
  if (isSCST) {
    add({ name: "Post-Matric Scholarship RTF", benefit: "100% tuition & exam fee reimbursement for SC/ST students (Jnanabhumi)" });
    add({ name: "Post-Matric Scholarship MTF", benefit: "Maintenance allowance: ₹550–₹1,200/month for SC/ST hostel/day scholars" });
    add({ name: "NTR Vidyonnathi", benefit: "₹10,000 + 9-month civil services coaching for SC/ST/BC/EBC/Minority" });
    add({ name: "Ambedkar Overseas Vidya Nidhi", benefit: "Financial aid for SC/ST students pursuing higher education abroad" });
    if (isFemale) {
      add({ name: "Rajiv Gandhi National Fellowship (SC/ST Girls)", benefit: "Monthly fellowship for M.Phil/PhD pursuits" });
    }
  }

  // BC / EBC specific
  if (isBC) {
    add({ name: "Post-Matric Scholarship RTF (BC)", benefit: "Fee reimbursement for BC/EBC/Minority students (Jnanabhumi portal)" });
    add({ name: "Post-Matric Scholarship MTF (BC)", benefit: "Maintenance allowance for BC hostel/day scholars" });
    add({ name: "NTR Vidyonnathi", benefit: "₹10,000 + coaching for BC/EBC/Minority students in competitive exams" });
    add({ name: "BC Welfare Residential Schools", benefit: "Free residential schooling for BC students in Classes 5–10" });
  }

  // Migration
  if (student.migration_flag) {
    add({ name: "Samagra Shiksha Bridge Course", benefit: "Catch-up curriculum for children returning after seasonal migration" });
  }

  // Transport
  if (student.transport_allowance) {
    add({ name: "AP Samagra Shiksha Transport Allowance", benefit: "₹2,400/year for students travelling >1 km to school" });
  }

  return out;
}

function SchemeTag({ gender, caste, lang }: { gender: number; caste: number; lang: string }) {
  const tags: string[] = [];
  if (gender === 2) tags.push(lang === "en" ? "Female" : "స్త్రీ");
  const c = { 
    1: lang === "en" ? "OC" : "OC", 
    2: lang === "en" ? "BC" : "BC", 
    3: lang === "en" ? "SC" : "SC", 
    4: lang === "en" ? "ST" : "ST" 
  } as Record<number, string>;
  if (c[caste]) tags.push(c[caste]);
  if (!tags.length) return null;
  return (
    <div className="flex gap-1.5 mb-2">
      {tags.map(t => (
        <span key={t} className="text-[10px] uppercase tracking-wide bg-zinc-100 border border-zinc-200 text-zinc-600 rounded px-2 py-0.5 font-medium">{t}</span>
      ))}
      <span className="text-[10px] text-zinc-400 self-center">— {lang === "en" ? "schemes personalised" : "వ్యక్తిగత పథకాలు"}</span>
    </div>
  );
}

function RiskGauge({ score, lang }: { score: number; lang: "en" | "te" }) {
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
        <div className="text-xs text-zinc-500 uppercase tracking-wide">{lang === "en" ? "Risk" : "ప్రమాదం"}</div>
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
  const [showModal, setShowModal] = useState(false);
  const [interventionCount, setInterventionCount] = useState(0);

  const refreshState = () => {
    setLogged(isInterventionLogged(student.child_sno));
    setInterventionCount(getInterventionsForStudent(student.child_sno).length);
  };

  useEffect(() => { refreshState(); }, [student.child_sno]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <RiskGauge score={student.risk_score} lang={lang as "en" | "te"} />
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
          <SchemeTag gender={student.gender} caste={student.caste_clean} lang={lang} />
          <ul className="space-y-1.5">
            {getPersonalisedSchemes(student, counsellorTemplate.schemes).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[color:var(--ap-green)] mt-0.5">•</span>
                <div><span className="font-medium text-zinc-900">{s.name}</span> <span className="text-zinc-600">— {s.benefit}</span></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          {interventionCount > 0 && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {interventionCount} intervention{interventionCount > 1 ? "s" : ""} logged
            </span>
          )}
          <button
            onClick={() => setShowModal(true)}
            className={cn(
              "ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              logged
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-[color:var(--ap-navy)] text-white hover:bg-[color:var(--ap-navy)]/90"
            )}
          >
            <ClipboardList className="h-4 w-4" />
            {logged ? T.student.loggedIntervention[lang] : T.student.logIntervention[lang]}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 text-right mt-1">
          {lang === "en" ? "Feeds the closed-loop retrain pipeline → outcome tracking → monthly model refresh." : "క్లోజ్డ్-లూప్ రీ-ట్రైన్ పైప్‌లైన్‌కు → ఫలితాల ట్రాకింగ్ → నెలవారీ మోడల్ రిఫ్రెష్."}
        </p>
      </section>

      {/* Parent & community engagement */}
      <ParentEngagementCard
        child_sno={student.child_sno}
        school_name={student.school_name}
        smsText={smsRendered}
      />

      {/* LEAP API integration */}
      <LEAPApiPanel student={student} />

      {showModal && (
        <InterventionModal
          child_sno={student.child_sno}
          onClose={() => setShowModal(false)}
          onSaved={refreshState}
        />
      )}
    </div>
  );
}
