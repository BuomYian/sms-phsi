import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ClassesClient } from "./classes-client";

export const metadata = { title: "Classes" };

export default async function ClassesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [classes, programs, academicYears] = await Promise.all([
    db.academicClass.findMany({
      include: {
        program: {
          select: { name: true, code: true, durationSemesters: true },
        },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [
        { academicYear: { startDate: "desc" } },
        { program: { name: "asc" } },
        { yearLevel: "asc" },
      ],
    }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, durationSemesters: true },
      orderBy: { name: "asc" },
    }),
    db.academicYear.findMany({
      select: { id: true, name: true, isCurrent: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ClassesClient
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          yearLevel: c.yearLevel,
          programName: c.program.name,
          programCode: c.program.code,
          academicYearName: c.academicYear.name,
          studentCount: c._count.students,
        }))}
        programs={programs}
        academicYears={academicYears}
      />
    </div>
  );
}
