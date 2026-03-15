import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import MarkAttendanceForm from "./mark-attendance-form";

export const metadata = { title: "Mark Attendance" };

export default async function MarkAttendancePage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";

  if (!isAdmin && !isInstructor) {
    redirect("/attendance");
  }

  // Get subjects this user can mark attendance for
  let subjects: { id: string; code: string; name: string }[] = [];

  if (isInstructor) {
    const staff = await db.staff.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (staff) {
      const entries = await db.timetableEntry.findMany({
        where: { instructorId: staff.id },
        select: { subject: { select: { id: true, code: true, name: true } } },
        distinct: ["subjectId"],
      });
      subjects = entries.map((e) => e.subject);
    }
  } else {
    subjects = await db.subject.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });
  }

  // Get current semester
  const currentSemester = await db.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground">
          Select a subject and date to mark attendance for enrolled students.
        </p>
      </div>

      <MarkAttendanceForm
        subjects={subjects}
        currentSemesterId={currentSemester?.id ?? null}
      />
    </div>
  );
}
