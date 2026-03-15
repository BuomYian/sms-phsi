import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Plus,
  XCircle,
} from "lucide-react";

export const metadata = { title: "Enrollment" };

export default async function EnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    semester?: string;
  }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isStudent = session.role === "STUDENT";

  // Build where clause
  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.semester && params.semester !== "all") {
    where.semesterId = params.semester;
  }

  // Students only see their own enrollments
  if (isStudent) {
    const student = await db.student.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (student) {
      where.studentId = student.id;
    }
  }

  const [enrollments, semesters, statusCounts] = await Promise.all([
    db.enrollment.findMany({
      where,
      include: {
        student: {
          include: { user: { select: { fullName: true } } },
        },
        semester: {
          include: { academicYear: { select: { name: true } } },
        },
        _count: { select: { courseEnrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.semester.findMany({
      include: { academicYear: { select: { name: true } } },
      orderBy: [{ academicYear: { startDate: "desc" } }, { startDate: "asc" }],
    }),
    db.enrollment.groupBy({
      by: ["status"],
      ...(isStudent
        ? {
            where: {
              student: { userId: session.id },
            },
          }
        : {}),
      _count: true,
    }),
  ]);

  const counts = {
    total: statusCounts.reduce((sum, s) => sum + s._count, 0),
    pending: statusCounts.find((s) => s.status === "PENDING")?._count ?? 0,
    approved: statusCounts.find((s) => s.status === "APPROVED")?._count ?? 0,
    rejected: statusCounts.find((s) => s.status === "REJECTED")?._count ?? 0,
  };

  // Calculate total credits for each enrollment
  const enrollmentCredits = new Map<string, number>();
  if (enrollments.length > 0) {
    const enrollmentIds = enrollments.map((e) => e.id);
    const courseEnrollments = await db.courseEnrollment.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      include: { subject: { select: { creditHours: true } } },
    });
    for (const ce of courseEnrollments) {
      enrollmentCredits.set(
        ce.enrollmentId,
        (enrollmentCredits.get(ce.enrollmentId) ?? 0) + ce.subject.creditHours,
      );
    }
  }

  const activeStatus = params.status || "all";
  const activeSemester = params.semester || "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enrollment</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage student enrollments by semester."
              : "Your semester enrollments and subject registrations."}
          </p>
        </div>
        <Button asChild>
          <Link href="/enrollment/new">
            <Plus className="mr-2 h-4 w-4" />
            {isAdmin ? "New Enrollment" : "Enroll Now"}
          </Link>
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
          Status:
        </div>
        {["all", "PENDING", "APPROVED", "REJECTED", "CONDITIONAL"].map(
          (status) => (
            <Link
              key={status}
              href={`/enrollment?status=${status}&semester=${activeSemester}`}
            >
              <Badge
                variant={activeStatus === status ? "default" : "outline"}
                className="cursor-pointer"
              >
                {status === "all" ? "All" : status}
              </Badge>
            </Link>
          ),
        )}

        <div className="mx-2 border-l" />

        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
          Semester:
        </div>
        <Link href={`/enrollment?status=${activeStatus}&semester=all`}>
          <Badge
            variant={activeSemester === "all" ? "default" : "outline"}
            className="cursor-pointer"
          >
            All
          </Badge>
        </Link>
        {semesters.slice(0, 4).map((sem) => (
          <Link
            key={sem.id}
            href={`/enrollment?status=${activeStatus}&semester=${sem.id}`}
          >
            <Badge
              variant={activeSemester === sem.id ? "default" : "outline"}
              className="cursor-pointer"
            >
              {sem.academicYear.name} — {sem.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Student</TableHead>}
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-center">Subjects</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} className="cursor-pointer">
                  {isAdmin && (
                    <TableCell>
                      <Link
                        href={`/enrollment/${enrollment.id}`}
                        className="block"
                      >
                        <div>
                          <p className="font-medium hover:underline">
                            {enrollment.student.user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {enrollment.student.studentIdNumber}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                  )}
                  <TableCell>
                    <Link href={`/enrollment/${enrollment.id}`}>
                      {enrollment.semester.academicYear.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/enrollment/${enrollment.id}`}>
                      {enrollment.semester.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/enrollment/${enrollment.id}`}>
                      <span className="flex items-center justify-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {enrollment._count.courseEnrollments}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/enrollment/${enrollment.id}`}>
                      {enrollmentCredits.get(enrollment.id) ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/enrollment/${enrollment.id}`}>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[enrollment.status]}
                      >
                        {enrollment.status}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <Link href={`/enrollment/${enrollment.id}`}>
                      {formatDate(enrollment.createdAt)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 7 : 6}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No enrollments found.
                      </p>
                    </div>
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
