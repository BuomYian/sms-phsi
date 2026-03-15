"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  Building2,
  UserPlus,
  ClipboardList,
  Settings,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Megaphone,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { type SessionUser } from "@/types";

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  totalPrograms: number;
  totalDepartments: number;
  recentActivity: {
    id: string;
    action: string;
    target: string;
    timestamp: string;
    type: "info" | "success" | "warning" | "error";
  }[];
  finance: {
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    pendingFees: number;
    collectionRate: number;
  };
  enrollment: {
    pending: number;
    approved: number;
  };
  academic: {
    yearName: string;
    startDate: string;
    endDate: string;
    semesters: {
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
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(dateStr);
}

export function AdminDashboard({
  stats,
  user,
}: {
  stats: AdminStats;
  user: SessionUser;
}) {
  const currentSemester = stats.academic?.semesters.find((s) => s.isCurrent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your institution.
          {stats.academic && (
            <span className="ml-1 font-medium text-foreground">
              {stats.academic.yearName}
              {currentSemester && ` — ${currentSemester.name}`}
            </span>
          )}
        </p>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          description={`${stats.activeStudents} currently active`}
          icon={GraduationCap}
        />
        <StatCard
          title="Total Staff"
          value={stats.totalStaff}
          icon={Briefcase}
        />
        <StatCard
          title="Programs"
          value={stats.totalPrograms}
          icon={BookOpen}
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={Building2}
        />
      </div>

      {/* Finance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.finance.totalBilled)}
            </div>
            <p className="text-xs text-muted-foreground">
              All student fees this period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collected
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.finance.totalCollected)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.finance.collectionRate}% collection rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(stats.finance.outstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.finance.pendingFees} unpaid fee records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collection Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.finance.collectionRate}%
            </div>
            <Progress value={stats.finance.collectionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Enrollment + Attendance + Academic Calendar */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Enrollment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Enrollment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {stats.enrollment.pending}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Approved</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {stats.enrollment.approved}
              </Badge>
            </div>
            {stats.enrollment.pending > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                asChild
              >
                <Link href="/enrollment">Review Pending Enrollments</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Attendance Overview (Last 30 days) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4" />
              Attendance (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.attendance.rate}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
            <Progress value={stats.attendance.rate} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.attendance.present} present</span>
              <span>{stats.attendance.total} total records</span>
            </div>
          </CardContent>
        </Card>

        {/* Academic Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Academic Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.academic ? (
              <>
                <div>
                  <p className="text-sm font-medium">
                    {stats.academic.yearName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(stats.academic.startDate)} —{" "}
                    {formatDate(stats.academic.endDate)}
                  </p>
                </div>
                <div className="space-y-2">
                  {stats.academic.semesters.map((sem) => (
                    <div
                      key={sem.name}
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
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" />
            Recent Announcements
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/announcements">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.announcements.length > 0 ? (
            <div className="space-y-4">
              {stats.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium leading-tight">
                      {ann.title}
                    </h4>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {ann.targetAudience}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ann.body}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{ann.author}</span>
                    <span>·</span>
                    <span>{timeAgo(ann.publishDate)}</span>
                  </div>
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

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/students/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Register New Student
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/staff/new">
                <Users className="mr-2 h-4 w-4" />
                Add New Staff
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/enrollment">
                <ClipboardList className="mr-2 h-4 w-4" />
                Manage Enrollment
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/announcements">
                <Megaphone className="mr-2 h-4 w-4" />
                Manage Announcements
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <RecentActivity activities={stats.recentActivity} />
      </div>
    </div>
  );
}
