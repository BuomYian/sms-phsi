import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import ExamScheduleForm from "./exam-schedule-form";

export const metadata = { title: "Schedule Exam" };

export default async function NewExamPage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/grades/exams");

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
        <h1 className="text-2xl font-bold tracking-tight">Schedule Exam</h1>
        <p className="text-muted-foreground">
          Create a new exam schedule entry.
        </p>
      </div>
      <ExamScheduleForm
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
