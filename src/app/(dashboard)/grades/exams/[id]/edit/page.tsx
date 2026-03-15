import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import ExamEditForm from "./exam-edit-form";

export const metadata = { title: "Edit Exam Schedule" };

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSession(), params]);
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/grades/exams");

  const exam = await db.examSchedule.findUnique({
    where: { id },
  });
  if (!exam) notFound();

  const [subjects, semesters] = await Promise.all([
    db.subject.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    db.semester.findMany({
      include: { academicYear: { select: { name: true } } },
      orderBy: [{ academicYear: { startDate: "desc" } }, { startDate: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Exam Schedule
        </h1>
        <p className="text-muted-foreground">Update exam schedule details.</p>
      </div>
      <ExamEditForm
        exam={{
          id: exam.id,
          subjectId: exam.subjectId,
          semesterId: exam.semesterId,
          date: exam.date.toISOString().split("T")[0],
          startTime: exam.startTime,
          endTime: exam.endTime,
          venue: exam.venue,
          duration: exam.duration,
        }}
        subjects={subjects}
        semesters={semesters.map((s) => ({
          id: s.id,
          name: s.name,
          academicYearName: s.academicYear.name,
          isCurrent: s.isCurrent,
        }))}
      />
    </div>
  );
}
