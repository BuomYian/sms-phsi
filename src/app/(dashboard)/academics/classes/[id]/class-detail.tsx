"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Users,
  BookOpen,
  UserPlus,
  ArrowUpRight,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import {
  enrollStudentsInClassAction,
  removeStudentFromClassAction,
  promoteStudentsAction,
} from "../actions";

interface ClassInfo {
  id: string;
  name: string;
  yearLevel: number;
  programName: string;
  programCode: string;
  academicYearName: string;
  isLastYear: boolean;
}

interface ClassStudentItem {
  classStudentId: string;
  studentId: string;
  studentIdNumber: string;
  fullName: string;
  email: string;
  status: string;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  semesterNumber: number;
  type: string;
  instructors: { name: string; semester: string }[];
}

interface AvailableStudent {
  id: string;
  studentIdNumber: string;
  fullName: string;
}

interface ClassDetailProps {
  cls: ClassInfo;
  students: ClassStudentItem[];
  subjects: SubjectItem[];
  availableStudents: AvailableStudent[];
}

export function ClassDetail({
  cls,
  students,
  subjects,
  availableStudents,
}: ClassDetailProps) {
  const [isPending, startTransition] = useTransition();

  // Enroll dialog
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [enrollSearch, setEnrollSearch] = useState("");

  // Promote dialog
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteStudents, setPromoteStudents] = useState<Set<string>>(
    new Set(),
  );

  const activeStudents = students.filter((s) => s.status === "ACTIVE");

  const filteredAvailable = enrollSearch
    ? availableStudents.filter(
        (s) =>
          s.fullName.toLowerCase().includes(enrollSearch.toLowerCase()) ||
          s.studentIdNumber.toLowerCase().includes(enrollSearch.toLowerCase()),
      )
    : availableStudents;

  function toggleStudent(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  function handleEnroll() {
    if (selectedStudents.size === 0) return;
    startTransition(async () => {
      const result = await enrollStudentsInClassAction(
        cls.id,
        Array.from(selectedStudents),
      );
      if (result.success) {
        toast.success(result.message);
        setEnrollOpen(false);
        setSelectedStudents(new Set());
        setEnrollSearch("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(classStudentId: string) {
    startTransition(async () => {
      const result = await removeStudentFromClassAction(classStudentId, cls.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  function handlePromote() {
    if (promoteStudents.size === 0) return;
    startTransition(async () => {
      const result = await promoteStudentsAction(
        cls.id,
        Array.from(promoteStudents),
      );
      if (result.success) {
        toast.success(result.message);
        setPromoteOpen(false);
        setPromoteStudents(new Set());
      } else {
        toast.error(result.error);
      }
    });
  }

  // Group subjects by semester
  const groupedSubjects: { semesterNumber: number; subjects: SubjectItem[] }[] =
    [];
  const semMap: Record<number, SubjectItem[]> = {};
  for (const s of subjects) {
    if (!semMap[s.semesterNumber]) semMap[s.semesterNumber] = [];
    semMap[s.semesterNumber].push(s);
  }
  for (const [num, subs] of Object.entries(semMap).sort(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    groupedSubjects.push({ semesterNumber: Number(num), subjects: subs });
  }

  const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/academics/classes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <p className="text-sm text-muted-foreground">
              {cls.programName} ({cls.programCode}) · {cls.academicYearName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeStudents.length > 0 && (
            <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {cls.isLastYear ? (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Graduate Students
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Promote Students
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {cls.isLastYear
                      ? "Graduate Students"
                      : `Promote to Year ${cls.yearLevel + 1}`}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {cls.isLastYear
                      ? "Select students to mark as graduated."
                      : `Select students to promote to Year ${cls.yearLevel + 1}.`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPromoteStudents(
                          new Set(activeStudents.map((s) => s.studentId)),
                        )
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPromoteStudents(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {activeStudents.map((s) => (
                      <label
                        key={s.studentId}
                        className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={promoteStudents.has(s.studentId)}
                          onCheckedChange={() =>
                            setPromoteStudents(
                              toggleStudent(promoteStudents, s.studentId),
                            )
                          }
                        />
                        <div>
                          <p className="text-sm font-medium">{s.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {s.studentIdNumber}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handlePromote}
                    disabled={promoteStudents.size === 0 || isPending}
                    className="w-full"
                  >
                    {isPending
                      ? "Processing..."
                      : cls.isLastYear
                        ? `Graduate ${promoteStudents.size} Student(s)`
                        : `Promote ${promoteStudents.size} Student(s)`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-lg font-bold">{activeStudents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Subjects</p>
              <p className="text-lg font-bold">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold">{totalCredits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Students ({activeStudents.length})
          </CardTitle>
          <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enroll Students into {cls.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Search by name or ID..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                />
                {availableStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No available students for this program.
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedStudents(
                            new Set(filteredAvailable.map((s) => s.id)),
                          )
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudents(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredAvailable.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={selectedStudents.has(s.id)}
                            onCheckedChange={() =>
                              setSelectedStudents(
                                toggleStudent(selectedStudents, s.id),
                              )
                            }
                          />
                          <div>
                            <p className="text-sm font-medium">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {s.studentIdNumber}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                <Button
                  onClick={handleEnroll}
                  disabled={selectedStudents.size === 0 || isPending}
                  className="w-full"
                >
                  {isPending
                    ? "Enrolling..."
                    : `Enroll ${selectedStudents.size} Student(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No students enrolled yet. Click &quot;Enroll Students&quot; to add
              students.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.classStudentId}>
                    <TableCell className="font-mono text-sm">
                      {s.studentIdNumber}
                    </TableCell>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "ACTIVE"
                            ? "default"
                            : s.status === "COMPLETED"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === "ACTIVE" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Student
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {s.fullName} from {cls.name}? This only
                                removes the class membership, not their
                                enrollment records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemove(s.classStudentId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subjects & Instructors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Subjects & Instructors ({subjects.length} subjects)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No subjects found for Year {cls.yearLevel}.
            </p>
          ) : (
            <div className="space-y-6">
              {groupedSubjects.map((group) => (
                <div key={group.semesterNumber}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Semester {group.semesterNumber}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Credits</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Instructor(s)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-mono text-sm">
                            <Link
                              href={`/academics/subjects/${subject.id}`}
                              className="text-primary hover:underline"
                            >
                              {subject.code}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">
                            {subject.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {subject.creditHours}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                subject.type === "CORE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {subject.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {subject.instructors.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {subject.instructors.map((inst, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {inst.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Not assigned
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
