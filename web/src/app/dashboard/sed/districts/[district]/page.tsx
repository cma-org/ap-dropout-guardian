import { getSchools } from "@/lib/data";
import DistrictSchoolsView from "@/app/dashboard/district/schools/DistrictSchoolsView";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function SEDDistrictDetailPage({
  params,
}: {
  params: Promise<{ district: string }>;
}) {
  const { district } = await params;
  const districtName = decodeURIComponent(district);
  const allSchools = await getSchools();
  const districtSchools = (allSchools ?? []).filter(
    s => s.district_name === districtName
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/dashboard/sed/districts" className="hover:text-zinc-900 transition-colors">
          Districts
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-zinc-900">{districtName}</span>
        <span className="text-zinc-400 ml-1">· {districtSchools.length} schools</span>
      </nav>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
          Loading schools…
        </div>
      }>
        <DistrictSchoolsView schools={districtSchools} />
      </Suspense>
    </div>
  );
}
