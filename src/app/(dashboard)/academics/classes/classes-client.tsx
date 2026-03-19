"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { createClassAction, type ClassActionState } from "./actions";

interface ClassItem {
  id: string;
  name: string;
  yearLevel: number;
  programName: string;
  programCode: string;
  academicYearName: string;
  studentCount: number;
}

interface Program {
  id: string;
  name: string;
  code: string;
  durationSemesters: number;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export function ClassesClient({
  classes,
  programs,
  academicYears,
}: {
  classes: ClassItem[];
  programs: Program[];
  academicYears: AcademicYear[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedAY, setSelectedAY] = useState(
    () => academicYears.find((a) => a.isCurrent)?.id ?? "",
  );
  const [selectedYear, setSelectedYear] = useState("");

  const initialState: ClassActionState = {};
  const [, formAction, isPending] = useActionState(
    async (prev: ClassActionState, formData: FormData) => {
      const result = await createClassAction(prev, formData);
      if (result?.success) {
        toast.success(result.message);
        setDialogOpen(false);
        setSelectedProgram("");
        setSelectedYear("");
      }
      if (result?.error) toast.error(result.error);
      return result;
    },
    initialState,
  );

  const program = programs.find((p) => p.id === selectedProgram);
  const maxYears = program ? Math.ceil(program.durationSemesters / 2) : 3;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            Manage year-level class cohorts and enroll students.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Program *</Label>
                <Select
                  name="programId"
                  defaultValue={selectedProgram || undefined}
                  onValueChange={setSelectedProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Select
                  name="academicYearId"
                  defaultValue={selectedAY || undefined}
                  onValueChange={setSelectedAY}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay) => (
                      <SelectItem key={ay.id} value={ay.id}>
                        {ay.name}
                        {ay.isCurrent ? " (Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year Level *</Label>
                <Select
                  name="yearLevel"
                  defaultValue={selectedYear || undefined}
                  onValueChange={setSelectedYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxYears }, (_, i) => i + 1).map(
                      (y) => (
                        <SelectItem key={y} value={String(y)}>
                          Year {y}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating..." : "Create Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-50" />
            <p>No classes created yet.</p>
            <p className="text-xs">Create your first class to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cls.programCode}</Badge>
                  </TableCell>
                  <TableCell>Year {cls.yearLevel}</TableCell>
                  <TableCell>{cls.academicYearName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{cls.studentCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/academics/classes/${cls.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
