import { getMetrics } from "@/lib/data";
import MetricCard from "@/components/MetricCard";
import PRCurve from "@/components/PRCurve";
import ImportanceBar from "@/components/ImportanceBar";
import { fmtInt, pctFormat } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

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
        <MetricCard label="Recall" value={pctFormat(t.recall, 1)} sub="Share of dropouts caught" tone={t.recall >= 0.80 ? "good" : "warn"} />
        <MetricCard label="Precision" value={pctFormat(t.precision, 1)} sub="Of flagged, how many are real" tone={t.precision >= 0.20 ? "good" : "warn"} />
        <MetricCard label="PR-AUC" value={t.pr_auc.toFixed(3)} sub="Model ranking quality" />
        <MetricCard label="ROC-AUC" value={t.roc_auc.toFixed(3)} sub="Overall separability" />
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
