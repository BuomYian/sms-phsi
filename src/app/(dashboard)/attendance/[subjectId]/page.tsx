import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { STATUS_COLORS, DEFAULT_ATTENDANCE_THRESHOLD } from "@/constants";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    select: { name: true, code: true },
  });
  return { title: subject ? `${subject.code} Attendance` : "Attendance" };
}

export default async function SubjectAttendancePage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const [session, { subjectId }] = await Promise.all([getSession(), params]);
  if (!session) return null;

  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, code: true },
  });
  if (!subject) notFound();

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";

  // Get all course enrollments for this subject (current semester, approved)
  const currentSemester = await db.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true, name: true },
  });

  const courseEnrollments = await db.courseEnrollment.findMany({
    where: {
      subjectId,
      enrollment: {
        status: "APPROVED",
        ...(currentSemester ? { semesterId: currentSemester.id } : {}),
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
      attendances: {
        orderBy: { date: "desc" },
        select: { id: true, date: true, status: true },
      },
    },
    orderBy: {
      enrollment: {
        student: { user: { fullName: "asc" } },
      },
    },
  });

  // Compute per-student stats
  const studentStats = courseEnrollments.map((ce) => {
    const total = ce.attendances.length;
    const present = ce.attendances.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE",
    ).length;
    const absent = ce.attendances.filter((a) => a.status === "ABSENT").length;
    const excused = ce.attendances.filter((a) => a.status === "EXCUSED").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    const belowThreshold =
      total > 0 && percentage < DEFAULT_ATTENDANCE_THRESHOLD;

    return {
      courseEnrollmentId: ce.id,
      studentName: ce.enrollment.student.user.fullName,
      studentIdNumber: ce.enrollment.student.studentIdNumber,
      total,
      present,
      absent,
      excused,
      percentage,
      belowThreshold,
    };
  });

  // Get unique dates for summary
  const allDates = new Set<string>();
  for (const ce of courseEnrollments) {
    for (const a of ce.attendances) {
      allDates.add(formatDate(a.date));
    }
  }

  const totalSessions = allDates.size;
  const belowThresholdCount = studentStats.filter(
    (s) => s.belowThreshold,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/attendance">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {subject.code} — {subject.name}
            </h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Attendance summary
            {currentSemester ? ` · ${currentSemester.name}` : ""} ·{" "}
            {totalSessions} session{totalSessions !== 1 ? "s" : ""} recorded
          </p>
        </div>
        {(isAdmin || isInstructor) && (
          <Button asChild>
            <Link href={`/attendance/mark?subject=${subjectId}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Mark Attendance
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{studentStats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Below {DEFAULT_ATTENDANCE_THRESHOLD}% Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${belowThresholdCount > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {belowThresholdCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Excused</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="w-48">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentStats.map((student, idx) => (
                <TableRow
                  key={student.courseEnrollmentId}
                  className={
                    student.belowThreshold ? "bg-red-50 dark:bg-red-950/20" : ""
                  }
                >
                  <TableCell className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.studentName}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {student.studentIdNumber}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS["PRESENT"]}
                    >
                      {student.present}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS["ABSENT"]}
                    >
                      {student.absent}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS["EXCUSED"]}
                    >
                      {student.excused}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{student.total}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={student.percentage}
                        className="h-2 flex-1"
                      />
                      <span
                        className={`text-sm font-medium ${student.belowThreshold ? "text-red-600" : ""}`}
                      >
                        {student.percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {studentStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No enrolled students found for this subject.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
