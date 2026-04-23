import { getSchools, getFlaggedSchoolIds } from "@/lib/data";
import TeacherView from "./TeacherView";
import type { School } from "@/lib/types";

export const dynamic = "force-static";

export default async function TeacherPage() {
  const [schools, flaggedIds] = await Promise.all([getSchools(), getFlaggedSchoolIds()]);
  const flaggedSet = new Set(flaggedIds);
  const flaggedSchools: School[] = schools
    .filter((s) => flaggedSet.has(s.school_id))
    .sort((a, b) => b.n_flagged - a.n_flagged);
  return <TeacherView schools={flaggedSchools} />;
}
