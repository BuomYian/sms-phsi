import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import GradeEntryForm from "./grade-entry-form";

export const metadata = { title: "Grade Entry" };

export default async function GradeEntryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";

  if (!isAdmin && !isInstructor) {
    redirect("/grades");
  }

  const [staff, currentSemester] = await Promise.all([
    isAdmin
      ? null
      : db.staff.findFirst({
          where: { userId: session.id },
          select: { id: true },
        }),
    db.semester.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true },
    }),
  ]);

  const subjects =
    !isAdmin && !staff
      ? []
      : await db.subject.findMany({
          where: isAdmin
            ? {}
            : { instructors: { some: { staffId: staff!.id } } },
          select: {
            id: true,
            code: true,
            name: true,
            courseEnrollments: {
              where: {
                enrollment: {
                  status: "APPROVED",
                  ...(currentSemester
                    ? { semesterId: currentSemester.id }
                    : {}),
                },
              },
              include: {
                enrollment: {
                  include: {
                    student: {
                      include: { user: { select: { fullName: true } } },
                    },
                  },
                },
                grade: {
                  select: {
                    caMarks: true,
                    examMarks: true,
                    totalMarks: true,
                    gradeLetter: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { code: "asc" },
        });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grade Entry</h1>
        <p className="text-muted-foreground">
          Enter CA and exam marks for enrolled students.
          {currentSemester ? ` · ${currentSemester.name}` : ""}
        </p>
      </div>
      <GradeEntryForm subjects={subjects} />
    </div>
  );
}
