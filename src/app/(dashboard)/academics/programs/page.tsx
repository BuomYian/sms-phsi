import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export const metadata = { title: "Programs" };

export default async function ProgramsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const programs = await db.program.findMany({
    include: {
      department: { select: { name: true } },
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">
            Academic programs and diplomas offered by PHSI.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" asChild>
            <Link href="/academics/programs/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Program
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Subjects</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-mono">{program.code}</TableCell>
                  <TableCell>
                    <Link
                      href={`/academics/programs/${program.id}`}
                      className="font-medium hover:underline"
                    >
                      {program.name}
                    </Link>
                  </TableCell>
                  <TableCell>{program.department?.name ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    {program.durationSemesters} sem
                  </TableCell>
                  <TableCell className="text-center">
                    {program.totalCredits}
                  </TableCell>
                  <TableCell className="text-center">
                    {program._count.students}
                  </TableCell>
                  <TableCell className="text-center">
                    {program._count.subjects}
                  </TableCell>
                  <TableCell>
                    <Badge variant={program.isActive ? "default" : "secondary"}>
                      {program.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No programs yet.
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
