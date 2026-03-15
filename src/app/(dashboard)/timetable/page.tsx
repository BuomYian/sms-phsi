import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAYS_OF_WEEK } from "@/constants";
import { CalendarDays, Clock, Grid3X3, List, MapPin, Plus } from "lucide-react";
import WeeklyGrid from "./weekly-grid";

export const metadata = { title: "Timetable" };

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; view?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";
  const isStudent = session.role === "STUDENT";

  // Get semesters for filter
  const semesters = await db.semester.findMany({
    include: { academicYear: { select: { name: true } } },
    orderBy: [{ academicYear: { startDate: "desc" } }, { startDate: "asc" }],
  });

  // Default to the current semester
  const currentSemester = semesters.find((s) => s.isCurrent);
  const activeSemesterId = params.semester || currentSemester?.id || "";

  // Build where clause
  const where: Record<string, unknown> = {};
  if (activeSemesterId) {
    where.semesterId = activeSemesterId;
  }

  // Instructors see only their own entries
  if (isInstructor) {
    const staff = await db.staff.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (staff) {
      where.instructorId = staff.id;
    }
  }

  // Students see entries for subjects in their active enrollment
  if (isStudent) {
    const student = await db.student.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (student && activeSemesterId) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          studentId: student.id,
          semesterId: activeSemesterId,
          status: { in: ["APPROVED", "CONDITIONAL"] },
        },
        include: {
          courseEnrollments: { select: { subjectId: true } },
        },
      });
      if (enrollment) {
        where.subjectId = {
          in: enrollment.courseEnrollments.map((ce) => ce.subjectId),
        };
      } else {
        where.subjectId = { in: [] };
      }
    }
  }

  const entries = await db.timetableEntry.findMany({
    where,
    include: {
      subject: { select: { name: true, code: true } },
      instructor: {
        include: { user: { select: { fullName: true } } },
      },
      semester: {
        include: { academicYear: { select: { name: true } } },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  // Group by day
  const byDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    entries: entries.filter((e) => e.dayOfWeek === index),
  }));

  const totalEntries = entries.length;
  const activeSemesterLabel = activeSemesterId
    ? semesters.find((s) => s.id === activeSemesterId)
    : null;
  const activeView = params.view || "list";
  const semesterParam = params.semester ? `&semester=${params.semester}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground">
            {isInstructor
              ? "Your weekly teaching schedule."
              : isStudent
                ? "Your weekly class schedule."
                : "Weekly class schedule overview."}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/timetable/new">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        )}
      </div>

      {/* Summary & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            {activeSemesterLabel
              ? `${activeSemesterLabel.academicYear.name} — ${activeSemesterLabel.name}`
              : "All semesters"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {totalEntries} class{totalEntries !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      {/* Semester filter */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center text-sm text-muted-foreground mr-2">
          Semester:
        </span>
        <Link href="/timetable">
          <Badge
            variant={!params.semester ? "default" : "outline"}
            className="cursor-pointer"
          >
            Current
          </Badge>
        </Link>
        {semesters.map((s) => (
          <Link key={s.id} href={`/timetable?semester=${s.id}`}>
            <Badge
              variant={
                activeSemesterId === s.id && params.semester
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer"
            >
              {s.academicYear.name} — {s.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <Link href={`/timetable?view=list${semesterParam}`}>
          <Button
            variant={activeView === "list" ? "default" : "outline"}
            size="sm"
          >
            <List className="mr-1.5 h-4 w-4" />
            List
          </Button>
        </Link>
        <Link href={`/timetable?view=grid${semesterParam}`}>
          <Button
            variant={activeView === "grid" ? "default" : "outline"}
            size="sm"
          >
            <Grid3X3 className="mr-1.5 h-4 w-4" />
            Grid
          </Button>
        </Link>
      </div>

      {/* Day cards (list view) */}
      {activeView === "list" ? (
        <div className="space-y-4">
          {byDay.map(({ day, entries: dayEntries }) => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{day}</CardTitle>
                  <Badge variant="secondary">
                    {dayEntries.length} class
                    {dayEntries.length !== 1 ? "es" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {dayEntries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Room</TableHead>
                        {isAdmin && (
                          <TableHead className="w-[80px]">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-sm">
                            {entry.startTime} — {entry.endTime}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {entry.subject.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.subject.code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.instructor.user.fullName}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {entry.room}
                            </span>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/timetable/${entry.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No classes scheduled.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <WeeklyGrid entries={entries} />
      )}
    </div>
  );
}
