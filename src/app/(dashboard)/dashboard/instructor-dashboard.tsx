"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  ClipboardCheck,
  PenLine,
  Calendar,
  Megaphone,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { type SessionUser } from "@/types";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface TimetableItem {
  id: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
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

interface InstructorStats {
  assignedSubjects: number;
  upcomingClasses: number;
  timetable: TimetableItem[];
  attendanceMarked: number;
  pendingGrades: number;
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

export function InstructorDashboard({
  stats,
  shared,
  user,
}: {
  stats: InstructorStats | null;
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
          Your teaching overview.
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
              title="Assigned Subjects"
              value={stats.assignedSubjects}
              icon={BookOpen}
            />
            <StatCard
              title="Scheduled Classes"
              value={stats.upcomingClasses}
              icon={Clock}
            />
            <StatCard
              title="Attendance Marked"
              value={stats.attendanceMarked}
              description="Last 30 days"
              icon={UserCheck}
            />
            <StatCard
              title="Pending Grades"
              value={stats.pendingGrades}
              description={
                stats.pendingGrades > 0 ? "Need submission" : "All up to date"
              }
              icon={AlertCircle}
            />
          </div>

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
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border p-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{t.subjectCode}</span>
                          <span className="ml-1 text-muted-foreground">
                            {t.subjectName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">
                            {DAY_NAMES[t.dayOfWeek]}
                          </Badge>
                          <span>
                            {t.startTime}–{t.endTime}
                          </span>
                          <span>Rm {t.room}</span>
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
                    View Full Timetable
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Academic Calendar + Announcements */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Academic Calendar */}
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

            {/* Announcements */}
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
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-tight">
                            {ann.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            {ann.targetAudience}
                          </Badge>
                        </div>
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
              No staff profile linked to your account yet. Please contact the
              administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
