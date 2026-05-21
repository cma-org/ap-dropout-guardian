import { getSchools, getMandals, getMetrics } from "@/lib/data";
import RTGSDashboard from "./RTGSDashboard";

export default async function RTGSPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year = "2024-25" } = await searchParams;
  const [schools, mandals, metrics] = await Promise.all([
    getSchools(year),
    getMandals(year),
    getMetrics(),
  ]);
  return <RTGSDashboard schools={schools} mandals={mandals} metrics={metrics} />;
}
