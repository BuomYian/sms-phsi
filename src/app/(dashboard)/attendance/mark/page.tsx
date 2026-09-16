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

  // A subject is often taught to more than one class in the same week, so the
  // instructor has to say which register they are marking. The offering also
  // tells us which semester that class sits in, which matters now that cohorts
  // run in different semesters concurrently.
  const offerings = await db.subjectOffering.findMany({
    where: { subjectId: { in: subjects.map((s) => s.id) } },
    select: {
      subjectId: true,
      class: { select: { id: true, name: true } },
      semester: {
        select: { name: true, academicYear: { select: { name: true } } },
      },
    },
    orderBy: { class: { name: "asc" } },
  });

  const subjectClasses: Record<
    string,
    { id: string; name: string; semesterLabel: string }[]
  > = {};
  for (const o of offerings) {
    (subjectClasses[o.subjectId] ??= []).push({
      id: o.class.id,
      name: o.class.name,
      semesterLabel: `${o.semester.academicYear.name} — ${o.semester.name}`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground">
          Select a subject, the class you are teaching, and a date to mark
          attendance.
        </p>
      </div>

      <MarkAttendanceForm subjects={subjects} subjectClasses={subjectClasses} />
    </div>
  );
}
