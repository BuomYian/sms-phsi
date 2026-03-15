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
  const date = searchParams.get("date");
  const semesterId = searchParams.get("semesterId");

  if (!subjectId || !date) {
    return NextResponse.json(
      { error: "subjectId and date are required" },
      { status: 400 },
    );
  }

  // Find course enrollments for this subject in the current semester
  const courseEnrollments = await db.courseEnrollment.findMany({
    where: {
      subjectId,
      enrollment: {
        status: "APPROVED",
        ...(semesterId ? { semesterId } : {}),
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
