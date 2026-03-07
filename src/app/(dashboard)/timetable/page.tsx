import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAYS_OF_WEEK } from "@/constants";

export const metadata = { title: "Timetable" };

export default async function TimetablePage() {
  const entries = await db.timetableEntry.findMany({
    include: {
      subject: { select: { name: true, code: true } },
      instructor: {
        include: {
          user: { select: { fullName: true } },
        },
      },
      semester: {
        include: { academicYear: { select: { name: true } } },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  // Group by day
  const byDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    entries: entries.filter((e) => e.dayOfWeek === index),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground">Weekly class schedule overview.</p>
      </div>

      {byDay.map(({ day, entries: dayEntries }) => (
        <Card key={day}>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold">{day}</h3>
            </div>
            {dayEntries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">
                        {entry.startTime} — {entry.endTime}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.subject.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.subject.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.instructor
                          ? entry.instructor.user.fullName
                          : "—"}
                      </TableCell>
                      <TableCell>{entry.room || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No classes scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
