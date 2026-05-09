import { getSchools } from "@/lib/data";
import SEDAnalyticsView from "./SEDAnalyticsView";
import { Suspense } from "react";

export default async function SEDAnalyticsPage() {
  const schools = await getSchools();
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading state analytics…</div>}>
      <SEDAnalyticsView schools={schools ?? []} />
    </Suspense>
  );
}
