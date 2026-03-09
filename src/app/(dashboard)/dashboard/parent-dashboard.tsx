"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Wallet,
  Calendar,
  Megaphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type SessionUser } from "@/types";

interface ChildInfo {
  id: string;
  name: string;
  studentId: string;
  program: string;
  status: string;
  enrollmentStatus: string;
  fees: { total: number; paid: number; balance: number };
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

interface ParentStats {
  children: ChildInfo[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SS", {
    style: "currency",
    currency: "SSP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  SUSPENDED: "bg-red-50 text-red-700",
  GRADUATED: "bg-blue-50 text-blue-700",
  WITHDRAWN: "bg-gray-50 text-gray-600",
};

export function ParentDashboard({
  stats,
  shared,
  user,
}: {
  stats: ParentStats;
  shared: SharedData;
  user: SessionUser;
}) {
  const currentSemester = shared.academic?.semesters.find((s) => s.isCurrent);
  const totalBalance = stats.children.reduce((s, c) => s + c.fees.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Monitor your children&apos;s progress.
          {shared.academic && (
            <span className="ml-1 font-medium text-foreground">
              {shared.academic.yearName}
              {currentSemester && ` — ${currentSemester.name}`}
            </span>
          )}
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.children.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Fee Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.children.filter((c) => c.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Details */}
      {stats.children.length > 0 ? (
        <div className="space-y-4">
          {stats.children.map((child) => {
            const paidPercent =
              child.fees.total > 0
                ? Math.round((child.fees.paid / child.fees.total) * 100)
                : 0;
            return (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GraduationCap className="h-4 w-4" />
                      {child.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={statusColor[child.status] ?? ""}
                    >
                      {child.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Student ID:</span>{" "}
                      <span className="font-medium">{child.studentId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>{" "}
                      <span className="font-medium">{child.program}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Enrollment:</span>{" "}
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        {child.enrollmentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Fees: {formatCurrency(child.fees.paid)} /{" "}
                        {formatCurrency(child.fees.total)}
                      </span>
                      <span className="font-medium text-orange-500">
                        Balance: {formatCurrency(child.fees.balance)}
                      </span>
                    </div>
                    <Progress value={paidPercent} />
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/students/${child.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No linked students found. Please contact the registrar&apos;s
              office to link your children to your account.
            </p>
          </CardContent>
        </Card>
      )}

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
