import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import TimetableEditForm from "./timetable-edit-form";

export const metadata = { title: "Edit Timetable Entry" };

export default async function EditTimetableEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSession(), params]);
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/timetable");

  const [entry, subjects, instructors, semesters] = await Promise.all([
    db.timetableEntry.findUnique({ where: { id } }),
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

  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Timetable Entry
        </h1>
        <p className="text-muted-foreground">
          Modify the class schedule details.
        </p>
      </div>
      <TimetableEditForm
        entry={{
          id: entry.id,
          subjectId: entry.subjectId,
          instructorId: entry.instructorId,
          semesterId: entry.semesterId,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
        }}
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
