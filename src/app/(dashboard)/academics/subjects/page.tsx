import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_COLORS } from "@/constants";
import { Plus, BookOpen, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isStudent = session.role === "STUDENT";

  // ─── Student view: current & previous semester subjects ───
  if (isStudent) {
    const student = await db.student.findFirst({
      where: { userId: session.id },
      select: { id: true, programId: true, yearOfStudy: true },
    });

    if (!student) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">My Subjects</h1>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No student record found for your account.
            </CardContent>
          </Card>
        </div>
      );
    }

    // Find current semester
    const currentSemester = await db.semester.findFirst({
      where: { isCurrent: true },
      include: { academicYear: { select: { name: true } } },
    });

    // Get all enrollments with course enrollments, subjects, and grades
    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id, status: "APPROVED" },
      include: {
        semester: {
          include: { academicYear: { select: { name: true } } },
        },
        courseEnrollments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                creditHours: true,
                semesterNumber: true,
                type: true,
              },
            },
            grade: {
              select: {
                totalMarks: true,
                gradeLetter: true,
                gpaPoints: true,
                status: true,
              },
            },
            _count: { select: { attendances: true } },
          },
        },
      },
      orderBy: {
        semester: { startDate: "desc" },
      },
    });

    const currentEnrollment = currentSemester
      ? enrollments.find((e) => e.semesterId === currentSemester.id)
      : null;

    const previousEnrollments = enrollments.filter(
      (e) => e.semesterId !== currentSemester?.id,
    );

    const currentCredits =
      currentEnrollment?.courseEnrollments.reduce(
        (sum, ce) => sum + ce.subject.creditHours,
        0,
      ) ?? 0;

    const totalPassed = previousEnrollments.reduce(
      (sum, e) =>
        sum +
        e.courseEnrollments.filter(
          (ce) =>
            ce.grade?.status === "PUBLISHED" &&
            ce.grade.totalMarks !== null &&
            ce.grade.totalMarks >= 50,
        ).length,
      0,
    );

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Subjects</h1>
          <p className="text-muted-foreground">
            Your enrolled subjects for the current and previous semesters.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Current Subjects
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentEnrollment?.courseEnrollments.length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentCredits} credit hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Previous Semesters
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {previousEnrollments.length}
              </div>
              <p className="text-xs text-muted-foreground">
                completed semesters
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Subjects Passed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPassed}</div>
              <p className="text-xs text-muted-foreground">
                across all semesters
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Semester */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Current Semester
            </CardTitle>
            <CardDescription>
              {currentSemester
                ? `${currentSemester.academicYear.name} — ${currentSemester.name}`
                : "No active semester"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {currentEnrollment &&
            currentEnrollment.courseEnrollments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Classes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEnrollment.courseEnrollments.map((ce) => (
                    <TableRow key={ce.id}>
                      <TableCell className="font-mono">
                        {ce.subject.code}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/academics/subjects/${ce.subject.id}`}
                          className="font-medium hover:underline"
                        >
                          {ce.subject.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        {ce.subject.creditHours}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ce.subject.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {ce._count.attendances} attended
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {currentSemester
                  ? "You are not enrolled in any subjects this semester."
                  : "No active semester at the moment."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Semesters */}
        {previousEnrollments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Previous Semesters</h2>
            {previousEnrollments.map((enrollment) => {
              const semLabel = `${enrollment.semester.academicYear.name} — ${enrollment.semester.name}`;
              const semCredits = enrollment.courseEnrollments.reduce(
                (sum, ce) => sum + ce.subject.creditHours,
                0,
              );
              return (
                <Card key={enrollment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{semLabel}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {enrollment.courseEnrollments.length} subjects
                        </Badge>
                        <Badge variant="outline">{semCredits} credits</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">Credits</TableHead>
                          <TableHead className="text-center">Marks</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="text-center">GPA</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollment.courseEnrollments.map((ce) => (
                          <TableRow key={ce.id}>
                            <TableCell className="font-mono">
                              {ce.subject.code}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/academics/subjects/${ce.subject.id}`}
                                className="font-medium hover:underline"
                              >
                                {ce.subject.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              {ce.subject.creditHours}
                            </TableCell>
                            <TableCell className="text-center">
                              {ce.grade?.totalMarks != null
                                ? ce.grade.totalMarks.toFixed(1)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {ce.grade?.gradeLetter ?? "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {ce.grade?.gpaPoints != null
                                ? ce.grade.gpaPoints.toFixed(2)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {ce.grade ? (
                                <Badge
                                  variant="secondary"
                                  className={
                                    STATUS_COLORS[ce.grade.status] ?? ""
                                  }
                                >
                                  {ce.grade.status}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  No grade
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Admin / Instructor: subjects view ───
  const isInstructor = session.role === "INSTRUCTOR";

  // Instructor: only subjects in programs they teach
  let instructorProgramIds: string[] = [];
  if (isInstructor) {
    const staff = await db.staff.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (staff) {
      const assignments = await db.subjectInstructor.findMany({
        where: { staffId: staff.id },
        select: { subject: { select: { programId: true } } },
      });
      instructorProgramIds = [
        ...new Set(assignments.map((a) => a.subject.programId)),
      ];
    }
  }

  const subjects = await db.subject.findMany({
    where: isInstructor
      ? { programId: { in: instructorProgramIds } }
      : undefined,
    include: {
      program: { select: { name: true, code: true } },
    },
    orderBy: [
      { program: { name: "asc" } },
      { semesterNumber: "asc" },
      { code: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isInstructor ? "My Subjects" : "Subjects"}
          </h1>
          <p className="text-muted-foreground">
            {isInstructor
              ? "Subjects in the programs you teach."
              : "All course subjects across programs."}
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" asChild>
            <Link href="/academics/subjects/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-mono">{subject.code}</TableCell>
                  <TableCell>
                    <Link
                      href={`/academics/subjects/${subject.id}`}
                      className="font-medium hover:underline"
                    >
                      {subject.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {subject.program
                      ? `${subject.program.name} (${subject.program.code})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.semesterNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.creditHours}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subject.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No subjects yet.
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
