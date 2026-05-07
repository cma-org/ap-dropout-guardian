import DistrictDataView from "./DistrictDataView";
import { getSchools, getMandals, getMetrics } from "@/lib/data";

export default async function DistrictDataPage() {
  const [schools, mandals, metrics] = await Promise.all([getSchools(), getMandals(), getMetrics()]);
  return <DistrictDataView schools={schools} mandals={mandals} metrics={metrics} />;
}
