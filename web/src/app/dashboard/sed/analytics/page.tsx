import { getSchools } from "@/lib/data";
import SEDAnalyticsView from "./SEDAnalyticsView";
import { Suspense } from "react";

export default async function SEDAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year = "2024-25" } = await searchParams;
  const schools = await getSchools(year);
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading state analytics…</div>}>
      <SEDAnalyticsView schools={schools ?? []} academicYear={year} />
    </Suspense>
  );
}
