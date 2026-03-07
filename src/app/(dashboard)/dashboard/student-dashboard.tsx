"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardList, Award, Wallet, Clock } from "lucide-react";
import Link from "next/link";
import { type SessionUser } from "@/types";

interface StudentStats {
  enrollmentCount: number;
  averageScore: number | null;
}

export function StudentDashboard({
  stats,
  user,
}: {
  stats: StudentStats | null;
  user: SessionUser;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Your academic overview for this semester.
        </p>
      </div>

      {stats ? (
        <>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                    View Timetable
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
