import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Student Report" };

export default async function StudentReportPage() {
  const [total, active, graduated, suspended, withdrawn] = await Promise.all([
    db.student.count(),
    db.student.count({ where: { status: "ACTIVE" } }),
    db.student.count({ where: { status: "GRADUATED" } }),
    db.student.count({ where: { status: "SUSPENDED" } }),
    db.student.count({ where: { status: "WITHDRAWN" } }),
  ]);

  const byGender = await db.student.groupBy({
    by: ["gender"],
    _count: true,
  });

  const byProgram = await db.student.groupBy({
    by: ["programId"],
    _count: true,
    where: { status: "ACTIVE" },
  });

  const programs = await db.program.findMany({
    select: { id: true, name: true, code: true },
  });
  const programMap = new Map(programs.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Report</h1>
        <p className="text-muted-foreground">
          Student enrollment and demographic analytics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: total },
          { label: "Active", value: active },
          { label: "Graduated", value: graduated },
          { label: "Suspended", value: suspended },
          { label: "Withdrawn", value: withdrawn },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byGender.map((g) => (
                <div
                  key={g.gender}
                  className="flex justify-between items-center"
                >
                  <span className="font-medium">{g.gender}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{g._count}</span>
                    <span className="text-sm text-muted-foreground">
                      ({total > 0 ? ((g._count / total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Students by Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byProgram.map((bp) => {
                const prog = programMap.get(bp.programId);
                return (
                  <div
                    key={bp.programId}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">
                        {prog?.name ?? bp.programId}
                      </span>
                      {prog && (
                        <Badge variant="outline" className="ml-2">
                          {prog.code}
                        </Badge>
                      )}
                    </div>
                    <span className="font-mono">{bp._count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
