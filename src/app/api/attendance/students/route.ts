import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const subjectId = searchParams.get("subjectId");
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!subjectId || !classId || !date) {
    return NextResponse.json(
      { error: "subjectId, classId and date are required" },
      { status: 400 },
    );
  }

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";
  if (!isAdmin && !isInstructor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Instructors may only load registers for subjects they actually teach.
  if (isInstructor) {
    const staff = await db.staff.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!staff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [scheduled, assigned] = await Promise.all([
      db.timetableEntry.count({ where: { subjectId, instructorId: staff.id } }),
      db.subjectInstructor.count({ where: { subjectId, staffId: staff.id } }),
    ]);
    if (scheduled === 0 && assigned === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // The offering pins the subject to one class in one semester. That pairing is
  // what scopes the register — a subject such as Biochemistry runs for several
  // classes at once, so subject alone would mix cohorts together.
  const offering = await db.subjectOffering.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
    select: { semesterId: true },
  });
  if (!offering) {
    return NextResponse.json(
      { error: "This subject is not offered to the selected class." },
      { status: 404 },
    );
  }

  const courseEnrollments = await db.courseEnrollment.findMany({
    where: {
      subjectId,
      enrollment: {
        status: "APPROVED",
        classId,
        semesterId: offering.semesterId,
      },
    },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true } },
            },
          },
        },
      },
    },
    orderBy: {
      enrollment: {
        student: { user: { fullName: "asc" } },
      },
    },
  });

  // Get existing attendance for this date
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const nextDay = new Date(d);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingAttendance = await db.attendance.findMany({
    where: {
      courseEnrollmentId: {
        in: courseEnrollments.map((ce) => ce.id),
      },
      date: { gte: d, lt: nextDay },
    },
    select: {
      courseEnrollmentId: true,
      status: true,
    },
  });

  const attendanceMap = new Map(
    existingAttendance.map((a) => [a.courseEnrollmentId, a.status]),
  );

  const result = courseEnrollments.map((ce) => ({
    courseEnrollmentId: ce.id,
    studentName: ce.enrollment.student.user.fullName,
    studentIdNumber: ce.enrollment.student.studentIdNumber,
    existingStatus: attendanceMap.get(ce.id) ?? null,
  }));

  return NextResponse.json(result);
}
