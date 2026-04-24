import { getSchools } from "@/lib/data";
import DistrictAnalyticsView from "./DistrictAnalyticsView";
import { Suspense } from "react";

export default async function DistrictAnalyticsPage() {
  const schools = await getSchools();
  // Filter for NTR district as in the main district dashboard
  const ntrSchools = schools.filter((s) => s.district_name === "NTR");
  
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading district analytics...</div>}>
      <DistrictAnalyticsView schools={ntrSchools} />
    </Suspense>
  );
}
