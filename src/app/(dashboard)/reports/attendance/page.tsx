import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Attendance Report" };

export default async function AttendanceReportPage() {
  const [totalRecords, present, absent, late, excused] = await Promise.all([
    db.attendance.count(),
    db.attendance.count({ where: { status: "PRESENT" } }),
    db.attendance.count({ where: { status: "ABSENT" } }),
    db.attendance.count({ where: { status: "LATE" } }),
    db.attendance.count({ where: { status: "EXCUSED" } }),
  ]);

  const rate =
    totalRecords > 0
      ? (((present + late) / totalRecords) * 100).toFixed(1)
      : "0";

  // Attendance by subject
  const bySubjectRaw = await db.attendance.groupBy({
    by: ["courseEnrollmentId"],
    _count: true,
    where: { status: { in: ["PRESENT", "LATE"] } },
  });
  const totalBySubjectRaw = await db.attendance.groupBy({
    by: ["courseEnrollmentId"],
    _count: true,
  });

  // Get subject info via course enrollments
  const ceIds = totalBySubjectRaw.map((r) => r.courseEnrollmentId);
  const courseEnrollments = await db.courseEnrollment.findMany({
    where: { id: { in: ceIds } },
    select: {
      id: true,
      subjectId: true,
      subject: { select: { name: true, code: true } },
    },
  });
  const ceMap = new Map(courseEnrollments.map((ce) => [ce.id, ce]));

  // Aggregate by subject
  const subjectStats = new Map<
    string,
    { name: string; code: string; attended: number; total: number }
  >();
  for (const r of totalBySubjectRaw) {
    const ce = ceMap.get(r.courseEnrollmentId);
    if (!ce) continue;
    const key = ce.subjectId;
    const existing = subjectStats.get(key) ?? {
      name: ce.subject.name,
      code: ce.subject.code,
      attended: 0,
      total: 0,
    };
    existing.total += r._count;
    subjectStats.set(key, existing);
  }
  for (const r of bySubjectRaw) {
    const ce = ceMap.get(r.courseEnrollmentId);
    if (!ce) continue;
    const existing = subjectStats.get(ce.subjectId);
    if (existing) existing.attended += r._count;
  }
  const subjectList = [...subjectStats.values()]
    .map((s) => ({
      ...s,
      rate: s.total > 0 ? (s.attended / s.total) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Attendance Report
          </h1>
          <p className="text-muted-foreground">
            Attendance statistics and trends.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Total Records", value: totalRecords, color: "" },
          { label: "Present", value: present, color: "text-green-600" },
          { label: "Absent", value: absent, color: "text-red-600" },
          { label: "Late", value: late, color: "text-amber-600" },
          { label: "Excused", value: excused, color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Attendance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className={`h-full rounded ${Number(rate) >= 75 ? "bg-green-500" : Number(rate) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-2xl font-bold min-w-20 text-right">
              {rate}%
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Present + Late counts as attended. Target: 75%.
          </p>
        </CardContent>
      </Card>

      {subjectList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectList.map((s) => (
                <div key={s.code} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {s.code}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {s.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${s.rate >= 75 ? "bg-green-500" : s.rate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
