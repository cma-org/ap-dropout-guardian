import { cn } from "@/lib/utils";
import InfoTooltip from "./InfoTooltip";

export default function MetricCard({
  label,
  value,
  sub,
  tone = "default",
  info,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
  info?: string;
}) {
  const tones = {
    default: "border-zinc-200 bg-white",
    good: "border-emerald-300 bg-emerald-50",
    warn: "border-amber-300 bg-amber-50",
    bad: "border-red-300 bg-red-50",
  } as const;
  return (
    <div className={cn("rounded-xl border px-5 py-4 shadow-sm", tones[tone])}>
      <div className="flex items-center gap-1 mb-1">
        <div className="text-xs uppercase tracking-wide text-zinc-500 font-medium flex-1">{label}</div>
        {info && <InfoTooltip text={info} />}
      </div>
      <div className="text-3xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="text-xs text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
}
