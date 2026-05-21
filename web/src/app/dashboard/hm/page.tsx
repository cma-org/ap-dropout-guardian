import { getRoster, getSchools } from "@/lib/data";
import HMDashboard from "./HMDashboard";

const DEMO_SCHOOL_ID = 28161790952;

export default async function HMPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year = "2024-25" } = await searchParams;
  const [roster, schools] = await Promise.all([
    getRoster(DEMO_SCHOOL_ID, year),
    getSchools(year),
  ]);
  const school = schools.find((s) => s.school_id === DEMO_SCHOOL_ID) ?? null;
  return <HMDashboard roster={roster ?? []} school={school} academicYear={year} />;
}
