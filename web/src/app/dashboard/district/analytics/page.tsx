import { getDistrictAnalytics } from "@/lib/data";
import { Suspense } from "react";
import DistrictAnalyticsView from "./DistrictAnalyticsView";

export default async function DistrictAnalyticsPage() {
  const data = await getDistrictAnalytics("NTR");
  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-400"><div className="animate-pulse space-y-4"><div className="h-8 bg-zinc-100 rounded w-64 mx-auto" /><div className="h-4 bg-zinc-100 rounded w-96 mx-auto" /></div></div>}>
      <DistrictAnalyticsView data={data} />
    </Suspense>
  );
}
