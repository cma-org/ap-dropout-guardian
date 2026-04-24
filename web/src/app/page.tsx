import { getMetrics } from "@/lib/data";
import LandingClient from "@/components/LandingClient";

export default async function LandingPage() {
  const m = await getMetrics();
  const t = m.test_oot;
  return (
    <LandingClient
      recall={t.recall}
      precision={t.precision}
      criticalCount={m.tier_counts.Critical}
    />
  );
}
