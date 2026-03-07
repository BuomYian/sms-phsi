import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Staff Report" };

export default async function StaffReportPage() {
  const [total, byDept, byRole] = await Promise.all([
    db.staff.count(),
    db.staff.groupBy({ by: ["departmentId"], _count: true }),
    db.user.groupBy({
      by: ["role"],
      _count: true,
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN", "FINANCE", "INSTRUCTOR"] },
      },
    }),
  ]);

  const departments = await db.department.findMany({
    select: { id: true, name: true },
  });
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Report</h1>
        <p className="text-muted-foreground">
          Staff distribution across departments and roles.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{total}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byDept.map((d) => (
                <div
                  key={d.departmentId ?? "unassigned"}
                  className="flex justify-between"
                >
                  <span className="font-medium">
                    {(d.departmentId && deptMap.get(d.departmentId)) ??
                      "Unassigned"}
                  </span>
                  <span className="font-mono">{d._count}</span>
                </div>
              ))}
              {byDept.length === 0 && (
                <p className="text-sm text-muted-foreground">No data.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byRole.map((r) => (
                <div key={r.role} className="flex justify-between items-center">
                  <Badge variant="outline">{r.role}</Badge>
                  <span className="font-mono">{r._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
