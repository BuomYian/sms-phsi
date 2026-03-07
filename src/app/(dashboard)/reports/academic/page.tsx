import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Academic Report" };

export default async function AcademicReportPage() {
  const programs = await db.program.findMany({
    include: {
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: "asc" },
  });

  const gradeDistribution = await db.grade.groupBy({
    by: ["gradeLetter"],
    _count: true,
    where: { status: "APPROVED", gradeLetter: { not: null } },
  });

  const totalGraded = gradeDistribution.reduce((s, g) => s + g._count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academic Report</h1>
        <p className="text-muted-foreground">
          Program performance and grade distributions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programs Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {programs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.code}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>{p._count.students}</strong> students
                  </span>
                  <span>
                    <strong>{p._count.subjects}</strong> subjects
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution (Approved)</CardTitle>
        </CardHeader>
        <CardContent>
          {gradeDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved grades yet.
            </p>
          ) : (
            <div className="space-y-3">
              {["A", "B+", "B", "C+", "C", "D", "F"].map((letter) => {
                const item = gradeDistribution.find(
                  (g) => g.gradeLetter === letter,
                );
                const count = item?._count ?? 0;
                const pct = totalGraded > 0 ? (count / totalGraded) * 100 : 0;
                return (
                  <div key={letter} className="flex items-center gap-3">
                    <Badge variant="outline" className="w-10 justify-center">
                      {letter}
                    </Badge>
                    <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-16 text-right">
                      {count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
