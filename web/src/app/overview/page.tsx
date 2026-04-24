import { getMetrics } from "@/lib/data";
import MetricCard from "@/components/MetricCard";
import PRCurve from "@/components/PRCurve";
import ImportanceBar from "@/components/ImportanceBar";
import { fmtInt, pctFormat } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, Database, Layers, ShieldCheck, Lock, Eye, Users } from "lucide-react";

export default async function OverviewPage() {
  const m = await getMetrics();
  const t = m.test_oot;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Model performance & system overview</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Trained on 2023-24 (408K students, 6,536 dropouts). Evaluated out-of-time on 2024-25 (395K students, 5,186 dropouts).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Recall" value={pctFormat(t.recall, 1)} sub="Share of dropouts caught" tone={t.recall >= 0.80 ? "good" : "warn"} info="True positive rate: share of actual dropouts correctly flagged. RTGS criterion: exclusion error <20% requires recall >80%. Primary success gate for this PoC." />
        <MetricCard label="Precision" value={pctFormat(t.precision, 1)} sub="Of flagged, how many are real" tone={t.precision >= 0.20 ? "good" : "warn"} info="Of all students flagged at-risk, the fraction who are true dropouts. RTGS criterion: inclusion error <80% means precision must exceed 20%. Teachers de-escalate false positives easily." />
        <MetricCard label="PR-AUC" value={t.pr_auc.toFixed(3)} sub="Model ranking quality" info="Area under Precision-Recall curve. Robust to class imbalance (only 1.3% of students drop out). Higher = better at ranking true dropouts above non-dropouts at any threshold." />
        <MetricCard label="ROC-AUC" value={t.roc_auc.toFixed(3)} sub="Overall separability" info="Area under ROC curve. Measures overall ability to separate dropouts from non-dropouts. 0.5 = random baseline, 1.0 = perfect. Complementary to PR-AUC for imbalanced data." />
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1.5">
          <div className="font-semibold text-amber-900">PoC operating-point trade-off</div>
          <div className="text-amber-800 leading-relaxed">
            At recall 80%, the model flags {fmtInt(t.tp + t.fp)} students, of whom {fmtInt(t.tp)} ({pctFormat(t.precision, 1)}) are true dropouts.
            Given the asymmetric cost of <em>missing</em> a dropout, this is operationally defensible — teachers de-escalate easily; a missed dropout cannot be recovered.
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Student risk tiers (2024-25)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-red-700 font-medium">Critical</div>
            <div className="text-2xl font-semibold text-red-900">{fmtInt(m.tier_counts.Critical)}</div>
            <div className="text-xs text-red-700">risk ≥ 85%</div>
          </div>
          <div className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-orange-700 font-medium">High</div>
            <div className="text-2xl font-semibold text-orange-900">{fmtInt(m.tier_counts.High)}</div>
            <div className="text-xs text-orange-700">risk 65–85%</div>
          </div>
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-yellow-700 font-medium">Medium</div>
            <div className="text-2xl font-semibold text-yellow-900">{fmtInt(m.tier_counts.Medium)}</div>
            <div className="text-xs text-yellow-700">risk 51–65%</div>
          </div>
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-emerald-700 font-medium">Low</div>
            <div className="text-2xl font-semibold text-emerald-900">{fmtInt(m.tier_counts.Low)}</div>
            <div className="text-xs text-emerald-700">below threshold</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-800 mb-2">Precision–Recall curve (2024-25 OOT)</h3>
          <PRCurve precision={m.pr_curve.precision} recall={m.pr_curve.recall} operatingRecall={t.recall} operatingPrecision={t.precision} />
          <p className="text-xs text-zinc-500 mt-2">
            Orange dot = current operating point (threshold {m.threshold_current.toFixed(4)}). Department can shift this dial in real-time.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-800 mb-2">Top feature importances</h3>
          <ImportanceBar data={m.feature_importance} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3 flex items-center gap-2">
          Fairness audit by subgroup <Info className="h-4 w-4 text-zinc-400" />
        </h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600 border-b border-zinc-200">
                <th className="py-2 pr-4 font-medium">Group</th>
                <th className="py-2 px-4 font-medium text-right">Students</th>
                <th className="py-2 px-4 font-medium text-right">Dropouts</th>
                <th className="py-2 px-4 font-medium text-right">Recall</th>
                <th className="py-2 px-4 font-medium text-right">Precision</th>
              </tr>
            </thead>
            <tbody>
              {m.fairness.map((row) => (
                <tr key={row.group} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-medium text-zinc-800">{row.group}</td>
                  <td className="py-2 px-4 text-right tabular-nums text-zinc-700">{fmtInt(row.n)}</td>
                  <td className="py-2 px-4 text-right tabular-nums text-zinc-700">{fmtInt(row.pos)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {row.recall === null ? "—" : (
                      <span className={row.recall >= 0.75 ? "text-emerald-700" : "text-amber-700"}>
                        {pctFormat(row.recall, 1)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-zinc-700">
                    {row.precision === null ? "—" : pctFormat(row.precision, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multimodal Data Fusion */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-800 mb-1 flex items-center gap-2">
          <Layers className="h-4 w-4 text-[color:var(--ap-navy)]" />
          Multimodal data fusion architecture
        </h3>
        <p className="text-xs text-zinc-500 mb-4">Four government data streams fused into a single risk signal per student — no single source is sufficient alone.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { icon: "📋", source: "School Education Dept", fields: "Attendance (daily), FA/SA marks, grade, class, school code", color: "border-blue-200 bg-blue-50" },
            { icon: "🏠", source: "GSWS Household Survey", fields: "Parent literacy, family income bracket, social category (OC/BC/SC/ST), migration flag", color: "border-purple-200 bg-purple-50" },
            { icon: "🪪", source: "Civil Supplies Dept", fields: "Ration card status — proxy for economic vulnerability & seasonal migration patterns", color: "border-amber-200 bg-amber-50" },
            { icon: "🚌", source: "Samagra Shiksha", fields: "Transport allowance eligibility — distance-to-school barrier indicator", color: "border-emerald-200 bg-emerald-50" },
          ].map((d) => (
            <div key={d.source} className={`rounded-lg border p-3 ${d.color}`}>
              <div className="text-2xl mb-1">{d.icon}</div>
              <div className="text-xs font-semibold text-zinc-800 mb-1">{d.source}</div>
              <div className="text-[11px] text-zinc-600 leading-relaxed">{d.fields}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-px flex-1 bg-zinc-200" />
          <div className="rounded-lg border-2 border-[color:var(--ap-navy)] bg-[color:var(--ap-navy)] text-white px-4 py-2 text-xs font-semibold flex items-center gap-2">
            <Database className="h-3.5 w-3.5" />
            XGBoost + SHAP explainer
          </div>
          <div className="h-px flex-1 bg-zinc-200" />
          <div className="flex gap-2 flex-wrap">
            {["Risk score (0–1)", "Top-3 SHAP drivers", "Bilingual explanation", "Intervention prompt"].map(o => (
              <span key={o} className="rounded-full bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 px-2.5 py-1">{o}</span>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 mt-3 italic">
          Student identifiers are joined on hashed keys at ingest — raw Aadhaar numbers and names are never stored in the model pipeline or served in any API response.
        </p>
      </div>

      {/* Privacy & Compliance */}
      <div className="rounded-xl border border-emerald-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Data privacy & DPDP compliance posture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: <Lock className="h-4 w-4 text-emerald-600" />,
              title: "PII anonymisation at ingest",
              items: [
                "Aadhaar numbers hashed (SHA-256 + salt) at join stage — raw Aadhaar never enters model pipeline",
                "Student names not stored in any JSON served to browser",
                "Child SNO used as opaque identifier throughout",
              ],
            },
            {
              icon: <Eye className="h-4 w-4 text-blue-600" />,
              title: "Role-scoped data access",
              items: [
                "Teachers see only their school's roster — no cross-school leakage",
                "HMs see school-wide; District Officers see mandal aggregates only",
                "No student-level PII exposed at district or RTGS layer",
              ],
            },
            {
              icon: <Users className="h-4 w-4 text-purple-600" />,
              title: "Human-in-the-loop by design",
              items: [
                "All interventions require explicit teacher sign-off — model never auto-acts",
                "SHAP explanations ensure every flag is interpretable and contestable",
                "Intervention log creates audit trail for accountability",
              ],
            },
          ].map((block) => (
            <div key={block.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                {block.icon}
                <div className="text-xs font-semibold text-zinc-800">{block.title}</div>
              </div>
              <ul className="space-y-1.5">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-[11px] text-zinc-600 leading-relaxed">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 mt-3">
          Aligned with Digital Personal Data Protection Act 2023 (DPDP). Production deployment would use AP State Data Centre secure enclave with data residency in Amaravati.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 flex gap-3 items-start">
        <CheckCircle2 className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-600 space-y-1 leading-relaxed">
          <div className="font-semibold text-zinc-800">Data transparency</div>
          <div>{m.note}</div>
        </div>
      </div>
    </div>
  );
}
