"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  Building2,
  UserPlus,
  ClipboardList,
  Settings,
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
}

export function AdminDashboard({
  stats,
  user,
}: {
  stats: AdminStats;
  user: SessionUser;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your institution.
        </p>
      </div>

      {/* Stat Cards */}
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
