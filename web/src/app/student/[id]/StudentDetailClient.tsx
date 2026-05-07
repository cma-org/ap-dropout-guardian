"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  MessageCircle, 
  MessagesSquare, 
  Shield, 
  Sparkles, 
  GraduationCap, 
  ClipboardList,
  Activity,
  User,
  School as SchoolIcon,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
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
  pct,
}: {
  driver: StudentDetail["drivers"][0];
  lang: "en" | "te";
  pct: number; // 0-100 relative weight vs top driver
}) {
  const label = pct >= 80 ? (lang === "en" ? "HIGH" : "అధిక") : pct >= 40 ? (lang === "en" ? "MED" : "మధ్యమ") : (lang === "en" ? "LOW" : "తక్కువ");
  const badgeColor = pct >= 80 ? "bg-red-100 text-red-700" : pct >= 40 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-red-900">{lang === "en" ? driver.label_en : driver.label_te}</div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>{label}</span>
      </div>
      {/* Weight bar */}
      <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
        <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-sm text-zinc-700 leading-relaxed">
        {lang === "en" ? driver.sentence_en : driver.sentence_te}
      </div>
    </div>
  );
}

function RiskFactorChart({ drivers, lang }: { drivers: StudentDetail["drivers"]; lang: "en" | "te" }) {
  // Normalize so the top contributor = 100, others proportional — avoids raw SHAP log-odds > 100%
  const maxContrib = Math.max(...drivers.map(d => Math.abs(d.contrib)), 0.001);
  const data = drivers.map(d => ({
    subject: lang === "en" ? d.label_en : d.label_te,
    value: Math.round((Math.abs(d.contrib) / maxContrib) * 100),
    fullMark: 100,
  }));

  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Risk Contribution"
            dataKey="value"
            stroke="#dc2626"
            strokeWidth={2}
            fill="#dc2626"
            fillOpacity={0.15}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`${Number(value).toFixed(0)}% relative impact`, lang === "en" ? "Weight" : "బరువు"]}
          />
        </RadarChart>
      </ResponsiveContainer>
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
  const router = useRouter();
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
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {lang === "en" ? "Back" : "వెనుకకు"}
        </button>
      </div>

      {/* Partial profile banner */}
      {student.partial && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-800">
              {lang === "en" ? "Limited profile — roster data only" : "పరిమిత ప్రొఫైల్ — రోస్టర్ డేటా మాత్రమే"}
            </div>
            <div className="text-xs text-amber-700 mt-0.5">
              {lang === "en"
                ? "Full risk analysis is not yet available for this student. Attendance and basic details are shown from the class roster."
                : "ఈ విద్యార్థికి పూర్తి ప్రమాద విశ్లేషణ ఇంకా అందుబాటులో లేదు. తరగతి రోస్టర్ నుండి హాజరు మరియు ప్రాథమిక వివరాలు చూపబడ్డాయి."}
            </div>
          </div>
        </div>
      )}

      {/* Header: ID + risk gauge */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[color:var(--ap-navy)]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 rounded-lg">
                <User className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">{lang === "en" ? "Student ID" : "విద్యార్థి ID"}</div>
                <div className="text-4xl font-black text-zinc-900 tabular-nums">#{student.child_sno}</div>
              </div>
              <div className="ml-auto md:ml-4">
                <RiskBadge tier={student.tier} size="lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <SchoolIcon className="h-4 w-4 text-zinc-400" />
                <span className="font-medium">{student.school_name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span className="font-medium">
                  {student.district_name} · {student.mandal_name}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
            <RiskGauge score={student.risk_score} lang={lang as "en" | "te"} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-50 pb-4">
            <GraduationCap className="h-5 w-5 text-[color:var(--ap-navy)]" /> {T.student.profile[lang]}
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Activity className="h-3 w-3" /> {T.student.gender[lang]}
              </div>
              <div className="text-base font-semibold text-zinc-900">{student.gender_label}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Calendar className="h-3 w-3" /> {T.student.age[lang]}
              </div>
              <div className="text-base font-semibold text-zinc-900">{student.age ?? "—"}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <User className="h-3 w-3" /> {lang === "en" ? "Social category" : "సామాజిక వర్గం"}
              </div>
              <div className="text-base font-semibold text-zinc-900">
                {(casteLabels[student.caste_clean as 1|2|3|4] ?? "—")}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" /> {T.student.attendance[lang]}
              </div>
              <div className={cn("text-base font-bold", student.attendance_rate < 0.5 ? "text-red-600" : "text-emerald-600")}>
                {pctFormat(student.attendance_rate, 0)}
              </div>
            </div>
          </div>

          <div className="mt-8 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200" />
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4" />
              {T.student.household[lang]}
            </h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{T.student.migration[lang]}</div>
                <div className={cn("text-sm font-semibold mt-0.5", student.migration_flag ? "text-red-600" : "text-zinc-900")}>
                  {student.migration_flag ? T.student.yes[lang] : T.student.no[lang]}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{T.student.parentLit[lang]}</div>
                <div className="text-sm font-semibold mt-0.5 text-zinc-900">{T.student.litLevels[lang][student.parent_literacy]}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{T.student.income[lang]}</div>
                <div className="text-sm font-semibold mt-0.5 text-zinc-900">{T.student.incLevels[lang][student.family_income_bracket]}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{T.student.transport[lang]}</div>
                <div className="text-sm font-semibold mt-0.5 text-zinc-900">{student.transport_allowance ? T.student.yes[lang] : T.student.no[lang]}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Drivers & Chart */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-50 pb-4 mb-4">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" /> {T.student.drivers[lang]}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
            {student.drivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <AlertCircle className="h-8 w-8 text-zinc-300" />
                <div className="text-sm font-medium text-zinc-500">
                  {lang === "en" ? "Risk analysis not available" : "ప్రమాద విశ్లేషణ అందుబాటులో లేదు"}
                </div>
                <div className="text-xs text-zinc-400 max-w-[220px]">
                  {lang === "en"
                    ? "This student was identified from the class roster. Run a full risk assessment to see contributing factors."
                    : "ఈ విద్యార్థి తరగతి రోస్టర్ నుండి గుర్తించబడ్డారు. కారణాలు చూడటానికి పూర్తి ప్రమాద మూల్యాంకనం నడపండి."}
                </div>
              </div>
            ) : (
              (() => {
                const maxC = Math.max(...student.drivers.map(d => Math.abs(d.contrib)), 0.001);
                return student.drivers.map((d, i) => (
                  <DriverItem key={i} driver={d} lang={lang} pct={Math.round((Math.abs(d.contrib) / maxC) * 100)} />
                ));
              })()
            )}
          </div>

          {student.drivers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{lang === "en" ? "Risk Factor Impact Analysis" : "ప్రమాద కారకాల ప్రభావ విశ్లేషణ"}</div>
              <RiskFactorChart drivers={student.drivers} lang={lang as "en" | "te"} />
            </div>
          )}
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
