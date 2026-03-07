import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Report</h1>
        <p className="text-muted-foreground">
          Attendance statistics and trends.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Total Records", value: totalRecords },
          { label: "Present", value: present },
          { label: "Absent", value: absent },
          { label: "Late", value: late },
          { label: "Excused", value: excused },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
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
                className="h-full bg-green-500 rounded"
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-2xl font-bold min-w-[5rem] text-right">
              {rate}%
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Present + Late counts as attended. Target: 75%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
