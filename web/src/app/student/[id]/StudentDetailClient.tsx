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
  TrendingDown,
  AlertCircle,
  BookOpen,
  BarChart2,
  Send,
  ChevronRight,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StudentDetail, CounsellorTemplate } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import InterventionModal from "@/components/InterventionModal";
import ParentEngagementCard from "@/components/ParentEngagementCard";
import LEAPApiPanel from "@/components/LEAPApiPanel";
import { useLang, T } from "@/lib/i18n";
import { pctFormat, fmtInt, cn } from "@/lib/utils";

type Scheme = { name: string; benefit: string };

/* ─── scheme helpers ────────────────────────────────────────────────────────── */

function getPersonalisedSchemes(student: StudentDetail, base: Scheme[]): Scheme[] {
  const seen = new Set(base.map((s) => s.name));
  const add = (s: Scheme) => { if (!seen.has(s.name)) { seen.add(s.name); out.push(s); } };
  const out: Scheme[] = [...base];
  const isFemale = student.gender === 2;
  const caste = student.caste_clean as 1 | 2 | 3 | 4;
  const isSCST = caste === 3 || caste === 4;
  const isBC = caste === 2;

  add({ name: "Amma Vodi", benefit: "₹15,000/year to mother — keep child enrolled in government school" });

  if (isFemale) {
    add({ name: "Kasturba Gandhi Balika Vidyalaya (KGBV)", benefit: "Free residential schooling for girls from vulnerable/migrant families" });
    add({ name: "Aadabidda Nidhi", benefit: "₹1,500 financial assistance for economically vulnerable girls (TDP 2024)" });
    add({ name: "AP Girls Hostel (Social Welfare)", benefit: "Free hostel for SC/ST/BC girls in district headquarters" });
  }
  if (isSCST) {
    add({ name: "Post-Matric Scholarship RTF", benefit: "100% tuition & exam fee reimbursement for SC/ST students (Jnanabhumi)" });
    add({ name: "Post-Matric Scholarship MTF", benefit: "Maintenance allowance: ₹550–₹1,200/month for SC/ST hostel/day scholars" });
    add({ name: "NTR Vidyonnathi", benefit: "₹10,000 + 9-month civil services coaching for SC/ST/BC/EBC/Minority" });
    add({ name: "Ambedkar Overseas Vidya Nidhi", benefit: "Financial aid for SC/ST students pursuing higher education abroad" });
    if (isFemale) add({ name: "Rajiv Gandhi National Fellowship (SC/ST Girls)", benefit: "Monthly fellowship for M.Phil/PhD pursuits" });
  }
  if (isBC) {
    add({ name: "Post-Matric Scholarship RTF (BC)", benefit: "Fee reimbursement for BC/EBC/Minority students (Jnanabhumi portal)" });
    add({ name: "Post-Matric Scholarship MTF (BC)", benefit: "Maintenance allowance for BC hostel/day scholars" });
    add({ name: "NTR Vidyonnathi", benefit: "₹10,000 + coaching for BC/EBC/Minority students in competitive exams" });
    add({ name: "BC Welfare Residential Schools", benefit: "Free residential schooling for BC students in Classes 5–10" });
  }
  if (student.migration_flag) {
    add({ name: "Samagra Shiksha Bridge Course", benefit: "Catch-up curriculum for children returning after seasonal migration" });
  }
  if (student.transport_allowance) {
    add({ name: "AP Samagra Shiksha Transport Allowance", benefit: "₹2,400/year for students travelling >1 km to school" });
  }
  return out;
}

/* ─── sub-components ────────────────────────────────────────────────────────── */

function SchemeTag({ gender, caste, lang }: { gender: number; caste: number; lang: string }) {
  const tags: string[] = [];
  if (gender === 2) tags.push(lang === "en" ? "Female" : "స్త్రీ");
  const c = { 1: "OC", 2: "BC", 3: "SC", 4: "ST" } as Record<number, string>;
  if (c[caste]) tags.push(c[caste]);
  if (!tags.length) return null;
  return (
    <div className="flex gap-1.5 mb-3 flex-wrap">
      {tags.map(t => (
        <span key={t} className="text-[10px] uppercase tracking-wide bg-[color:var(--ap-navy)]/10 border border-[color:var(--ap-navy)]/20 text-[color:var(--ap-navy)] rounded-full px-2.5 py-0.5 font-semibold">{t}</span>
      ))}
      <span className="text-[10px] text-zinc-400 self-center">— {lang === "en" ? "schemes personalised" : "వ్యక్తిగత పథకాలు"}</span>
    </div>
  );
}

function RiskGauge({ score, lang }: { score: number; lang: "en" | "te" }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? "#dc2626" : score >= 0.65 ? "#f97316" : score >= 0.5 ? "#eab308" : "#16a34a";
  return (
    <div className="relative w-full max-w-[200px] aspect-square mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="10" fill="none" />
        <circle
          cx="50" cy="50" r="42"
          stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={`${2 * Math.PI * 42}`}
          strokeDashoffset={`${2 * Math.PI * 42 * (1 - score)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-black tabular-nums" style={{ color }}>{pct}</div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{lang === "en" ? "Risk Score" : "ప్రమాదం"}</div>
      </div>
    </div>
  );
}

function DriverItem({
  driver, lang, pct,
}: {
  driver: StudentDetail["drivers"][0];
  lang: "en" | "te";
  pct: number;
}) {
  const level = pct >= 80 ? "HIGH" : pct >= 40 ? "MED" : "LOW";
  const levelLabel = lang === "en"
    ? level
    : level === "HIGH" ? "అధిక" : level === "MED" ? "మధ్యమ" : "తక్కువ";
  const palette = {
    HIGH: { badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500", card: "border-red-100 bg-gradient-to-br from-red-50/80 to-white" },
    MED:  { badge: "bg-orange-100 text-orange-700 border-orange-200", bar: "bg-orange-400", card: "border-orange-100 bg-gradient-to-br from-orange-50/60 to-white" },
    LOW:  { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", bar: "bg-yellow-400", card: "border-yellow-100 bg-gradient-to-br from-yellow-50/40 to-white" },
  }[level];

  return (
    <div className={cn("rounded-xl border px-4 py-3.5 space-y-2.5", palette.card)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-zinc-900">{lang === "en" ? driver.label_en : driver.label_te}</div>
        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0", palette.badge)}>{levelLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", palette.bar)} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-zinc-600 leading-relaxed">
        {lang === "en" ? driver.sentence_en : driver.sentence_te}
      </div>
    </div>
  );
}

/** Cards for attendance + academic marks — always shown, separately styled */
function AcademicDriverCards({ student, lang }: { student: StudentDetail; lang: "en" | "te" }) {
  const att = student.attendance_rate;
  const attPct = Math.round(att * 100);
  const attLevel = att < 0.5 ? "HIGH" : att < 0.75 ? "MED" : "LOW";

  const fa = student.fa_avg;
  const faPct = fa != null ? Math.min(100, Math.round((fa / 300) * 100)) : null;
  const faLevel = fa == null ? null : fa < 120 ? "HIGH" : fa < 200 ? "MED" : "LOW";

  const sa = student.sa_avg;
  const saPct = sa != null ? Math.min(100, Math.round((sa / 300) * 100)) : null;
  const saLevel = sa == null ? null : sa < 120 ? "HIGH" : sa < 200 ? "MED" : "LOW";

  const levelCfg = {
    HIGH: { badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500", card: "border-blue-100 bg-gradient-to-br from-blue-50/60 to-white" },
    MED:  { badge: "bg-orange-100 text-orange-700 border-orange-200", bar: "bg-orange-400", card: "border-blue-100 bg-gradient-to-br from-blue-50/40 to-white" },
    LOW:  { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500", card: "border-blue-50 bg-white" },
  };

  const levelLabel = (l: "HIGH" | "MED" | "LOW") =>
    lang === "en" ? l : l === "HIGH" ? "అధిక" : l === "MED" ? "మధ్యమ" : "తక్కువ";

  return (
    <div className="space-y-2.5">
      {/* Attendance */}
      <div className={cn("rounded-xl border px-4 py-3.5 space-y-2.5", levelCfg[attLevel].card)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <div className="text-sm font-bold text-zinc-900">
              {lang === "en" ? "Attendance Rate" : "హాజరు రేటు"}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              "text-sm font-black tabular-nums",
              att < 0.5 ? "text-red-600" : att < 0.75 ? "text-orange-500" : "text-emerald-600"
            )}>{attPct}%</span>
            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", levelCfg[attLevel].badge)}>
              {levelLabel(attLevel)}
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", levelCfg[attLevel].bar)} style={{ width: `${attPct}%` }} />
        </div>
        <div className="text-xs text-zinc-600 leading-relaxed">
          {lang === "en"
            ? att < 0.5
              ? `Only ${attPct}% attendance — critical risk indicator. Frequent absences strongly predict dropout.`
              : att < 0.75
              ? `${attPct}% attendance — below the 75% threshold. Consistent absences increase dropout likelihood.`
              : `${attPct}% attendance — within acceptable range but should be monitored.`
            : att < 0.5
              ? `కేవలం ${attPct}% హాజరు — తీవ్రమైన ప్రమాద సూచిక. తరచుగా గైర్హాజరు డ్రాపౌట్‌కు దారితీస్తుంది.`
              : `${attPct}% హాజరు — 75% కంటే తక్కువ. నిరంతర గైర్హాజరు ప్రమాదాన్ని పెంచుతుంది.`}
        </div>
        {student.max_consec_absence > 0 && (
          <div className="text-[10px] text-zinc-400 font-medium">
            {lang === "en"
              ? `Max consecutive absences: ${student.max_consec_absence} days`
              : `గరిష్ట వరుస గైర్హాజరు: ${student.max_consec_absence} రోజులు`}
          </div>
        )}
      </div>

      {/* FA Marks */}
      {fa != null && faLevel != null && (
        <div className={cn("rounded-xl border px-4 py-3.5 space-y-2.5", levelCfg[faLevel].card)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="text-sm font-bold text-zinc-900">
                {lang === "en" ? "FA Marks (Formative Assessment)" : "FA మార్కులు"}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-sm font-black tabular-nums",
                faLevel === "HIGH" ? "text-red-600" : faLevel === "MED" ? "text-orange-500" : "text-emerald-600"
              )}>{fa.toFixed(0)}<span className="text-[10px] font-normal text-zinc-400">/300</span></span>
              <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", levelCfg[faLevel].badge)}>
                {levelLabel(faLevel)}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", levelCfg[faLevel].bar)} style={{ width: `${faPct}%` }} />
          </div>
          <div className="text-xs text-zinc-600 leading-relaxed">
            {lang === "en"
              ? faLevel === "HIGH"
                ? `FA score of ${fa.toFixed(0)}/300 (${faPct}%) is critically low — academic disengagement is a strong predictor of dropout.`
                : faLevel === "MED"
                ? `FA score of ${fa.toFixed(0)}/300 (${faPct}%) is below average — targeted academic support is recommended.`
                : `FA score of ${fa.toFixed(0)}/300 (${faPct}%) — performing adequately in assessments.`
              : `FA మార్కు ${fa.toFixed(0)}/300 (${faPct}%) — విద్యా నిమగ్నత తక్కువగా ఉంది.`}
          </div>
        </div>
      )}

      {/* SA Marks */}
      {sa != null && saLevel != null && (
        <div className={cn("rounded-xl border px-4 py-3.5 space-y-2.5", levelCfg[saLevel].card)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="text-sm font-bold text-zinc-900">
                {lang === "en" ? "SA Marks (Summative Assessment)" : "SA మార్కులు"}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-sm font-black tabular-nums",
                saLevel === "HIGH" ? "text-red-600" : saLevel === "MED" ? "text-orange-500" : "text-emerald-600"
              )}>{sa.toFixed(0)}<span className="text-[10px] font-normal text-zinc-400">/300</span></span>
              <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", levelCfg[saLevel].badge)}>
                {levelLabel(saLevel)}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", levelCfg[saLevel].bar)} style={{ width: `${saPct}%` }} />
          </div>
          <div className="text-xs text-zinc-600 leading-relaxed">
            {lang === "en"
              ? saLevel === "HIGH"
                ? `SA score of ${sa.toFixed(0)}/300 (${saPct}%) indicates serious academic difficulty — high dropout risk.`
                : saLevel === "MED"
                ? `SA score of ${sa.toFixed(0)}/300 (${saPct}%) — below average performance in exams.`
                : `SA score of ${sa.toFixed(0)}/300 (${saPct}%) — examination performance is satisfactory.`
              : `SA మార్కు ${sa.toFixed(0)}/300 (${saPct}%) — పరీక్షా పనితీరు.`}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskFactorChart({ student, lang }: { student: StudentDetail; lang: "en" | "te" }) {
  const maxContrib = Math.max(...student.drivers.map(d => Math.abs(d.contrib)), 0.001);

  // SHAP-derived model drivers (normalized 0-100)
  const shapData = student.drivers.map(d => ({
    subject: lang === "en" ? d.label_en : d.label_te,
    value: Math.round((Math.abs(d.contrib) / maxContrib) * 100),
    fullMark: 100,
  }));

  // Academic/attendance indicators added as extra spokes (inverted: lower score = higher risk)
  const extraData: { subject: string; value: number; fullMark: number }[] = [];

  const att = student.attendance_rate;
  extraData.push({
    subject: lang === "en" ? "Attendance" : "హాజరు",
    value: Math.round((1 - att) * 100),
    fullMark: 100,
  });

  if (student.fa_avg != null) {
    const faPct = student.fa_avg / 300;
    extraData.push({
      subject: lang === "en" ? "FA Marks" : "FA మార్కులు",
      value: Math.round((1 - faPct) * 100),
      fullMark: 100,
    });
  }

  if (student.sa_avg != null) {
    const saPct = student.sa_avg / 300;
    extraData.push({
      subject: lang === "en" ? "SA Marks" : "SA మార్కులు",
      value: Math.round((1 - saPct) * 100),
      fullMark: 100,
    });
  }

  const data = [...extraData, ...shapData];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" gridType="polygon" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#6b7280", fontSize: 9.5, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={lang === "en" ? "Risk Contribution" : "ప్రమాద కారకం"}
            dataKey="value"
            stroke="#dc2626"
            strokeWidth={2}
            fill="#dc2626"
            fillOpacity={0.12}
          />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
            formatter={(value: any) => [`${Number(value).toFixed(0)}% risk weight`, lang === "en" ? "Impact" : "ప్రభావం"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────────── */

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

  const refreshState = async () => {
    try {
      const res = await fetch(`/api/interventions?childSno=${student.child_sno}`);
      if (res.ok) {
        const data = await res.json();
        setLogged(data.length > 0);
        setInterventionCount(data.length);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { refreshState(); }, [student.child_sno]); // eslint-disable-line react-hooks/exhaustive-deps

  const sms = lang === "en" ? counsellorTemplate.parent_sms_en : counsellorTemplate.parent_sms_te;
  const script = lang === "en" ? counsellorTemplate.teacher_script_en : counsellorTemplate.teacher_script_te;
  const schoolStr = student.school_name ?? "ZPHS";
  const smsRendered = sms.replace(/\{school\}/g, schoolStr);
  const casteLabels = { 1: "OC", 2: "BC", 3: "SC", 4: "ST" } as const;

  return (
    <div className="space-y-5 pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> {lang === "en" ? "Back" : "వెనుకకు"}
      </button>

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
                ? "Full risk analysis is not yet available. Attendance and basic details are shown from the class roster."
                : "పూర్తి ప్రమాద విశ్లేషణ అందుబాటులో లేదు. తరగతి రోస్టర్ నుండి ప్రాథమిక వివరాలు చూపబడ్డాయి."}
            </div>
          </div>
        </div>
      )}

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

        {/* Main content */}
        <div className="relative p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-blue-50/30 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">

            {/* Identity */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-[color:var(--ap-navy)] flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                    {lang === "en" ? "Student ID" : "విద్యార్థి ID"}
                  </div>
                  <div className="text-3xl font-black text-zinc-900 tabular-nums">#{student.child_sno}</div>
                </div>
                <div className="ml-auto">
                  <RiskBadge tier={student.tier} size="lg" />
                </div>
              </div>

              {/* Quick-stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: lang === "en" ? "Attendance" : "హాజరు",
                    value: `${Math.round(student.attendance_rate * 100)}%`,
                    sub: lang === "en" ? "of school days" : "పాఠశాల రోజులు",
                    color: student.attendance_rate < 0.5 ? "text-red-600" : student.attendance_rate < 0.75 ? "text-orange-500" : "text-emerald-600",
                    bg: student.attendance_rate < 0.5 ? "bg-red-50 border-red-100" : student.attendance_rate < 0.75 ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100",
                  },
                  {
                    label: lang === "en" ? "FA Marks" : "FA మార్కులు",
                    value: student.fa_avg != null ? `${student.fa_avg.toFixed(0)}/300` : "—",
                    sub: student.fa_avg != null ? `${Math.min(100, Math.round((student.fa_avg / 300) * 100))}% score` : lang === "en" ? "not recorded" : "నమోదు లేదు",
                    color: student.fa_avg == null ? "text-zinc-400" : student.fa_avg < 120 ? "text-red-600" : student.fa_avg < 200 ? "text-orange-500" : "text-emerald-600",
                    bg: student.fa_avg == null ? "bg-zinc-50 border-zinc-100" : student.fa_avg < 120 ? "bg-red-50 border-red-100" : student.fa_avg < 200 ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100",
                  },
                  {
                    label: lang === "en" ? "SA Marks" : "SA మార్కులు",
                    value: student.sa_avg != null ? `${student.sa_avg.toFixed(0)}/300` : "—",
                    sub: student.sa_avg != null ? `${Math.min(100, Math.round((student.sa_avg / 300) * 100))}% score` : lang === "en" ? "not recorded" : "నమోదు లేదు",
                    color: student.sa_avg == null ? "text-zinc-400" : student.sa_avg < 120 ? "text-red-600" : student.sa_avg < 200 ? "text-orange-500" : "text-emerald-600",
                    bg: student.sa_avg == null ? "bg-zinc-50 border-zinc-100" : student.sa_avg < 120 ? "bg-red-50 border-red-100" : student.sa_avg < 200 ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100",
                  },
                  {
                    label: lang === "en" ? "Max Absence" : "గరిష్ట గైర్హాజరు",
                    value: `${student.max_consec_absence}d`,
                    sub: lang === "en" ? "consecutive days" : "వరుస రోజులు",
                    color: student.max_consec_absence > 14 ? "text-red-600" : student.max_consec_absence > 7 ? "text-orange-500" : "text-zinc-700",
                    bg: student.max_consec_absence > 14 ? "bg-red-50 border-red-100" : student.max_consec_absence > 7 ? "bg-orange-50 border-orange-100" : "bg-zinc-50 border-zinc-100",
                  },
                ].map((stat, i) => (
                  <div key={i} className={cn("rounded-xl border px-3.5 py-2.5", stat.bg)}>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{stat.label}</div>
                    <div className={cn("text-lg font-black tabular-nums leading-tight", stat.color)}>{stat.value}</div>
                    <div className="text-[10px] text-zinc-400 font-medium mt-0.5">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gauge */}
            <div className="shrink-0 bg-white p-4 rounded-2xl border border-zinc-100 shadow-inner">
              <RiskGauge score={student.risk_score} lang={lang as "en" | "te"} />
            </div>
          </div>
        </div>

        {/* School / location footer */}
        <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[color:var(--ap-navy)]/10 flex items-center justify-center shrink-0">
              <SchoolIcon className="h-3.5 w-3.5 text-[color:var(--ap-navy)]" />
            </div>
            <span className="text-sm font-semibold text-zinc-800 truncate">{student.school_name ?? "—"}</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-zinc-200 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-200/60 flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-500 truncate">{student.district_name} · {student.mandal_name}</span>
          </div>
        </div>
      </div>

      {/* ── Profile + Drivers ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Student profile */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-5 flex items-center gap-2 pb-3 border-b border-zinc-100">
            <GraduationCap className="h-4 w-4 text-[color:var(--ap-navy)]" /> {T.student.profile[lang]}
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {[
              {
                icon: <Activity className="h-3 w-3" />,
                label: T.student.gender[lang],
                value: student.gender_label,
                valueClass: "text-zinc-900",
              },
              {
                icon: <Calendar className="h-3 w-3" />,
                label: T.student.age[lang],
                value: student.age ?? "—",
                valueClass: "text-zinc-900",
              },
              {
                icon: <User className="h-3 w-3" />,
                label: lang === "en" ? "Social Category" : "సామాజిక వర్గం",
                value: casteLabels[student.caste_clean as 1|2|3|4] ?? "—",
                valueClass: "text-zinc-900",
              },
              {
                icon: <TrendingUp className="h-3 w-3" />,
                label: T.student.attendance[lang],
                value: pctFormat(student.attendance_rate, 0),
                valueClass: student.attendance_rate < 0.5 ? "text-red-600" : student.attendance_rate < 0.75 ? "text-orange-500" : "text-emerald-600",
              },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {item.icon} {item.label}
                </div>
                <div className={cn("text-base font-bold", item.valueClass)}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Academic marks row */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {student.fa_avg != null && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">{lang === "en" ? "FA Marks" : "FA మార్కులు"}</div>
                <div className="text-lg font-black text-zinc-900 tabular-nums">
                  {student.fa_avg.toFixed(0)}<span className="text-xs font-normal text-zinc-400">/300</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-blue-100">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, Math.round((student.fa_avg / 300) * 100))}%` }} />
                </div>
              </div>
            )}
            {student.sa_avg != null && (
              <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
                <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1">{lang === "en" ? "SA Marks" : "SA మార్కులు"}</div>
                <div className="text-lg font-black text-zinc-900 tabular-nums">
                  {student.sa_avg.toFixed(0)}<span className="text-xs font-normal text-zinc-400">/300</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-violet-100">
                  <div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.min(100, Math.round((student.sa_avg / 300) * 100))}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Household context */}
          <div className="mt-5 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Shield className="h-3.5 w-3.5" /> {T.student.household[lang]}
            </h3>
            <div className="grid grid-cols-2 gap-y-3.5">
              {[
                { label: T.student.migration[lang], value: student.migration_flag ? T.student.yes[lang] : T.student.no[lang], highlight: !!student.migration_flag },
                { label: T.student.parentLit[lang], value: T.student.litLevels[lang][student.parent_literacy] },
                { label: T.student.income[lang], value: T.student.incLevels[lang][student.family_income_bracket] },
                { label: T.student.transport[lang], value: student.transport_allowance ? T.student.yes[lang] : T.student.no[lang] },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.label}</div>
                  <div className={cn("text-sm font-semibold mt-0.5", item.highlight ? "text-red-600" : "text-zinc-900")}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why flagged + chart */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2 pb-3 mb-4 border-b border-zinc-100">
            <AlertCircle className="h-4 w-4 text-red-500" /> {T.student.drivers[lang]}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[440px]">
            {/* Academic indicators — always shown */}
            <div className="mb-1">
              <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="inline-block w-3 h-px bg-blue-300" />
                {lang === "en" ? "Academic & Attendance Indicators" : "విద్యా & హాజరు సూచికలు"}
              </div>
              <AcademicDriverCards student={student} lang={lang as "en" | "te"} />
            </div>

            {/* Model-derived SHAP drivers */}
            {student.drivers.length > 0 && (
              <div className="mt-3">
                <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-3 h-px bg-red-300" />
                  {lang === "en" ? "Student Risk Drivers" : "ప్రమాద కారకాలు"}
                </div>
                <div className="space-y-2">
                  {(() => {
                    const maxC = Math.max(...student.drivers.map(d => Math.abs(d.contrib)), 0.001);
                    return student.drivers.map((d, i) => (
                      <DriverItem key={i} driver={d} lang={lang as "en" | "te"} pct={Math.round((Math.abs(d.contrib) / maxC) * 100)} />
                    ));
                  })()}
                </div>
              </div>
            )}

            {student.drivers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2 mt-2">
                <AlertCircle className="h-8 w-8 text-zinc-300" />
                <div className="text-sm font-medium text-zinc-500">
                  {lang === "en" ? "AI risk analysis not available" : "AI ప్రమాద విశ్లేషణ అందుబాటులో లేదు"}
                </div>
                <div className="text-xs text-zinc-400 max-w-[220px]">
                  {lang === "en"
                    ? "Run a full risk assessment to see model-derived contributing factors."
                    : "పూర్తి ప్రమాద మూల్యాంకనం నడపండి."}
                </div>
              </div>
            )}
          </div>

          {/* Radar chart — includes attendance + marks + SHAP */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" />
              {lang === "en" ? "Risk Factor Impact Analysis" : "ప్రమాద కారకాల ప్రభావ విశ్లేషణ"}
            </div>
            <p className="text-[10px] text-zinc-400 mb-2">
              {lang === "en"
                ? "Higher value = stronger contribution to dropout risk"
                : "అధిక విలువ = డ్రాపౌట్ ప్రమాదానికి అధిక దోహదం"}
            </p>
            <RiskFactorChart student={student} lang={lang as "en" | "te"} />
          </div>
        </section>
      </div>

      {/* ── Counsellor Assist ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{T.student.counsellor[lang]}</h2>
              <p className="text-[10px] text-orange-100 mt-0.5">
                {lang === "en" ? "AI-generated outreach · personalised for this student" : "AI రూపొందించిన సంప్రదింపు సాధనం"}
              </p>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-widest bg-white/20 text-white border border-white/30 rounded-full px-2.5 py-1 font-bold">
            {counsellorTemplateKey.replace(/_/g, " ")}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* SMS + Script cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent SMS */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100/60 border-b border-emerald-100">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">{T.student.parentSms[lang]}</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{smsRendered}</p>
              </div>
            </div>

            {/* Teacher script */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-100/50 border-b border-blue-100">
                <div className="w-6 h-6 rounded-lg bg-[color:var(--ap-navy)] flex items-center justify-center">
                  <MessagesSquare className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-xs font-bold text-[color:var(--ap-navy)] uppercase tracking-wide">{T.student.teacherScript[lang]}</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{script}</p>
              </div>
            </div>
          </div>

          {/* Recommended schemes */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-zinc-100">
              <Shield className="h-3.5 w-3.5 text-[color:var(--ap-navy)]" />
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">{T.student.schemes[lang]}</h3>
            </div>
            <div className="p-4 space-y-3">
              <SchemeTag gender={student.gender} caste={student.caste_clean} lang={lang} />
              <ul className="space-y-2">
                {getPersonalisedSchemes(student, counsellorTemplate.schemes).map((s, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[color:var(--ap-navy)]/10 flex items-center justify-center shrink-0">
                      <ChevronRight className="h-3 w-3 text-[color:var(--ap-navy)]" />
                    </div>
                    <div className="text-sm leading-snug">
                      <span className="font-semibold text-zinc-900">{s.name}</span>
                      <span className="text-zinc-500"> — {s.benefit}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {interventionCount > 0 && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {interventionCount} intervention{interventionCount > 1 ? "s" : ""} logged
                </span>
              )}
              <span className="text-[10px] text-zinc-400">
                {lang === "en" ? "Logged interventions feed the monthly model refresh" : "లాగ్ చేసిన జోక్యాలు నెలవారీ మోడల్ రిఫ్రెష్‌కు దోహదపడతాయి"}
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
                logged
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-[color:var(--ap-navy)] text-white hover:bg-[color:var(--ap-navy)]/90"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              {logged ? T.student.loggedIntervention[lang] : T.student.logIntervention[lang]}
            </button>
          </div>
        </div>
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
