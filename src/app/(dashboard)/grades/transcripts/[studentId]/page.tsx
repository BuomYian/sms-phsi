import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INSTITUTION_NAME, INSTITUTION_ADDRESS } from "@/constants";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { fullName: true } } },
  });
  return {
    title: student ? `Transcript — ${student.user.fullName}` : "Transcript",
  };
}

export default async function TranscriptDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const [session, { studentId }] = await Promise.all([getSession(), params]);
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/grades");

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { fullName: true, email: true } },
      program: {
        select: { name: true, department: { select: { name: true } } },
      },
      enrollments: {
        include: {
          semester: {
            include: { academicYear: { select: { name: true } } },
          },
          courseEnrollments: {
            include: {
              subject: {
                select: { code: true, name: true, creditHours: true },
              },
              grade: true,
            },
            orderBy: { subject: { code: "asc" } },
          },
        },
        orderBy: { semester: { startDate: "asc" } },
      },
    },
  });

  if (!student) notFound();

  // Compute per-semester and cumulative GPA
  let cumulativeCredits = 0;
  let cumulativeWeightedPoints = 0;

  const semesterData = student.enrollments.map((enrollment) => {
    const gradedCourses = enrollment.courseEnrollments.filter(
      (ce) => ce.grade && ce.grade.status === "APPROVED",
    );

    const semesterCredits = gradedCourses.reduce(
      (sum, ce) => sum + ce.subject.creditHours,
      0,
    );
    const semesterWeightedPoints = gradedCourses.reduce(
      (sum, ce) => sum + (ce.grade!.gpaPoints ?? 0) * ce.subject.creditHours,
      0,
    );
    const semesterGPA =
      semesterCredits > 0 ? semesterWeightedPoints / semesterCredits : 0;

    cumulativeCredits += semesterCredits;
    cumulativeWeightedPoints += semesterWeightedPoints;
    const cGPA =
      cumulativeCredits > 0 ? cumulativeWeightedPoints / cumulativeCredits : 0;

    return {
      enrollment,
      gradedCourses,
      semesterCredits,
      semesterGPA,
      cGPA,
    };
  });

  const finalCGPA =
    cumulativeCredits > 0 ? cumulativeWeightedPoints / cumulativeCredits : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/grades/transcripts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Academic Transcript
          </h1>
          <p className="text-muted-foreground">{INSTITUTION_NAME}</p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-medium">{student.user.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="font-mono">{student.studentIdNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Program</p>
              <p>{student.program.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Department</p>
              <p>{student.program.department?.name ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Cumulative GPA (CGPA)
              </p>
              <p className="text-lg font-bold">
                {finalCGPA > 0 ? finalCGPA.toFixed(2) : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold">{cumulativeCredits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semester Results */}
      {semesterData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No enrollment records found for this student.
          </CardContent>
        </Card>
      ) : (
        semesterData.map(
          ({ enrollment, semesterCredits, semesterGPA, cGPA }) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {enrollment.semester.academicYear.name} —{" "}
                    {enrollment.semester.name}
                  </CardTitle>
                  <div className="flex gap-3">
                    <Badge variant="outline">
                      GPA: {semesterGPA > 0 ? semesterGPA.toFixed(2) : "—"}
                    </Badge>
                    <Badge variant="secondary">
                      CGPA: {cGPA > 0 ? cGPA.toFixed(2) : "—"}
                    </Badge>
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
                      <TableHead className="text-center">CA</TableHead>
                      <TableHead className="text-center">Exam</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollment.courseEnrollments.map((ce) => (
                      <TableRow key={ce.id}>
                        <TableCell className="font-mono">
                          {ce.subject.code}
                        </TableCell>
                        <TableCell>{ce.subject.name}</TableCell>
                        <TableCell className="text-center">
                          {ce.subject.creditHours}
                        </TableCell>
                        <TableCell className="text-center">
                          {ce.grade?.caMarks ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {ce.grade?.examMarks ?? "—"}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {ce.grade?.totalMarks ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {ce.grade?.gradeLetter ? (
                            <Badge
                              variant={
                                ce.grade.gradeLetter === "F"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {ce.grade.gradeLetter}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {ce.grade?.gpaPoints?.toFixed(1) ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Semester summary row */}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={2} className="text-right">
                        Semester Total
                      </TableCell>
                      <TableCell className="text-center">
                        {semesterCredits}
                      </TableCell>
                      <TableCell colSpan={3} />
                      <TableCell className="text-center">
                        GPA: {semesterGPA > 0 ? semesterGPA.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ),
        )
      )}

      {/* Footer */}
      <Separator />
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>{INSTITUTION_NAME}</p>
        <p>{INSTITUTION_ADDRESS}</p>
        <p>This is a computer-generated transcript.</p>
      </div>
    </div>
  );
}
