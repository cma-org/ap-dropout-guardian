import HMDataView from "./HMDataView";
import { getSchool, getMetrics } from "@/lib/data";

// Demo school ID — matches the HM account in auth.tsx
const DEMO_SCHOOL_ID = 28161790952;

export default async function HMDataPage() {
  const [school, metrics] = await Promise.all([
    getSchool(DEMO_SCHOOL_ID),
    getMetrics(),
  ]);
  return <HMDataView school={school} metrics={metrics} />;
}
