import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Settings2,
  CreditCard,
  PlusCircle,
  Receipt,
  Award,
  BarChart2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Fees & Finance" };

export default async function FeesPage() {
  const [totalBilled, totalPaid, paymentsCount, scholarshipsCount] =
    await Promise.all([
      db.studentFee.aggregate({ _sum: { amountCharged: true } }),
      db.studentFee.aggregate({ _sum: { amountPaid: true } }),
      db.payment.count(),
      db.scholarship.count(),
    ]);

  const billed = Number(totalBilled._sum.amountCharged ?? 0);
  const paid = Number(totalPaid._sum.amountPaid ?? 0);
  const outstanding = billed - paid;

  const sections = [
    {
      title: "Fee Structures",
      description: `Set up tuition and other fee categories`,
      icon: Settings2,
      href: "/fees/structures",
    },
    {
      title: "Student Accounts",
      description: `${formatCurrency(outstanding, "SSP")} outstanding`,
      icon: CreditCard,
      href: "/fees/accounts",
    },
    {
      title: "Record Payment",
      description: "Record a new student payment",
      icon: PlusCircle,
      href: "/fees/payments/new",
    },
    {
      title: "Payment History",
      description: `${paymentsCount} payments recorded`,
      icon: Receipt,
      href: "/fees/payments",
    },
    {
      title: "Scholarships",
      description: `${scholarshipsCount} active scholarships`,
      icon: Award,
      href: "/fees/scholarships",
    },
    {
      title: "Fee Reports",
      description: "Financial summaries and analytics",
      icon: BarChart2,
      href: "/fees/reports",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees & Finance</h1>
        <p className="text-muted-foreground">
          Manage fee structures, payments, and scholarships.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(billed, "SSP")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(paid, "SSP")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(outstanding, "SSP")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {s.description}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={s.href}>Open →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
