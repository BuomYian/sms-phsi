"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  ClipboardList,
  Award,
  Wallet,
  Clock,
  Calendar,
  Megaphone,
  UserCheck,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { type SessionUser } from "@/types";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

interface StudentStats {
  studentId: string;
  status: string;
  enrollmentCount: number;
  averageScore: number | null;
  finance: {
    totalFees: number;
    totalPaid: number;
    balance: number;
    unpaidCount: number;
  };
  timetable: {
    id: string;
    subjectName: string;
    subjectCode: string;
    instructor: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string;
  }[];
  attendance: {
    present: number;
    total: number;
    rate: number;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

export function StudentDashboard({
  stats,
  shared,
  user,
}: {
  stats: StudentStats | null;
  shared: SharedData;
  user: SessionUser;
}) {
  const currentSemester = shared.academic?.semesters.find((s) => s.isCurrent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Your academic overview.
          {shared.academic && (
            <span className="ml-1 font-medium text-foreground">
              {shared.academic.yearName}
              {currentSemester && ` — ${currentSemester.name}`}
            </span>
          )}
        </p>
      </div>

      {stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Enrolled Semesters"
              value={stats.enrollmentCount}
              icon={ClipboardList}
            />
            {stats.averageScore !== null && (
              <StatCard
                title="Average Score"
                value={`${stats.averageScore}%`}
                icon={Award}
              />
            )}
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendance.rate}%`}
              description={`${stats.attendance.present}/${stats.attendance.total} classes`}
              icon={UserCheck}
            />
            <StatCard
              title="Fee Balance"
              value={formatCurrency(stats.finance.balance)}
              description={
                stats.finance.unpaidCount > 0
                  ? `${stats.finance.unpaidCount} unpaid`
                  : "All fees cleared"
              }
              icon={DollarSign}
            />
          </div>

          {/* Fee Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" />
                Fee Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fees</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(stats.finance.totalFees)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(stats.finance.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold text-orange-500">
                    {formatCurrency(stats.finance.balance)}
                  </p>
                </div>
              </div>
              {stats.finance.totalFees > 0 && (
                <div className="mt-3">
                  <Progress
                    value={Math.round(
                      (stats.finance.totalPaid / stats.finance.totalFees) * 100,
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      (stats.finance.totalPaid / stats.finance.totalFees) * 100,
                    )}
                    % paid
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timetable + Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  My Timetable
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.timetable.length > 0 ? (
                  <div className="space-y-2">
                    {stats.timetable.map((t) => (
                      <div key={t.id} className="rounded-lg border p-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{t.subjectCode}</span>
                            <span className="ml-1 text-muted-foreground">
                              {t.subjectName}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {DAY_NAMES[t.dayOfWeek]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {t.startTime}–{t.endTime}
                          </span>
                          <span>Rm {t.room}</span>
                          <span>{t.instructor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No timetable entries for the current semester.
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
                  <Link href="/grades/my-results">
                    <Award className="mr-2 h-4 w-4" />
                    View My Results
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/timetable">
                    <Clock className="mr-2 h-4 w-4" />
                    View Full Timetable
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/fees/my-fees">
                    <Wallet className="mr-2 h-4 w-4" />
                    View My Fees
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/enrollment">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Enrollment
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
                            {formatDate(sem.startDate)} —{" "}
                            {formatDate(sem.endDate)}
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
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No student profile linked to your account yet. Please contact the
              registrar&apos;s office.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
