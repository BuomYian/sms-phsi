import { db } from "@/lib/db";
import { summariseFeeAggregate } from "@/lib/fees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    feeAgg,
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
    db.studentFee.aggregate({
      _sum: { amountCharged: true, amountPaid: true, balance: true },
    }),
    db.attendance.count(),
    db.attendance.count({ where: { status: { in: ["PRESENT", "LATE"] } } }),
  ]);

  const feeSummary = summariseFeeAggregate(feeAgg._sum);
  const { billed, paid, waived, outstanding } = feeSummary;
  const attendanceRate =
    attendanceCount > 0
      ? ((presentCount / attendanceCount) * 100).toFixed(1)
      : "0";
  const collectionRate = feeSummary.collectionRate.toFixed(1);

  const kpis: { label: string; value: string; color?: string }[] = [
    { label: "Total Students", value: studentCount.toString() },
    {
      label: "Active Students",
      value: activeStudents.toString(),
      color: "text-green-600",
    },
    { label: "Staff Members", value: staffCount.toString() },
    { label: "Active Programs", value: programCount.toString() },
    { label: "Enrollments", value: enrollmentCount.toString() },
    { label: "Approved Grades", value: gradeCount.toString() },
    { label: "Payments Recorded", value: paymentCount.toString() },
    { label: "Total Billed", value: formatCurrency(billed) },
    {
      label: "Sponsored",
      value: formatCurrency(waived),
      color: "text-emerald-600",
    },
    {
      label: "Total Collected",
      value: formatCurrency(paid),
      color: "text-green-600",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstanding),
      color: outstanding > 0 ? "text-red-600" : "text-green-600",
    },
  ];

  const rateKpis = [
    {
      label: "Collection Rate",
      value: Number(collectionRate),
      color:
        Number(collectionRate) >= 75
          ? "bg-green-500"
          : Number(collectionRate) >= 50
            ? "bg-amber-500"
            : "bg-red-500",
    },
    {
      label: "Attendance Rate",
      value: Number(attendanceRate),
      color:
        Number(attendanceRate) >= 75
          ? "bg-green-500"
          : Number(attendanceRate) >= 50
            ? "bg-amber-500"
            : "bg-red-500",
    },
  ];

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
            Summary Dashboard
          </h1>
          <p className="text-muted-foreground">
            Key institutional performance indicators.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpi.color ?? ""}`}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rateKpis.map((r) => (
          <Card key={r.label}>
            <CardHeader>
              <CardTitle>{r.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${r.color}`}
                    style={{ width: `${r.value}%` }}
                  />
                </div>
                <span className="text-2xl font-bold min-w-20 text-right">
                  {r.value.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
