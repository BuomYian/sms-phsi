import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Academic Calendar" };

export default async function AcademicCalendarPage() {
  const academicYears = await db.academicYear.findMany({
    include: {
      semesters: { orderBy: { startDate: "asc" } },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
        <p className="text-muted-foreground">
          Academic years and semester schedules.
        </p>
      </div>

      {academicYears.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No academic years configured yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {academicYears.map((ay) => (
          <Card key={ay.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{ay.name}</CardTitle>
                {ay.isCurrent && <Badge>Current</Badge>}
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
                      {sem.isCurrent && <Badge variant="outline">Active</Badge>}
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
        ))}
      </div>
    </div>
  );
}
