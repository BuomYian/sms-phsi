"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEnrollmentAction, type EnrollmentActionState } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { DEFAULT_MAX_CREDIT_HOURS } from "@/constants";
import { BookOpen, GraduationCap } from "lucide-react";

type StudentOption = {
  id: string;
  studentIdNumber: string;
  fullName: string;
  programId: string;
};

type SemesterOption = {
  id: string;
  name: string;
  academicYearName: string;
  isCurrent: boolean;
};

type SubjectOption = {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  semesterNumber: number;
  type: string;
  programId: string;
  programName: string;
};

export default function EnrollmentForm({
  students,
  semesters,
  subjects,
  selfStudentId,
}: {
  students: StudentOption[];
  semesters: SemesterOption[];
  subjects: SubjectOption[];
  selfStudentId: string | null;
}) {
  const router = useRouter();
  const initialState: EnrollmentActionState = {};
  const [state, formAction, isPending] = useActionState(
    createEnrollmentAction,
    initialState,
  );

  const [selectedStudentId, setSelectedStudentId] = useState(
    selfStudentId ?? "",
  );
  const [selectedSemesterId, setSelectedSemesterId] = useState(
    () => semesters.find((s) => s.isCurrent)?.id ?? "",
  );

  function handleStudentChange(value: string) {
    setSelectedStudentId(value);
    setSelectedSubjectIds(new Set());
  }
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push("/enrollment");
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  // Get the selected student's program to filter subjects
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Filter subjects by student's program
  const filteredSubjects = useMemo(() => {
    let result = subjects;
    if (selectedStudent) {
      result = result.filter((s) => s.programId === selectedStudent.programId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
      );
    }
    return result;
  }, [subjects, selectedStudent, search]);

  // Calculate total credits
  const totalCredits = useMemo(() => {
    return subjects
      .filter((s) => selectedSubjectIds.has(s.id))
      .reduce((sum, s) => sum + s.creditHours, 0);
  }, [subjects, selectedSubjectIds]);

  const maxCredits = DEFAULT_MAX_CREDIT_HOURS;
  const creditExceeded = totalCredits > maxCredits;

  function toggleSubject(subjectId: string) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedSubjectIds(new Set(filteredSubjects.map((s) => s.id)));
  }

  function clearAll() {
    setSelectedSubjectIds(new Set());
  }

  // Group filtered subjects by semester number
  const groupedSubjects = useMemo(() => {
    const groups: Record<number, SubjectOption[]> = {};
    for (const s of filteredSubjects) {
      if (!groups[s.semesterNumber]) groups[s.semesterNumber] = [];
      groups[s.semesterNumber].push(s);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([num, subs]) => ({ semesterNumber: Number(num), subjects: subs }));
  }, [filteredSubjects]);

  return (
    <form action={formAction}>
      {/* Hidden fields for subject selection (selects use name prop directly) */}
      {Array.from(selectedSubjectIds).map((id) => (
        <input key={id} type="hidden" name="subjectIds" value={id} />
      ))}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Student & Semester selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Details</CardTitle>
              <CardDescription>
                Select the student and semester.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student select */}
              <div className="space-y-2">
                <Label>Student *</Label>
                {selfStudentId ? (
                  <div className="rounded-md border p-3">
                    <p className="font-medium">{selectedStudent?.fullName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedStudent?.studentIdNumber}
                    </p>
                    <input
                      type="hidden"
                      name="studentId"
                      value={selfStudentId}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="hidden"
                      name="studentId"
                      value={selectedStudentId}
                    />
                    <Select
                      defaultValue={selectedStudentId || undefined}
                      onValueChange={handleStudentChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.fullName} ({s.studentIdNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              {/* Semester select */}
              <div className="space-y-2">
                <Label>Semester *</Label>
                <input
                  type="hidden"
                  name="semesterId"
                  value={selectedSemesterId}
                />
                <Select
                  defaultValue={selectedSemesterId || undefined}
                  onValueChange={setSelectedSemesterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.academicYearName} — {s.name}
                        {s.isCurrent ? " (Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Credit Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Credit Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Selected Subjects
                </span>
                <span className="font-medium flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {selectedSubjectIds.size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Credits
                </span>
                <span
                  className={`font-bold text-lg ${creditExceeded ? "text-destructive" : ""}`}
                >
                  {totalCredits} / {maxCredits}
                </span>
              </div>
              {creditExceeded && (
                <p className="text-xs text-destructive">
                  Maximum credit hours exceeded.
                </p>
              )}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${creditExceeded ? "bg-destructive" : "bg-primary"}`}
                  style={{
                    width: `${Math.min((totalCredits / maxCredits) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isPending ||
              !selectedStudentId ||
              selectedSubjectIds.size === 0 ||
              creditExceeded
            }
          >
            {isPending ? (
              "Submitting..."
            ) : (
              <>
                <GraduationCap className="mr-2 h-4 w-4" />
                Submit Enrollment
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/enrollment")}
          >
            Cancel
          </Button>
        </div>

        {/* Right: Subject selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Subjects</CardTitle>
                  <CardDescription>
                    {selectedStudent
                      ? "Showing subjects for the student's program."
                      : "Select a student first to see available subjects."}
                  </CardDescription>
                </div>
                {selectedStudent && filteredSubjects.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              {selectedStudent && (
                <div className="pt-2">
                  <Input
                    placeholder="Search subjects by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <GraduationCap className="h-10 w-10 mb-3 opacity-50" />
                  <p>Select a student to view available subjects.</p>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No subjects found for this program.
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
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">
                              Credits
                            </TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.subjects.map((subject) => (
                            <TableRow
                              key={subject.id}
                              className="cursor-pointer"
                              onClick={() => toggleSubject(subject.id)}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedSubjectIds.has(subject.id)}
                                  onCheckedChange={() =>
                                    toggleSubject(subject.id)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {subject.code}
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
        </div>
      </div>
    </form>
  );
}
