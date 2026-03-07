import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  DollarSign,
  ClipboardCheck,
  BookOpen,
  BarChart3,
} from "lucide-react";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [studentCount, staffCount, programCount, paymentCount] =
    await Promise.all([
      db.student.count(),
      db.staff.count(),
      db.program.count(),
      db.payment.count(),
    ]);

  const reportCards = [
    {
      title: "Student Report",
      description: `${studentCount} students total — enrollment, demographics, and status analytics`,
      icon: GraduationCap,
      href: "/reports/students",
    },
    {
      title: "Staff Report",
      description: `${staffCount} staff members — department distribution and roles`,
      icon: Users,
      href: "/reports/staff",
    },
    {
      title: "Academic Report",
      description: `${programCount} programs — performance, grades, and pass rates`,
      icon: BookOpen,
      href: "/reports/academic",
    },
    {
      title: "Financial Report",
      description: `${paymentCount} payments — collections, outstanding, and projections`,
      icon: DollarSign,
      href: "/reports/financial",
    },
    {
      title: "Attendance Report",
      description: "Attendance trends, rates, and low-attendance flags",
      icon: ClipboardCheck,
      href: "/reports/attendance",
    },
    {
      title: "Summary Dashboard",
      description: "High-level institutional KPIs and charts",
      icon: BarChart3,
      href: "/reports/summary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Institutional analytics and downloadable reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((r) => (
          <Card key={r.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <r.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {r.description}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={r.href}>View Report →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
