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
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata = { title: "Exam Schedule" };

export default async function ExamSchedulePage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  const exams = await db.examSchedule.findMany({
    include: {
      subject: { select: { name: true, code: true } },
      semester: {
        include: { academicYear: { select: { name: true } } },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const now = new Date();
  const upcoming = exams.filter((e) => e.date >= now);
  const past = exams.filter((e) => e.date < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exam Schedule</h1>
          <p className="text-muted-foreground">
            {upcoming.length} upcoming exam{upcoming.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/grades/exams/new">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Exam
            </Link>
          </Button>
        )}
      </div>

      {/* Upcoming Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Exams</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Semester</TableHead>
                {isAdmin && (
                  <TableHead className="text-right">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{formatDate(exam.date)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {exam.startTime} — {exam.endTime}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{exam.subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.subject.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{exam.venue}</TableCell>
                  <TableCell>{exam.duration} min</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {exam.semester.academicYear.name} — {exam.semester.name}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/grades/exams/${exam.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {upcoming.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 7 : 6}
                    className="h-24 text-center"
                  >
                    No upcoming exams.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Past Exams */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past Exams</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.map((exam) => (
                  <TableRow key={exam.id} className="opacity-60">
                    <TableCell>{formatDate(exam.date)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {exam.startTime} — {exam.endTime}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exam.subject.code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{exam.venue}</TableCell>
                    <TableCell>{exam.duration} min</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {exam.semester.academicYear.name} — {exam.semester.name}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
