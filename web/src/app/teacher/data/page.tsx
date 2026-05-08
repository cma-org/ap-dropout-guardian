import TeacherDataView from "./TeacherDataView";
import { getSchool, getMetrics } from "@/lib/data";

// Demo school ID — matches the teacher account in auth.tsx
const DEMO_SCHOOL_ID = 28161790952;

export default async function TeacherDataPage() {
  const [school, metrics] = await Promise.all([
    getSchool(DEMO_SCHOOL_ID),
    getMetrics(),
  ]);
  return <TeacherDataView school={school} metrics={metrics} />;
}
