import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = { title: "Transcripts" };

export default async function TranscriptsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const students = await db.student.findMany({
    include: {
      user: { select: { fullName: true } },
      program: { select: { name: true } },
      enrollments: {
        include: {
          courseEnrollments: {
            include: {
              grade: true,
              subject: { select: { creditHours: true } },
            },
          },
        },
      },
    },
    orderBy: { studentIdNumber: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transcripts</h1>
        <p className="text-muted-foreground">
          View and generate student academic transcripts.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-center">GPA</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const graded = s.enrollments.flatMap((e) =>
                  e.courseEnrollments.filter(
                    (ce) => ce.grade && ce.grade.status === "APPROVED",
                  ),
                );
                const totalCredits = graded.reduce(
                  (sum, ce) => sum + ce.subject.creditHours,
                  0,
                );
                const weightedGPA =
                  totalCredits > 0
                    ? graded.reduce(
                        (sum, ce) =>
                          sum +
                          (ce.grade!.gpaPoints ?? 0) * ce.subject.creditHours,
                        0,
                      ) / totalCredits
                    : 0;

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">
                      {s.studentIdNumber}
                    </TableCell>
                    <TableCell>{s.user.fullName}</TableCell>
                    <TableCell>{s.program.name}</TableCell>
                    <TableCell className="text-center">
                      {graded.length}
                    </TableCell>
                    <TableCell className="text-center">
                      {weightedGPA > 0 ? (
                        <Badge variant="outline">
                          {weightedGPA.toFixed(2)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/students/${s.id}`}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No students found.
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
