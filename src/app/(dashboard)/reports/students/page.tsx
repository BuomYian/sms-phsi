import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  const maxProgramCount = Math.max(...byProgram.map((bp) => bp._count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Report</h1>
          <p className="text-muted-foreground">
            Student enrollment and demographic analytics.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: total, color: "" },
          { label: "Active", value: active, color: "text-green-600" },
          { label: "Graduated", value: graduated, color: "text-blue-600" },
          { label: "Suspended", value: suspended, color: "text-amber-600" },
          { label: "Withdrawn", value: withdrawn, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
            <div className="space-y-4">
              {byGender.map((g) => {
                const pct = total > 0 ? (g._count / total) * 100 : 0;
                return (
                  <div key={g.gender} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{g.gender}</span>
                      <span className="text-sm text-muted-foreground">
                        {g._count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
                const pct = (bp._count / maxProgramCount) * 100;
                return (
                  <div key={bp.programId} className="space-y-1">
                    <div className="flex justify-between items-center">
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
                    <div className="h-3 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
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
