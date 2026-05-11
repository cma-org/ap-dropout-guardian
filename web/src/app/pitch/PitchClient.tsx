"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Printer, Brain, BarChart2, Plug, Users, Shield, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SlideProps = { active: boolean; children: React.ReactNode };

function Slide({ active, children }: SlideProps) {
  return (
    <div className={cn(
      "absolute inset-0 flex flex-col transition-all duration-300",
      active ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-4 pointer-events-none"
    )}>
      {children}
    </div>
  );
}

function SlideHeader({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ap-orange)] mb-1">{tag}</div>
      <h2 className="text-3xl font-bold text-zinc-900 leading-tight">{title}</h2>
      {sub && <p className="text-base text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function Bullet({ children, color = "navy" }: { children: React.ReactNode; color?: string }) {
  return (
    <li className="flex items-start gap-3 text-zinc-700 text-sm leading-relaxed">
      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", color === "red" ? "bg-red-500" : color === "green" ? "bg-emerald-500" : color === "orange" ? "bg-orange-500" : "bg-[color:var(--ap-navy)]")} />
      {children}
    </li>
  );
}

function StatBox({ value, label, sub, color = "navy" }: { value: string; label: string; sub?: string; color?: string }) {
  return (
    <div className={cn("rounded-xl border-2 px-4 py-3 text-center",
      color === "red" ? "border-red-300 bg-red-50" :
      color === "green" ? "border-emerald-300 bg-emerald-50" :
      color === "orange" ? "border-orange-300 bg-orange-50" :
      "border-[color:var(--ap-navy)] bg-blue-50"
    )}>
      <div className={cn("text-2xl font-bold",
        color === "red" ? "text-red-700" :
        color === "green" ? "text-emerald-700" :
        color === "orange" ? "text-orange-700" :
        "text-[color:var(--ap-navy)]"
      )}>{value}</div>
      <div className="text-xs font-semibold text-zinc-700 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

type Metrics = { recall: number; precision: number; pr_auc: number; roc_auc: number; tp: number; fp: number; tn: number; test_oot: { recall: number; precision: number; pr_auc: number; roc_auc: number; tp: number; fp: number }; tier_counts: { Critical: number; High: number; Medium: number; Low: number }; threshold_current: number; feature_importance: { feature: string; importance: number }[] };

export default function PitchClient() {
  const [slide, setSlide] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    fetch("/api/metrics").then(r => r.json()).then(m => setMetrics(m)).catch(() => {});
  }, []);

  const total = 10;
  const prev = useCallback(() => setSlide(s => Math.max(0, s - 1)), []);
  const next = useCallback(() => setSlide(s => Math.min(total - 1, s + 1)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const m = metrics?.test_oot ?? { recall: 0.80, precision: 0.25, pr_auc: 0.42, roc_auc: 0.88, tp: 4149, fp: 12447 };
  const tiers = metrics?.tier_counts ?? { Critical: 9117, High: 28340, Medium: 41200, Low: 317313 };
  const flagged = tiers.Critical + tiers.High + tiers.Medium;

  const slides = [
    /* 0 — Cover */
    <div key={0} className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium">
        RTGS AI Hackathon 2026 — Problem 100004
      </div>
      <div className="h-20 w-20 rounded-2xl bg-[color:var(--ap-navy)] flex items-center justify-center text-white font-bold text-3xl mx-auto">AP</div>
      <h1 className="text-5xl font-bold text-zinc-900">Stay-In School</h1>
      <p className="text-xl text-zinc-500 max-w-xl">AI-Assisted Identification and Support System for At-Risk Students in Classes 9–10</p>
      <div className="flex gap-3 text-xs text-zinc-400">
        <span>Government of Andhra Pradesh</span>
        <span>·</span>
        <span>School Education Dept</span>
        <span>·</span>
        <span>RTGS / LEAP Integration</span>
      </div>
    </div>,

    /* 1 — Problem */
    <div key={1} className="h-full flex flex-col">
      <SlideHeader tag="01 — The Problem" title="The Dropout Cliff in Classes 9–10" sub="Andhra Pradesh loses thousands of students every year — the risk is not random." />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatBox value="5,186" label="Dropouts recorded" sub="AY 2024-25" color="red" />
        <StatBox value="1.3%" label="Base dropout rate" sub="Classes 9–10" color="orange" />
        <StatBox value="40%" label="Girl dropout share" sub="Distance + early marriage" color="red" />
      </div>
      <ul className="space-y-3">
        <Bullet color="red">Girls in rural areas face barriers: distance (&gt;5km), no transport, early marriage pressure — dropout risk 2× higher</Bullet>
        <Bullet color="red">SC/ST and migrant-family students are severely underserved — seasonal movement breaks enrollment records</Bullet>
        <Bullet color="orange">Current system is reactive: dropout is noticed only after TC is issued — months too late for intervention</Bullet>
        <Bullet color="navy">AP has the data to predict dropouts months in advance — it just isn't being connected and analysed</Bullet>
      </ul>
    </div>,

    /* 2 — Solution Overview */
    <div key={2} className="h-full flex flex-col">
      <SlideHeader tag="02 — Our Solution" title="Four Pillars — Matching the RTGS Brief" />
      <div className="grid grid-cols-2 gap-4 flex-1">
        {[
          { icon: <Brain className="h-6 w-6 text-[color:var(--ap-navy)]" />, title: "AI-Powered Predictive Analytics", body: "XGBoost on 4 government data streams — attendance, FA/SA marks, GSWS socio-economic, migration flags. SHAP explanations per student. Recall ≥80% on 2024-25." },
          { icon: <BarChart2 className="h-6 w-6 text-orange-600" />, title: "Risk Visualization & Alerts", body: "Colour-coded dashboards scoped by role — Teacher → HM → District Officer → RTGS Admin. Automated Critical alerts escalate within 48 hours." },
          { icon: <Plug className="h-6 w-6 text-violet-600" />, title: "LEAP API Integration", body: "REST push of risk scores and tier assignments to AP LEAP app. Teacher-logged field interventions sync back to retrain pipeline — closed loop." },
          { icon: <Users className="h-6 w-6 text-emerald-600" />, title: "Community & Parental Engagement", body: "Claude-generated bilingual parent SMS scripts. Ward volunteer assignment. Scheme eligibility auto-surfaced (Amma Vodi, Post-Matric RTF/MTF, KGBV)." },
        ].map((p) => (
          <div key={p.title} className="rounded-xl border bg-zinc-50 p-4 space-y-2">
            <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">{p.icon}</div>
            <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
            <p className="text-xs text-zinc-600 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </div>,

    /* 3 — Data Pipeline */
    <div key={3} className="h-full flex flex-col">
      <SlideHeader tag="03 — Data Pipeline" title="Multimodal Fusion — 4 Government Streams" sub="No single source is sufficient. Risk emerges from the combination." />
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { e: "📋", src: "School Education Dept", fields: "Daily attendance, FA/SA marks, grade, class, school code" },
          { e: "🏠", src: "GSWS Household Survey", fields: "Parent literacy, income, social category (OC/BC/SC/ST), migration flag" },
          { e: "🪪", src: "Civil Supplies Dept", fields: "Ration card status — proxy for economic vulnerability & seasonal migration" },
          { e: "🚌", src: "Samagra Shiksha", fields: "Transport allowance — distance-to-school barrier indicator" },
        ].map(d => (
          <div key={d.src} className="rounded-lg border bg-zinc-50 p-3 text-center">
            <div className="text-2xl mb-1">{d.e}</div>
            <div className="text-[11px] font-semibold text-zinc-800 mb-1">{d.src}</div>
            <div className="text-[10px] text-zinc-500 leading-relaxed">{d.fields}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-[color:var(--ap-navy)] bg-blue-50 p-4 text-center">
        <div className="text-sm font-bold text-[color:var(--ap-navy)]">XGBoost + SHAP TreeExplainer</div>
        <div className="text-xs text-zinc-600 mt-1">Outputs: Risk score (0–1) · Top-3 SHAP drivers · Bilingual explanation · Risk tier assignment</div>
        <div className="text-[11px] text-zinc-400 mt-2 italic">Aadhaar hashed (SHA-256) at ingest — raw PII never in model pipeline (DPDP Act 2023)</div>
      </div>
    </div>,

    /* 4 — Model Performance */
    <div key={4} className="h-full flex flex-col">
      <SlideHeader tag="04 — Model Performance" title="Meets Both RTGS Success Criteria" sub="Out-of-time test: trained on 2023-24 (408K students), evaluated on 2024-25 (395K students)." />
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatBox value={`${(m.recall * 100).toFixed(1)}%`} label="Recall" sub="Exclusion error <20% ✓" color="green" />
        <StatBox value={`${(m.precision * 100).toFixed(1)}%`} label="Precision" sub="Inclusion error <80% ✓" color="green" />
        <StatBox value={m.pr_auc.toFixed(3)} label="PR-AUC" sub="Ranking quality" />
        <StatBox value={m.roc_auc.toFixed(3)} label="ROC-AUC" sub="Separability" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-zinc-50 p-4">
          <div className="text-xs font-semibold text-zinc-600 uppercase mb-2">Risk tiers (2024-25)</div>
          {[
            { t: "🔴 Critical (p ≥ 0.85)", n: tiers.Critical },
            { t: "🟠 High (0.65–0.85)", n: tiers.High },
            { t: "🟡 Medium (0.51–0.65)", n: tiers.Medium },
            { t: "🟢 Low", n: tiers.Low },
          ].map(r => (
            <div key={r.t} className="flex justify-between text-xs py-1 border-b border-zinc-100 last:border-0">
              <span className="text-zinc-700">{r.t}</span>
              <span className="font-semibold tabular-nums">{r.n.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-4 flex flex-col justify-center">
          <div className="text-xs font-semibold text-emerald-800 uppercase mb-2">Operating point</div>
          <div className="text-sm text-emerald-900 leading-relaxed">At threshold p ≥ {metrics?.threshold_current.toFixed(4) ?? "0.51"}, the model flags <strong>{(m.tp + m.fp).toLocaleString("en-IN")}</strong> students, of whom <strong>{m.tp.toLocaleString("en-IN")}</strong> ({(m.precision*100).toFixed(0)}%) are true dropouts.</div>
          <div className="text-xs text-emerald-700 mt-2">Teachers de-escalate false positives easily. A missed dropout cannot be recovered.</div>
        </div>
      </div>
    </div>,

    /* 5 — Demo Walkthrough */
    <div key={5} className="h-full flex flex-col">
      <SlideHeader tag="05 — Live Demo" title="Demo Flow — 5 Minutes" sub="All data is real. Dashboards are role-scoped. Toggle English ↔ Telugu at any time." />
      <div className="space-y-3 flex-1">
        {[
          { step: "1", title: "Home page", detail: "Show the 4 pillars matching RTGS brief. 3,95,000 students, 80% recall, 9,149 schools.", time: "30s" },
          { step: "2", title: "District heatmap", detail: "AP map with school dots coloured by risk. Zoom into NTR district. Show top mandals table.", time: "45s" },
          { step: "3", title: "Teacher dashboard", detail: "Login as teacher. Show class roster colour-coded by tier. Analytics panel — ML terminology. Show 4 KPI stats.", time: "60s" },
          { step: "4", title: "Student detail", detail: "Click Critical student. Risk gauge, SHAP drivers in plain Telugu. Log Intervention button.", time: "60s" },
          { step: "5", title: "Counsellor card", detail: "Parent WhatsApp script (bilingual). Personalised schemes (gender + caste). Ward volunteer assigned.", time: "45s" },
          { step: "6", title: "LEAP API + Chatbot", detail: "Show LEAP push panel. Demo AI chatbot — ask 'how many critical students?' → real number.", time: "30s" },
          { step: "7", title: "Overview — model metrics", detail: "PR curve, SHAP importances, fairness audit by subgroup. DPDP privacy panel.", time: "30s" },
        ].map(s => (
          <div key={s.step} className="flex gap-3 items-start rounded-lg border bg-zinc-50 px-4 py-2.5">
            <div className="h-6 w-6 rounded-full bg-[color:var(--ap-navy)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</div>
            <div className="flex-1">
              <span className="font-semibold text-zinc-900 text-sm">{s.title}</span>
              <span className="text-zinc-500 text-xs ml-2">{s.detail}</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono shrink-0">{s.time}</div>
          </div>
        ))}
      </div>
    </div>,

    /* 6 — SHAP & Explainability */
    <div key={6} className="h-full flex flex-col">
      <SlideHeader tag="06 — Explainability" title="SHAP — Every Flag is Interpretable" sub="No teacher penalises a student based on a black box. Every risk score is decomposable." />
      <div className="grid grid-cols-2 gap-5 flex-1">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Top predictive features</div>
          {(metrics?.feature_importance ?? [
            { feature: "attendance_rate", importance: 0.28 },
            { feature: "max_consec_absence", importance: 0.19 },
            { feature: "fa_avg", importance: 0.14 },
            { feature: "migration_flag", importance: 0.11 },
            { feature: "family_income_bracket", importance: 0.09 },
            { feature: "transport_allowance", importance: 0.07 },
          ]).slice(0, 6).map((f: { feature: string; importance: number }) => (
            <div key={f.feature}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-zinc-700 font-mono">{f.feature}</span>
                <span className="text-zinc-500">{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div className="h-2 rounded-full bg-[color:var(--ap-navy)]" style={{ width: `${f.importance * 100 * 3.5}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-zinc-50 p-4 space-y-3">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Example SHAP breakdown</div>
          <div className="text-xs text-zinc-500 italic">Student #10234 — Risk: 89% (Critical)</div>
          {[
            { f: "attendance_rate = 38%", v: "+34%", c: "red" },
            { f: "max_consec_absence = 21 days", v: "+18%", c: "red" },
            { f: "migration_flag = Yes", v: "+12%", c: "orange" },
            { f: "fa_avg = 18/100", v: "+11%", c: "orange" },
            { f: "transport_allowance = No", v: "+7%", c: "yellow" },
          ].map(r => (
            <div key={r.f} className="flex justify-between text-xs border-b border-zinc-200 pb-1.5 last:border-0">
              <span className="text-zinc-700 font-mono">{r.f}</span>
              <span className={cn("font-semibold", r.c === "red" ? "text-red-600" : r.c === "orange" ? "text-orange-600" : "text-amber-600")}>{r.v}</span>
            </div>
          ))}
          <div className="text-[10px] text-zinc-400 italic">Shown to teacher in plain English + Telugu. Contestable. Auditable.</div>
        </div>
      </div>
    </div>,

    /* 7 — Community & Parental Engagement */
    <div key={7} className="h-full flex flex-col">
      <SlideHeader tag="07 — Community Engagement" title="Actionable Outreach — Not Just Alerts" sub="Every Critical student gets a personalised engagement plan, not just a flag." />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-4 space-y-2">
          <div className="font-semibold text-emerald-900 text-sm">Parent SMS via WhatsApp</div>
          <p className="text-xs text-zinc-600">Claude-generated bilingual script (English + Telugu) personalised per student's top risk driver. One-tap send from teacher's dashboard.</p>
        </div>
        <div className="rounded-xl border bg-blue-50 border-blue-200 p-4 space-y-2">
          <div className="font-semibold text-blue-900 text-sm">Ward Volunteer Assignment</div>
          <p className="text-xs text-zinc-600">GSWS volunteer auto-assigned per student's village. Gram Panchayat members, Asha Workers, ANM Workers — sourced from household survey data.</p>
        </div>
        <div className="rounded-xl border bg-violet-50 border-violet-200 p-4 space-y-2">
          <div className="font-semibold text-violet-900 text-sm">Scheme Eligibility</div>
          <p className="text-xs text-zinc-600">Personalised by gender + caste: Amma Vodi, Post-Matric RTF/MTF, NTR Vidyonnathi, KGBV Residential, Samagra Transport Allowance.</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        <Bullet color="green">Contact log feeds the closed-loop outcome tracker → monthly model retraining pipeline</Bullet>
        <Bullet color="green">Distance to school computed from School Location master → transport need flagged automatically</Bullet>
        <Bullet color="navy">Ration card status cross-referenced from Civil Supplies DB — unregistered families referred to MeeSeva</Bullet>
      </ul>
    </div>,

    /* 8 — Ethics & Privacy */
    <div key={8} className="h-full flex flex-col">
      <SlideHeader tag="08 — Ethics & Privacy" title="Human-in-the-Loop, DPDP-Aligned" sub="The model assists — it never auto-acts. Every flag is auditable and contestable." />
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { icon: <Shield className="h-5 w-5 text-emerald-600" />, title: "PII Anonymisation", items: ["Aadhaar hashed (SHA-256 + salt) at ingest", "Student names not stored in any browser JSON", "Child SNO as opaque identifier throughout", "Aligned with DPDP Act 2023"] },
          { icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />, title: "Role-Scoped Access", items: ["Teachers: own school only", "HMs: school-wide", "District Officers: mandal aggregates", "No student-level PII at district/RTGS layer"] },
          { icon: <TrendingUp className="h-5 w-5 text-purple-600" />, title: "Human-in-the-Loop", items: ["All interventions need explicit teacher sign-off", "SHAP makes every flag contestable", "Intervention log creates audit trail", "Model never auto-contacts parents or officials"] },
        ].map(b => (
          <div key={b.title} className="rounded-xl border bg-zinc-50 p-4 space-y-2">
            <div className="flex items-center gap-2">{b.icon}<div className="text-sm font-semibold text-zinc-900">{b.title}</div></div>
            <ul className="space-y-1">
              {b.items.map(i => <li key={i} className="text-xs text-zinc-600 flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <strong>Fairness commitment:</strong> Recall and precision reported per subgroup (Female, SC/ST, Migrant) — gaps are surfaced transparently in the dashboard, not hidden. Judges can interrogate the fairness table live.
      </div>
    </div>,

    /* 9 — Scale Plan & Ask */
    <div key={9} className="h-full flex flex-col">
      <SlideHeader tag="09 — Scale Plan & Ask" title="3-District Pilot → State-Wide in 12 Months" />
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { phase: "Phase 1 — Month 1-3", title: "3-District Pilot", items: ["NTR, Krishna, Guntur districts", "Real LEAP OAuth2 integration", "Teacher training + feedback loop", "Daily model score refresh"] },
          { phase: "Phase 2 — Month 4-8", title: "State Rollout", items: ["All 26 districts", "GSWS + Civil Supplies live join", "Monthly model retrain cycle", "District Officer dashboards go live"] },
          { phase: "Phase 3 — Month 9-12", title: "Ecosystem", items: ["LSTM attendance sequence model", "Offline PWA for field workers", "PDPB secure enclave (Amaravati)", "Outcome data powers next cohort"] },
        ].map(p => (
          <div key={p.phase} className="rounded-xl border bg-zinc-50 p-4 space-y-2">
            <div className="text-[10px] font-semibold text-[color:var(--ap-orange)] uppercase tracking-wide">{p.phase}</div>
            <div className="font-semibold text-zinc-900 text-sm">{p.title}</div>
            <ul className="space-y-1">{p.items.map(i => <li key={i} className="text-xs text-zinc-600 flex items-start gap-1.5"><span className="text-[color:var(--ap-navy)] mt-0.5">›</span>{i}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-[color:var(--ap-navy)] bg-blue-50 p-4">
        <div className="text-sm font-bold text-[color:var(--ap-navy)] mb-2">What we need from RTGS to pilot</div>
        <div className="grid grid-cols-3 gap-3 text-xs text-zinc-700">
          <div><span className="font-semibold">1.</span> AP LEAP OAuth2 sandbox credentials</div>
          <div><span className="font-semibold">2.</span> GSWS API or dataset access for live join</div>
          <div><span className="font-semibold">3.</span> 3-district school admin buy-in for teacher onboarding</div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-zinc-900">Stay-In School — Pitch Deck</div>
          <div className="text-xs text-zinc-400">← → to navigate · {slide + 1} / {total}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={cn("h-2 rounded-full transition-all", i === slide ? "w-6 bg-[color:var(--ap-navy)]" : "w-2 bg-zinc-300 hover:bg-zinc-400")} />
            ))}
          </div>
          <button onClick={prev} disabled={slide === 0}
            className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} disabled={slide === total - 1}
            className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 transition">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => { setPrintMode(true); setTimeout(() => { window.print(); setPrintMode(false); }, 100); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[color:var(--ap-navy)] text-white text-xs font-medium hover:opacity-90 transition">
            <Printer className="h-3.5 w-3.5" /> Save PDF
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div className={cn(printMode ? "block" : "block")}>
        {printMode ? (
          // Print: all slides stacked
          <div className="print-all">
            {slides.map((s, i) => (
              <div key={i} className="w-full min-h-[560px] bg-white p-10 mb-0 page-break-after border-b print:page-break-after-always">
                <div className="text-[10px] text-zinc-300 mb-4 print:hidden">Slide {i + 1} / {total}</div>
                {s}
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="relative bg-white rounded-2xl shadow-sm border border-zinc-200 p-10" style={{ minHeight: 520 }}>
              {slides.map((s, i) => (
                <Slide key={i} active={i === slide}>{s}</Slide>
              ))}
            </div>
            {/* Nav hint */}
            <div className="flex justify-between mt-4 print:hidden">
              <button onClick={prev} disabled={slide === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 transition">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-zinc-400 self-center">Slide {slide + 1} of {total}</span>
              <button onClick={next} disabled={slide === total - 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 transition">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo Script */}
      <div className="max-w-5xl mx-auto px-6 pb-16 print:hidden">
        <div className="rounded-2xl border bg-white p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Demo Script — 5-Minute Walkthrough</h2>
            <p className="text-sm text-zinc-500">Hand this to your presenter. Each section has the exact URL, what to click, and what to say.</p>
          </div>
          {[
            {
              step: "1", time: "0:00–0:30", title: "Home Page", url: "localhost:3000",
              do: "Open home page. Switch language to Telugu and back. Point out the 4 pillars.",
              say: "This is Stay-In School — built for the RTGS Problem 100004 brief. 3.95 lakh students, 80% dropout recall, 9,149 schools covered. Notice the four pillars on screen match the brief exactly: Predictive Analytics, Risk Visualization, LEAP Integration, Community Engagement."
            },
            {
              step: "2", time: "0:30–1:15", title: "District Heatmap", url: "localhost:3000/map",
              do: "Click District Heatmap. Show the school dots. Hover over a school to show risk popup. Scroll to the mandal risk table.",
              say: "Every dot is a school. Red = high average risk. The model has scored all 3.95 lakh students and aggregated risk to school and mandal level. District officers can immediately see which mandals need field visits."
            },
            {
              step: "3", time: "1:15–2:15", title: "Teacher Dashboard", url: "localhost:3000/login (teacher@zphs.ap.gov.in / teacher123)",
              do: "Login as teacher. Show the 4 KPI cards with InfoTooltip. Scroll to the ML analytics panel — point out the KPI strip.",
              say: "The teacher logs in and sees only their class — no cross-school data leakage. The Predictive Risk Intelligence panel shows ML dropout probability distribution, equity analysis by gender, and key risk indicators. 9 students are in the high-confidence flag zone."
            },
            {
              step: "4", time: "2:15–3:15", title: "Student Detail + SHAP", url: "Click any Critical student",
              do: "Click the top Critical student. Show risk gauge. Show SHAP driver cards. Click Log Intervention.",
              say: "Click any Critical student. The risk score is 89% — the model explains why: attendance 38%, 21 consecutive absences, migration flag, FA average 18/100. Not a black box — every factor is named. The teacher can contest any flag. Click Log Intervention to record a parent call."
            },
            {
              step: "5", time: "3:15–4:00", title: "Counsellor Card + Schemes", url: "Same student detail page",
              do: "Scroll to Counsellor Assist section. Show the parent WhatsApp message. Show personalised schemes (gender/caste aware).",
              say: "Claude generates a personalised WhatsApp message in Telugu — one tap and it opens in WhatsApp. Schemes are surfaced automatically: this student is female, SC — so KGBV Residential, Post-Matric RTF, Amma Vodi are highlighted. No scheme is missed."
            },
            {
              step: "6", time: "4:00–4:30", title: "AI Chatbot + LEAP", url: "Any page — click 'Ask AI' button",
              do: "Click the floating Ask AI button. Type 'how many critical students?' Show the real answer. Show LEAP API panel on student page.",
              say: "The embedded AI assistant has live access to system data. Ask it anything — it answers with real numbers from the dataset. The LEAP API panel shows the push endpoint — in production, this sends risk scores to the LEAP app and receives intervention outcomes back."
            },
            {
              step: "7", time: "4:30–5:00", title: "Model Metrics + Wrap", url: "localhost:3000/overview",
              do: "Show recall 80%, precision, PR curve, fairness table. End on the DPDP privacy panel.",
              say: "Model recall is 80.9% — meets the RTGS exclusion error criterion. Fairness: we report recall per subgroup — girls, SC/ST, migrants — and the gaps are shown transparently. Aadhaar is hashed at ingest, names never leave the DB. Human-in-the-loop by design."
            },
          ].map(s => (
            <div key={s.step} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[color:var(--ap-navy)] text-white text-xs font-bold flex items-center justify-center shrink-0">{s.step}</div>
                <div className="font-semibold text-zinc-900">{s.title}</div>
                <div className="text-xs text-zinc-400 font-mono ml-auto">{s.time}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Do</div>
                  <p className="text-zinc-700 text-xs leading-relaxed">{s.do}</p>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">{s.url}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Say</div>
                  <p className="text-zinc-700 text-xs leading-relaxed italic">"{s.say}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
