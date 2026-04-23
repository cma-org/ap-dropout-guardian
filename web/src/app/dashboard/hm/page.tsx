import { getRoster, getSchools } from "@/lib/data";
import HMDashboard from "./HMDashboard";

const DEMO_SCHOOL_ID = 28161790952;

export default async function HMPage() {
  const [roster, schools] = await Promise.all([
    getRoster(DEMO_SCHOOL_ID),
    getSchools(),
  ]);
  const school = schools.find((s) => s.school_id === DEMO_SCHOOL_ID) ?? null;
  return <HMDashboard roster={roster ?? []} school={school} />;
}
