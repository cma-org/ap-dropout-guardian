"use client";
import { fmtInt, pctFormat } from "@/lib/utils";

interface Props {
  tp: number; fp: number;
  fn: number; tn: number;
}

export default function ConfusionMatrix({ tp, fp, fn, tn }: Props) {
  const total = tp + fp + fn + tn;
  const tpr  = tp / (tp + fn);   // Recall / Sensitivity
  const tnr  = tn / (tn + fp);   // Specificity
  const fpr  = fp / (tn + fp);   // Fall-out
  const fnr  = fn / (tp + fn);   // Miss rate

  const cell = (
    value: number,
    label: string,
    sub: string,
    bg: string,
    textMain: string,
    textSub: string,
  ) => (
    <div className={`rounded-xl p-4 flex flex-col gap-1 ${bg}`}>
      <div className={`text-2xl font-black tabular-nums ${textMain}`}>{fmtInt(value)}</div>
      <div className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{label}</div>
      <div className="text-[10px] text-zinc-400 leading-tight">{sub}</div>
      <div className={`text-xs font-semibold mt-0.5 ${textSub}`}>
        {pctFormat(value / total, 1)} of total
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 2×2 matrix */}
      <div className="grid grid-cols-2 gap-3">
        {cell(tp, "True Positive", "Dropout correctly flagged",      "bg-emerald-50 border border-emerald-200", "text-emerald-800", "text-emerald-600")}
        {cell(fp, "False Positive", "Safe student wrongly flagged",   "bg-amber-50 border border-amber-200",     "text-amber-800",   "text-amber-600")}
        {cell(fn, "False Negative", "Dropout missed — highest cost",  "bg-red-50 border border-red-200",         "text-red-800",     "text-red-600")}
        {cell(tn, "True Negative", "Safe student correctly cleared",  "bg-zinc-50 border border-zinc-200",       "text-zinc-800",    "text-zinc-500")}
      </div>

      {/* Derived rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          { label: "Recall (TPR)",     value: pctFormat(tpr, 1), color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Specificity",      value: pctFormat(tnr, 1), color: "text-zinc-700",    bg: "bg-zinc-50" },
          { label: "Fall-out (FPR)",   value: pctFormat(fpr, 1), color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Miss rate (FNR)",  value: pctFormat(fnr, 1), color: "text-red-700",     bg: "bg-red-50" },
        ].map(r => (
          <div key={r.label} className={`rounded-lg px-3 py-2 ${r.bg} border border-zinc-100`}>
            <div className={`text-lg font-black tabular-nums ${r.color}`}>{r.value}</div>
            <div className="text-[10px] text-zinc-500 font-medium">{r.label}</div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Evaluated on 2024-25 out-of-time test set · {fmtInt(total)} students ·
        {" "}False negatives (missed dropouts) carry the highest operational cost — RTGS criterion requires FNR &lt; 20%.
      </p>
    </div>
  );
}
