import { getSchools } from "@/lib/data";
import DistrictSchoolsView from "./DistrictSchoolsView";
import { Suspense } from "react";

export default async function DistrictSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; id?: string }>;
}) {
  const { year = "2024-25" } = await searchParams;
  const schools = await getSchools(year);
  const ntrSchools = schools.filter((s) => s.district_name === "NTR");
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading school browser...</div>}>
      <DistrictSchoolsView schools={ntrSchools} academicYear={year} />
    </Suspense>
  );
}
