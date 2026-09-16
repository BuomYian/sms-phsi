import { db } from "@/lib/db";

/**
 * Resolve the semester a student's schedule should default to.
 *
 * Cohorts can run in different semesters at the same time — e.g. Year 1 sitting
 * in AY2026 Semester 2 while Year 3 has already started AY2026/2027 Semester 1 —
 * so the institution-wide `isCurrent` flag is not a reliable default for an
 * individual student. Prefer the semester of their most recent approved
 * enrollment and fall back to `isCurrent` only when they have none.
 */
export async function getStudentSemesterId(
  studentId: string,
): Promise<string | undefined> {
  const latest = await db.enrollment.findFirst({
    where: { studentId, status: { in: ["APPROVED", "CONDITIONAL"] } },
    orderBy: { semester: { startDate: "desc" } },
    select: { semesterId: true },
  });
  if (latest) return latest.semesterId;

  const current = await db.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  return current?.id;
}
