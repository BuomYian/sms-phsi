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

export const metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const subjects = await db.subject.findMany({
    include: {
      program: { select: { name: true, code: true } },
    },
    orderBy: [
      { program: { name: "asc" } },
      { semesterNumber: "asc" },
      { code: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">
            All course subjects across programs.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/academics/subjects/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
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
                <TableHead>Program</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-mono">{subject.code}</TableCell>
                  <TableCell>
                    <Link
                      href={`/academics/subjects/${subject.id}`}
                      className="font-medium hover:underline"
                    >
                      {subject.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {subject.program
                      ? `${subject.program.name} (${subject.program.code})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.semesterNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.creditHours}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subject.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No subjects yet.
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
