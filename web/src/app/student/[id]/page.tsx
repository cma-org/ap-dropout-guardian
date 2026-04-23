import { notFound } from "next/navigation";
import { getStudent, getCounsellorTemplates, pickCounsellorTemplate } from "@/lib/data";
import StudentDetailClient from "./StudentDetailClient";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const childSno = parseInt(id, 10);
  if (!Number.isFinite(childSno)) return notFound();
  const [student, templates] = await Promise.all([getStudent(childSno), getCounsellorTemplates()]);
  if (!student) return notFound();

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
