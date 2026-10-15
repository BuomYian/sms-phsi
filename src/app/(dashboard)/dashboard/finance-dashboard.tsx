"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  CreditCard,
  PlusCircle,
  Receipt,
  BarChart2,
  AlertTriangle,
  Calendar,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { type SessionUser } from "@/types";

interface FinanceStats {
  totalBilled: number;
  totalCollected: number;
  totalWaived: number;
  outstanding: number;
  netBilled: number;
  collectionRate: number;
  unpaidStudents: number;
  recentPayments: {
    id: string;
    studentName: string;
    amount: number;
    method: string;
    receiptNumber: string;
    date: string;
  }[];
}

interface SharedData {
  academic: {
    yearName: string;
    startDate: string;
    endDate: string;
    semesters: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      isCurrent: boolean;
    }[];
  } | null;
  announcements: {
    id: string;
    title: string;
    body: string;
    author: string;
    publishDate: string;
    targetAudience: string;
  }[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
}

export function FinanceDashboard({
  stats,
  shared,
  user,
}: {
  stats: FinanceStats;
  shared: SharedData;
  user: SessionUser;
}) {
  const collectionRate = Math.round(stats.collectionRate);

  const currentSemester = shared.academic?.semesters.find((s) => s.isCurrent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}.
          {shared.academic && (
            <span className="ml-1 font-medium text-foreground">
              {shared.academic.yearName}
              {currentSemester && ` — ${currentSemester.name}`}
            </span>
          )}
        </p>
      </div>

      {/* Stat Cards */}
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
          value={formatCurrency(stats.outstanding)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Unpaid Students"
          value={stats.unpaidStudents}
          description={`${formatCurrency(stats.totalWaived)} sponsored`}
          icon={Receipt}
        />
      </div>

      {/* Collection Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Collected: {formatCurrency(stats.totalCollected)}</span>
              <span>Collectible: {formatCurrency(stats.netBilled)}</span>
            </div>
            <Progress value={collectionRate} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {collectionRate}% of collectible fees collected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments + Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPayments.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.receiptNumber} · {p.method.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(p.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

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

      {/* Academic Calendar + Announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Academic Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shared.academic ? (
              <>
                <div>
                  <p className="text-sm font-medium">
                    {shared.academic.yearName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(shared.academic.startDate)} —{" "}
                    {formatDate(shared.academic.endDate)}
                  </p>
                </div>
                <div className="space-y-2">
                  {shared.academic.semesters.map((sem) => (
                    <div
                      key={sem.id}
                      className={`rounded-lg border p-2 text-sm ${
                        sem.isCurrent
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sem.name}</span>
                        {sem.isCurrent && (
                          <Badge variant="default" className="text-[10px]">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sem.startDate)} — {formatDate(sem.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No academic year configured.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" />
              Announcements
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/announcements">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {shared.announcements.length > 0 ? (
              <div className="space-y-3">
                {shared.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <h4 className="text-sm font-medium leading-tight">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ann.body}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ann.author} · {timeAgo(ann.publishDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No announcements yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
