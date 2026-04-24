"use client";
import Link from "next/link";
import { Shield, Brain, RefreshCw, ArrowRight, Lock } from "lucide-react";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat } from "@/lib/utils";

type Props = {
  recall: number;
  precision: number;
  criticalCount: number;
};

const CREDENTIALS = [
  { role: "Teacher", roleTE: "ఉపాధ్యాయుడు", email: "teacher@zphs.ap.gov.in", password: "teacher123" },
  { role: "Head Master", roleTE: "ప్రధానోపాధ్యాయుడు", email: "principal@zphs.ap.gov.in", password: "hm123" },
  { role: "District Officer", roleTE: "జిల్లా అధికారి", email: "deo@ntr.ap.gov.in", password: "district123" },
  { role: "RTGS Admin", roleTE: "RTGS అడ్మిన్", email: "admin@rtgs.ap.gov.in", password: "rtgs123" },
];

export default function LandingClient({ recall, precision, criticalCount }: Props) {
  const { lang } = useLang();
  const t = T.landing;

  const stats = [
    { label: t.studentsMonitored[lang], value: fmtInt(395_000), sub: t.ay[lang] },
    { label: t.dropoutRecall[lang], value: pctFormat(recall, 1), sub: t.shareCaught[lang] },
    { label: t.criticalRisk[lang], value: fmtInt(criticalCount), sub: t.immediateAction[lang] },
    { label: t.schoolsCovered[lang], value: fmtInt(9149), sub: t.across26[lang] },
  ];

  const pillars = [
    { icon: <Brain className="h-7 w-7 text-[color:var(--ap-navy)]" />, title: t.hyper[lang], body: t.hyperBody[lang] },
    { icon: <Shield className="h-7 w-7 text-[color:var(--ap-orange)]" />, title: t.genai[lang], body: t.genaiBody[lang] },
    { icon: <RefreshCw className="h-7 w-7 text-[color:var(--ap-green)]" />, title: t.closed[lang], body: t.closedBody[lang] },
  ];

  const steps = [
    { step: "1", label: t.step1[lang], sub: t.step1sub[lang] },
    { step: "→", label: "", sub: "" },
    { step: "2", label: t.step2[lang], sub: t.step2sub[lang] },
    { step: "→", label: "", sub: "" },
    { step: "3", label: t.step3[lang], sub: t.step3sub[lang] },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12 space-y-4">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium">
          {t.badge[lang]}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight">
          {t.title[lang]}
        </h1>
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
          {t.desc[lang]}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[color:var(--ap-navy)] text-white font-semibold hover:opacity-90 transition"
          >
            {t.signIn[lang]} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition"
          >
            {t.viewMetrics[lang]}
          </Link>
        </div>
      </section>

      {/* Stat bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white px-5 py-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--ap-navy)]">{s.value}</div>
            <div className="text-sm font-medium text-zinc-700 mt-0.5">{s.label}</div>
            <div className="text-xs text-zinc-500">{s.sub}</div>
          </div>
        ))}
      </section>

      {/* Three pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <div key={p.title} className="rounded-xl border bg-white p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-zinc-50 border flex items-center justify-center">
              {p.icon}
            </div>
            <h3 className="font-semibold text-zinc-900">{p.title}</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </section>

      {/* Demo credentials */}
      <section className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-zinc-500" />
          <h2 className="font-semibold text-zinc-800">{t.demoCredentials[lang]}</h2>
          <span className="text-xs bg-amber-100 text-amber-800 rounded px-2 py-0.5 ml-1">{t.hackathonOnly[lang]}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CREDENTIALS.map((c) => (
            <div key={c.role} className="rounded-lg bg-white border p-3 space-y-1.5">
              <div className="text-xs font-semibold text-[color:var(--ap-navy)] uppercase tracking-wide">
                {lang === "en" ? c.role : c.roleTE}
              </div>
              <div className="text-xs text-zinc-700 font-mono break-all">{c.email}</div>
              <div className="text-xs text-zinc-500">{t.password[lang]} <span className="font-mono text-zinc-700">{c.password}</span></div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-3">{t.rolesNote[lang]}</p>
      </section>

      {/* Architecture note */}
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold text-zinc-900 mb-3">{t.howItWorks[lang]}</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
          {steps.map((s, i) =>
            s.step === "→" ? (
              <div key={i} className="flex items-center justify-center text-zinc-400 text-lg font-light">→</div>
            ) : (
              <div key={i} className="rounded-lg border bg-zinc-50 p-3">
                <div className="text-lg font-bold text-[color:var(--ap-navy)]">{s.step}</div>
                <div className="font-semibold text-zinc-800 mt-1">{s.label}</div>
                <div className="text-zinc-500 mt-0.5">{s.sub}</div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
