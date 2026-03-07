import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Summary Dashboard" };

export default async function SummaryReportPage() {
  const [
    studentCount,
    activeStudents,
    staffCount,
    programCount,
    enrollmentCount,
    gradeCount,
    paymentCount,
    billedAgg,
    paidAgg,
    attendanceCount,
    presentCount,
  ] = await Promise.all([
    db.student.count(),
    db.student.count({ where: { status: "ACTIVE" } }),
    db.staff.count(),
    db.program.count({ where: { isActive: true } }),
    db.enrollment.count(),
    db.grade.count({ where: { status: "APPROVED" } }),
    db.payment.count(),
    db.studentFee.aggregate({ _sum: { amountCharged: true } }),
    db.studentFee.aggregate({ _sum: { amountPaid: true } }),
    db.attendance.count(),
    db.attendance.count({ where: { status: { in: ["PRESENT", "LATE"] } } }),
  ]);

  const billed = Number(billedAgg._sum.amountCharged ?? 0);
  const paid = Number(paidAgg._sum.amountPaid ?? 0);
  const attendanceRate =
    attendanceCount > 0
      ? ((presentCount / attendanceCount) * 100).toFixed(1)
      : "0";
  const collectionRate = billed > 0 ? ((paid / billed) * 100).toFixed(1) : "0";

  const kpis = [
    { label: "Total Students", value: studentCount.toString() },
    { label: "Active Students", value: activeStudents.toString() },
    { label: "Staff Members", value: staffCount.toString() },
    { label: "Active Programs", value: programCount.toString() },
    { label: "Enrollments", value: enrollmentCount.toString() },
    { label: "Approved Grades", value: gradeCount.toString() },
    { label: "Payments Recorded", value: paymentCount.toString() },
    { label: "Total Billed", value: formatCurrency(billed, "SSP") },
    { label: "Total Collected", value: formatCurrency(paid, "SSP") },
    { label: "Outstanding", value: formatCurrency(billed - paid, "SSP") },
    { label: "Collection Rate", value: `${collectionRate}%` },
    { label: "Attendance Rate", value: `${attendanceRate}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Summary Dashboard</h1>
        <p className="text-muted-foreground">
          Key institutional performance indicators.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
