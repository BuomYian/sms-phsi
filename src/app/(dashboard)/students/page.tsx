import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { StudentsDataTable } from "./students-data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserPlus, Upload, Building2, ChevronDown, Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const session = await getSession();
  if (!session) return null;

  // Parents should only access individual student detail pages
  if (session.role === "PARENT") redirect("/dashboard");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";

  // --- Instructor: only fetch students in programs they teach ---
  let instructorProgramIds: string[] = [];
  if (isInstructor) {
    const staff = await db.staff.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (staff) {
      const assignments = await db.subjectInstructor.findMany({
        where: { staffId: staff.id },
        select: { subject: { select: { programId: true } } },
      });
      instructorProgramIds = [
        ...new Set(assignments.map((a) => a.subject.programId)),
      ];
    }
  }

  const where = isInstructor ? { programId: { in: instructorProgramIds } } : {};

  const students = await db.student.findMany({
    where,
    include: {
      program: {
        select: {
          name: true,
          code: true,
          department: { select: { name: true } },
        },
      },
      user: { select: { fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // --- Instructor: group by department → year ---
  if (isInstructor) {
    type StudentRow = (typeof students)[number];
    const grouped = new Map<string, Map<number, StudentRow[]>>();

    for (const s of students) {
      const dept = s.program?.department?.name ?? "Unknown Department";
      if (!grouped.has(dept)) grouped.set(dept, new Map());
      const deptMap = grouped.get(dept)!;
      const year = s.yearOfStudy;
      if (!deptMap.has(year)) deptMap.set(year, []);
      deptMap.get(year)!.push(s);
    }

    const sortedDepts = [...grouped.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Students</h1>
          <p className="text-muted-foreground">
            Students in the programs you teach, grouped by department and year.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sortedDepts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Programs</CardTitle>
              <Badge variant="secondary">{instructorProgramIds.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instructorProgramIds.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {sortedDepts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No students found. You may not have any subject assignments yet.
            </CardContent>
          </Card>
        )}

        {sortedDepts.map(([dept, yearMap]) => {
          const sortedYears = [...yearMap.entries()].sort(
            (a, b) => a[0] - b[0],
          );
          const deptTotal = sortedYears.reduce(
            (sum, [, arr]) => sum + arr.length,
            0,
          );

          return (
            <Collapsible key={dept} defaultOpen>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{dept}</CardTitle>
                      <Badge variant="secondary">{deptTotal} students</Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {sortedYears.map(([year, yearStudents]) => (
                      <div key={year}>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            Year {year}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {yearStudents.length}
                          </Badge>
                        </div>
                        <StudentsDataTable
                          data={yearStudents}
                          isAdmin={isAdmin}
                          searchPlaceholder={`Search Year ${year} students...`}
                          pageSize={5}
                        />
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // --- Admin / other roles: default view ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and admissions.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/students/import">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/students/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Link>
            </Button>
          </div>
        )}
      </div>

      <StudentsDataTable data={students} isAdmin={isAdmin} />
    </div>
  );
}
