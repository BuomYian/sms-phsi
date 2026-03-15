import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import TimetableEntryForm from "./timetable-entry-form";

export const metadata = { title: "New Timetable Entry" };

export default async function NewTimetableEntryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/timetable");

  const [subjects, instructors, semesters] = await Promise.all([
    db.subject.findMany({
      include: { program: { select: { name: true, code: true } } },
      orderBy: [{ program: { name: "asc" } }, { name: "asc" }],
    }),
    db.staff.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
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
          New Timetable Entry
        </h1>
        <p className="text-muted-foreground">
          Add a class to the weekly timetable.
        </p>
      </div>
      <TimetableEntryForm
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          programName: s.program.name,
        }))}
        instructors={instructors.map((i) => ({
          id: i.id,
          fullName: i.user.fullName,
          staffIdNumber: i.staffIdNumber,
        }))}
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
