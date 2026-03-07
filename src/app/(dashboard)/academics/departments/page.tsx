import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  const departments = await db.department.findMany({
    include: {
      headOfDepartment: { include: { user: { select: { fullName: true } } } },
      _count: { select: { staff: true, programs: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Academic departments at PHSI.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/academics/departments/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Head</TableHead>
                <TableHead className="text-center">Programs</TableHead>
                <TableHead className="text-center">Staff</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-mono">{dept.code}</TableCell>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    {dept.headOfDepartment
                      ? (dept.headOfDepartment.user?.fullName ?? "—")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {dept._count.programs}
                  </TableCell>
                  <TableCell className="text-center">
                    {dept._count.staff}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No departments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
