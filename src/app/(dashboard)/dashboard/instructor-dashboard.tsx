"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ClipboardCheck, PenLine } from "lucide-react";
import Link from "next/link";
import { type SessionUser } from "@/types";

interface InstructorStats {
  assignedSubjects: number;
  upcomingClasses: number;
}

export function InstructorDashboard({
  stats,
  user,
}: {
  stats: InstructorStats | null;
  user: SessionUser;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Your teaching overview for this semester.
        </p>
      </div>

      {stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Assigned Subjects"
              value={stats.assignedSubjects}
              icon={BookOpen}
            />
            <StatCard
              title="Scheduled Classes"
              value={stats.upcomingClasses}
              icon={Clock}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/attendance">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/grades/enter">
                    <PenLine className="mr-2 h-4 w-4" />
                    Enter Grades
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/timetable">
                    <Clock className="mr-2 h-4 w-4" />
                    View Timetable
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No staff profile linked to your account yet. Please contact the
              administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
