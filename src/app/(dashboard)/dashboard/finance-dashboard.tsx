"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  CreditCard,
  PlusCircle,
  Receipt,
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { type SessionUser } from "@/types";

interface FinanceStats {
  totalBilled: number;
  totalCollected: number;
  pendingPayments: number;
}

export function FinanceDashboard({
  stats,
  user,
}: {
  stats: FinanceStats;
  user: SessionUser;
}) {
  const collectionRate =
    stats.totalBilled > 0
      ? Math.round((stats.totalCollected / stats.totalBilled) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here&apos;s the financial overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Billed"
          value={formatCurrency(stats.totalBilled)}
          icon={Wallet}
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(stats.totalCollected)}
          description={`${collectionRate}% collection rate`}
          icon={CreditCard}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.totalBilled - stats.totalCollected)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={Receipt}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/fees/payments/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/fees/accounts">
                <CreditCard className="mr-2 h-4 w-4" />
                Student Accounts
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/fees/reports">
                <BarChart2 className="mr-2 h-4 w-4" />
                Fee Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
