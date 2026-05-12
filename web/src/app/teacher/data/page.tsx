import TeacherDataView from "./TeacherDataView";
import { getSchools, getMetrics } from "@/lib/data";

export default async function TeacherDataPage() {
  const [schools, metrics] = await Promise.all([getSchools(), getMetrics()]);
  return <TeacherDataView schools={schools} metrics={metrics} />;
}
