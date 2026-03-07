import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Exam Schedule" };

export default async function ExamSchedulePage() {
  const exams = await db.examSchedule.findMany({
    include: {
      subject: { select: { name: true, code: true } },
      semester: {
        include: { academicYear: { select: { name: true } } },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exam Schedule</h1>
        <p className="text-muted-foreground">
          Upcoming and past examination timetable.
        </p>
      </div>

      <Card>
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
              {exams.map((exam) => (
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
                </TableRow>
              ))}
              {exams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No exams scheduled.
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
