import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Plus } from "lucide-react";

export const metadata = { title: "Academic Calendar" };

export default async function AcademicCalendarPage() {
  const [session, academicYears] = await Promise.all([
    getSession(),
    db.academicYear.findMany({
      include: {
        semesters: { orderBy: { startDate: "asc" } },
        _count: { select: { semesters: true } },
      },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Academic Calendar
          </h1>
          <p className="text-muted-foreground">
            Academic years and semester schedules.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/academics/calendar/new">
              <Plus className="mr-2 h-4 w-4" /> New Academic Year
            </Link>
          </Button>
        )}
      </div>

      {academicYears.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p>No academic years configured yet.</p>
            {isAdmin && (
              <Button variant="link" asChild className="mt-2">
                <Link href="/academics/calendar/new">
                  Create your first academic year
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {academicYears.map((ay) => (
          <Link
            key={ay.id}
            href={`/academics/calendar/${ay.id}`}
            className="block"
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{ay.name}</CardTitle>
                    {ay.isCurrent && <Badge>Current</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {ay._count.semesters} semester
                    {ay._count.semesters !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(ay.startDate)} — {formatDate(ay.endDate)}
                </p>
              </CardHeader>
              <CardContent>
                {ay.semesters.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {ay.semesters.map((sem) => (
                      <div
                        key={sem.id}
                        className="rounded-lg border p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{sem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(sem.startDate)} —{" "}
                            {formatDate(sem.endDate)}
                          </p>
                        </div>
                        {sem.isCurrent && (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No semesters configured.
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
