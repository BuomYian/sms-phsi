import Link from "next/link";
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
import { STATUS_COLORS } from "@/constants";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  Plus,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export const metadata = { title: "Attendance" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    subject?: string;
    date?: string;
  }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";
  const isStudent = session.role === "STUDENT";

  // Build where clause
  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.date) {
    const d = new Date(params.date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  }
  if (params.subject) {
    where.courseEnrollment = {
      subject: { id: params.subject },
    };
  }

  // Instructors see attendance for subjects they teach
  if (isInstructor) {
    const staff = await db.staff.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (staff) {
      const timetableSubjectIds = await db.timetableEntry.findMany({
        where: { instructorId: staff.id },
        select: { subjectId: true },
        distinct: ["subjectId"],
      });
      const subjectIds = timetableSubjectIds.map((t) => t.subjectId);
      where.courseEnrollment = {
        ...(where.courseEnrollment as Record<string, unknown> | undefined),
        subject: { id: params.subject ? params.subject : { in: subjectIds } },
      };
    }
  }

  // Students see only their own attendance
  if (isStudent) {
    const student = await db.student.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (student) {
      where.courseEnrollment = {
        ...(where.courseEnrollment as Record<string, unknown> | undefined),
        enrollment: { studentId: student.id },
      };
    }
  }

  const recentAttendance = await db.attendance.findMany({
    take: 100,
    where,
    include: {
      courseEnrollment: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
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
      },
      marker: { select: { fullName: true } },
    },
    orderBy: { date: "desc" },
  });

  // Today's summary (scoped same as the list)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayWhere = {
    ...where,
    date: { gte: today, lt: tomorrow },
  };

  const [presentToday, absentToday, lateToday, excusedToday] =
    await Promise.all([
      db.attendance.count({
        where: { ...todayWhere, status: "PRESENT" },
      }),
      db.attendance.count({
        where: { ...todayWhere, status: "ABSENT" },
      }),
      db.attendance.count({
        where: { ...todayWhere, status: "LATE" },
      }),
      db.attendance.count({
        where: { ...todayWhere, status: "EXCUSED" },
      }),
    ]);

  // Get subjects list for filter (scoped by role)
  let filterSubjects: { id: string; code: string; name: string }[] = [];
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
      filterSubjects = entries.map((e) => e.subject);
    }
  } else if (isAdmin) {
    filterSubjects = await db.subject.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });
  }

  const activeStatus = params.status || "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            {isStudent
              ? "Your attendance records."
              : "Track and manage student attendance."}
          </p>
        </div>
        {(isAdmin || isInstructor) && (
          <Button asChild>
            <Link href="/attendance/mark">
              <Plus className="mr-2 h-4 w-4" />
              Mark Attendance
            </Link>
          </Button>
        )}
      </div>

      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{presentToday}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{absentToday}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lateToday}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <ShieldAlert className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{excusedToday}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {["all", "PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
            <Link
              key={status}
              href={`/attendance?status=${status}${params.subject ? `&subject=${params.subject}` : ""}${params.date ? `&date=${params.date}` : ""}`}
            >
              <Badge
                variant={activeStatus === status ? "default" : "outline"}
                className="cursor-pointer"
              >
                {status === "all" ? "All" : status}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Subject filter (admin/instructor) */}
        {filterSubjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Subject:</span>
            <Link
              href={`/attendance?status=${activeStatus}${params.date ? `&date=${params.date}` : ""}`}
            >
              <Badge
                variant={!params.subject ? "default" : "outline"}
                className="cursor-pointer"
              >
                All
              </Badge>
            </Link>
            {filterSubjects.map((s) => (
              <Link
                key={s.id}
                href={`/attendance?status=${activeStatus}&subject=${s.id}${params.date ? `&date=${params.date}` : ""}`}
              >
                <Badge
                  variant={params.subject === s.id ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {s.code}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Attendance Records
            </CardTitle>
            <Badge variant="secondary">
              {recentAttendance.length} record
              {recentAttendance.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {!isStudent && <TableHead>Student</TableHead>}
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-sm">
                    {formatDate(record.date)}
                  </TableCell>
                  {!isStudent && (
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {
                            record.courseEnrollment.enrollment.student.user
                              .fullName
                          }
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {
                            record.courseEnrollment.enrollment.student
                              .studentIdNumber
                          }
                        </p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {record.courseEnrollment.subject.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.courseEnrollment.subject.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[record.status]}
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.marker?.fullName ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {recentAttendance.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isStudent ? 4 : 5}
                    className="h-24 text-center"
                  >
                    No attendance records found.
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
