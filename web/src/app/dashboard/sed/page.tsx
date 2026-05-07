import { getSchools, getMandals, getMetrics } from "@/lib/data";
import RTGSDashboard from "../rtgs/RTGSDashboard";

export default async function SEDPage() {
  const [schools, mandals, metrics] = await Promise.all([
    getSchools(),
    getMandals(),
    getMetrics(),
  ]);
  return <RTGSDashboard schools={schools} mandals={mandals} metrics={metrics} />;
}
