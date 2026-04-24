import Link from "next/link";
import { getMetrics } from "@/lib/data";
import { fmtInt, pctFormat } from "@/lib/utils";
import { Shield, Brain, RefreshCw, ArrowRight, Lock } from "lucide-react";

export default async function LandingPage() {
  const m = await getMetrics();
  const t = m.test_oot;

  const credentials = [
    { role: "Teacher", email: "teacher@zphs.ap.gov.in", password: "teacher123" },
    { role: "Head Master", email: "principal@zphs.ap.gov.in", password: "hm123" },
    { role: "District Officer", email: "deo@ntr.ap.gov.in", password: "district123" },
    { role: "RTGS Admin", email: "admin@rtgs.ap.gov.in", password: "rtgs123" },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12 space-y-4">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium">
          RTGS AI Hackathon 2026 — Problem 100004
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight">
          AP Dropout Guardian
        </h1>
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
          AI-assisted early identification and support for at-risk students in Classes 9–10.
          Serving teachers, school heads, and district officers across Andhra Pradesh.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[color:var(--ap-navy)] text-white font-semibold hover:opacity-90 transition"
          >
            Sign in to your dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition"
          >
            View model metrics
          </Link>
        </div>
      </section>

      {/* Stat bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Students monitored", value: fmtInt(395_000), sub: "AY 2024-25" },
          { label: "Dropout recall", value: pctFormat(t.recall, 1), sub: "Share caught early" },
          { label: "Critical-risk students", value: fmtInt(m.tier_counts.Critical), sub: "Immediate action needed" },
          { label: "Schools covered", value: fmtInt(9149), sub: "Across 26 districts" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white px-5 py-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--ap-navy)]">{s.value}</div>
            <div className="text-sm font-medium text-zinc-700 mt-0.5">{s.label}</div>
            <div className="text-xs text-zinc-500">{s.sub}</div>
          </div>
        ))}
      </section>

      {/* Three pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Brain className="h-7 w-7 text-[color:var(--ap-navy)]" />,
            title: "Hyper-early detection",
            body: "XGBoost model trained on attendance, academic performance, and socio-economic signals. Identifies risk 2–3 months before likely dropout. SHAP explanations per student — no black box.",
          },
          {
            icon: <Shield className="h-7 w-7 text-[color:var(--ap-orange)]" />,
            title: "GenAI counsellor assist",
            body: "Claude-generated parent SMS scripts and teacher conversation guides — bilingual (English + Telugu). Scheme eligibility automatically surfaced for each flagged student.",
          },
          {
            icon: <RefreshCw className="h-7 w-7 text-[color:var(--ap-green)]" />,
            title: "Closed-loop retraining",
            body: "Every teacher intervention is logged. Outcome tracking feeds a monthly model refresh pipeline, so accuracy improves as the system is used. Human-in-the-loop by design.",
          },
        ].map((p) => (
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
          <h2 className="font-semibold text-zinc-800">Demo credentials</h2>
          <span className="text-xs bg-amber-100 text-amber-800 rounded px-2 py-0.5 ml-1">Hackathon demo only</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {credentials.map((c) => (
            <div key={c.role} className="rounded-lg bg-white border p-3 space-y-1.5">
              <div className="text-xs font-semibold text-[color:var(--ap-navy)] uppercase tracking-wide">{c.role}</div>
              <div className="text-xs text-zinc-700 font-mono break-all">{c.email}</div>
              <div className="text-xs text-zinc-500">Password: <span className="font-mono text-zinc-700">{c.password}</span></div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          Each role shows a scoped dashboard — teacher sees their class, head master sees their school, district officer sees NTR district, RTGS admin sees state-wide view.
        </p>
      </section>

      {/* Architecture note */}
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold text-zinc-900 mb-3">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
          {[
            { step: "1", label: "Raw data ingested", sub: "FIN_YEAR + School Location" },
            { step: "→", label: "", sub: "" },
            { step: "2", label: "Features + XGBoost", sub: "SHAP explanations, tier assignment" },
            { step: "→", label: "", sub: "" },
            { step: "3", label: "Role dashboards", sub: "Teacher → HM → District → RTGS" },
          ].map((s, i) => (
            s.step === "→" ? (
              <div key={i} className="flex items-center justify-center text-zinc-400 text-lg font-light">→</div>
            ) : (
              <div key={i} className="rounded-lg border bg-zinc-50 p-3">
                <div className="text-lg font-bold text-[color:var(--ap-navy)]">{s.step}</div>
                <div className="font-semibold text-zinc-800 mt-1">{s.label}</div>
                <div className="text-zinc-500 mt-0.5">{s.sub}</div>
              </div>
            )
          ))}
        </div>
      </section>
    </div>
  );
}
