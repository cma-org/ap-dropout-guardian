import { notFound } from "next/navigation";
import { getStudent, getCounsellorTemplates, pickCounsellorTemplate } from "@/lib/data";
import StudentDetailClient from "./StudentDetailClient";

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ id }, { year = "2024-25" }] = await Promise.all([params, searchParams]);
  const childSno = parseInt(id, 10);
  if (!Number.isFinite(childSno)) return notFound();

  // Try selected year first; fall back to the other year if no record exists
  let student = await getStudent(childSno, year);
  const fallbackYear = year === "2024-25" ? "2023-24" : "2024-25";
  if (!student) student = await getStudent(childSno, fallbackYear);
  if (!student) return notFound();

  const templates = await getCounsellorTemplates();
  const topDriver = student.drivers[0]?.feature ?? "default";
  const { key: templateKey, tpl } = pickCounsellorTemplate(topDriver, templates);

  return (
    <StudentDetailClient
      student={student}
      counsellorTemplate={tpl}
      counsellorTemplateKey={templateKey}
    />
  );
}
