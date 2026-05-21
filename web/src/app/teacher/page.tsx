import { getSchools, getSchool } from "@/lib/data";
import TeacherView from "./TeacherView";
import type { School } from "@/lib/types";

const DEMO_TEACHER_SCHOOL_ID = 28161790952;

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year = "2024-25" } = await searchParams;
  const [schools, school] = await Promise.all([
    getSchools(year),
    getSchool(DEMO_TEACHER_SCHOOL_ID, year),
  ]);
  const flaggedIds = school ? [school.school_id] : [];
  const flaggedSet = new Set(flaggedIds);
  const flaggedSchools: School[] = schools
    .filter((s) => flaggedSet.has(s.school_id))
    .sort((a, b) => b.n_flagged - a.n_flagged);
  return <TeacherView schools={flaggedSchools} academicYear={year} />;
}
