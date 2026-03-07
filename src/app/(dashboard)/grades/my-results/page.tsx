import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "My Results" };

export default async function MyResultsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const student = await db.student.findFirst({
    where: { userId: session.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No student profile linked to your account.
        </CardContent>
      </Card>
    );
  }

  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      semester: { include: { academicYear: true } },
      courseEnrollments: {
        include: {
          subject: { select: { name: true, code: true, creditHours: true } },
          grade: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
        <p className="text-muted-foreground">
          Your academic results by semester.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No enrollment records found.
          </CardContent>
        </Card>
      ) : (
        enrollments.map((enrollment) => {
          const gradedCourses = enrollment.courseEnrollments.filter(
            (ce) => ce.grade,
          );
          const totalCredits = gradedCourses.reduce(
            (s, ce) => s + ce.subject.creditHours,
            0,
          );
          const weightedGPA =
            totalCredits > 0
              ? gradedCourses.reduce(
                  (s, ce) =>
                    s + (ce.grade?.gpaPoints ?? 0) * ce.subject.creditHours,
                  0,
                ) / totalCredits
              : 0;

          return (
            <Card key={enrollment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {enrollment.semester.academicYear.name} —{" "}
                    {enrollment.semester.name}
                  </CardTitle>
                  {weightedGPA > 0 && (
                    <Badge variant="outline">
                      GPA: {weightedGPA.toFixed(2)}
                    </Badge>
                  )}
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
                          {ce.grade ? (
                            <Badge variant="outline">
                              {ce.grade.gradeLetter}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
