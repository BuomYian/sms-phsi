import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  // Get recent attendance records
  const recentAttendance = await db.attendance.findMany({
    take: 50,
    include: {
      courseEnrollment: {
        include: {
          subject: { select: { name: true, code: true } },
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

  // Summary stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [presentToday, absentToday, lateToday] = await Promise.all([
    db.attendance.count({ where: { date: today, status: "PRESENT" } }),
    db.attendance.count({ where: { date: today, status: "ABSENT" } }),
    db.attendance.count({ where: { date: today, status: "LATE" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Track and manage student attendance.
        </p>
      </div>

      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{presentToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{absentToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{lateToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
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
                  <TableCell>
                    <p className="text-sm">
                      {record.courseEnrollment.subject.code}
                    </p>
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    No attendance records yet.
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
