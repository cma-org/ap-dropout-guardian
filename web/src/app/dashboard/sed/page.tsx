import { getSchools, getMandals, getMetrics } from "@/lib/data";
import RTGSDashboard from "../rtgs/RTGSDashboard";

export default async function SEDPage({
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
