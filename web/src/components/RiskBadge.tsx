"use client";
import { TIER_COLORS, type RiskTier } from "@/lib/types";
import { useLang, T } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function RiskBadge({ tier, size = "sm" }: { tier: RiskTier; size?: "sm" | "md" | "lg" }) {
  const { lang } = useLang();
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", TIER_COLORS[tier], sizes[size])}>
      {T.tier[tier][lang]}
    </span>
  );
}
