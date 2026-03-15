import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Settings2,
  CreditCard,
  PlusCircle,
  Receipt,
  Award,
  BarChart2,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Fees & Finance" };

export default async function FeesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "FINANCE";
  const isStudent = session.role === "STUDENT";

  // If student, redirect to my-fees
  if (isStudent) redirect("/fees/my-fees");

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

  type Section = {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: string;
    roles: string[];
  };

  const sections: Section[] = [
    {
      title: "Fee Structures",
      description: "Set up tuition and other fee categories",
      icon: Settings2,
      href: "/fees/structures",
      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
    },
    {
      title: "Student Accounts",
      description:
        outstanding > 0
          ? `${formatCurrency(outstanding)} outstanding`
          : "No fees yet",
      icon: CreditCard,
      href: "/fees/accounts",
      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
    },
    {
      title: "Record Payment",
      description: "Record a new student payment",
      icon: PlusCircle,
      href: "/fees/payments/new",
      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
    },
    {
      title: "Payment History",
      description: `${paymentsCount} payments recorded`,
      icon: Receipt,
      href: "/fees/payments",
      badge: paymentsCount > 0 ? `${paymentsCount} total` : undefined,
      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
    },
    {
      title: "Scholarships",
      description: `${scholarshipsCount} active scholarships`,
      icon: Award,
      href: "/fees/scholarships",
      badge: scholarshipsCount > 0 ? `${scholarshipsCount} active` : undefined,
      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
    },
    {
      title: "Fee Reports",
      description: "Financial summaries and analytics",
      icon: BarChart2,
      href: "/fees/reports",
      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
    },
    {
      title: "My Fees",
      description: "View your fee summary and payment history",
      icon: Wallet,
      href: "/fees/my-fees",
      roles: ["STUDENT"],
    },
  ];

  const visibleSections = isAdmin
    ? sections.filter((s) => !s.roles.includes("STUDENT"))
    : sections.filter((s) => s.roles.includes(session.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees & Finance</h1>
        <p className="text-muted-foreground">
          Manage fee structures, payments, and scholarships.
        </p>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Billed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(billed)}</p>
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
                {formatCurrency(paid)}
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
                {formatCurrency(outstanding)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleSections.map((s) => (
          <Card key={s.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{s.title}</CardTitle>
              {s.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {s.badge}
                </Badge>
              )}
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
