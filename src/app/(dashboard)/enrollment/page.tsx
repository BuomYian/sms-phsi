import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export const metadata = { title: "Enrollment" };

export default async function EnrollmentPage() {
  const enrollments = await db.enrollment.findMany({
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
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enrollment</h1>
        <p className="text-muted-foreground">
          Student enrollments by semester.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
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
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {enrollment.student.user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {enrollment.student.studentIdNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.semester.academicYear.name}</TableCell>
                  <TableCell>{enrollment.semester.name}</TableCell>
                  <TableCell className="text-center">
                    {enrollment._count.courseEnrollments}
                  </TableCell>
                  <TableCell className="text-center">—</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[enrollment.status]}
                    >
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(enrollment.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No enrollments yet.
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
