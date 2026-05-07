import HMDataView from "./HMDataView";
import { getSchools, getMetrics } from "@/lib/data";

export default async function HMDataPage() {
  const [schools, metrics] = await Promise.all([getSchools(), getMetrics()]);
  return <HMDataView schools={schools} metrics={metrics} />;
}
