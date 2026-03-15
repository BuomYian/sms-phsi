"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateEnrollmentSubjectsAction,
  type EnrollmentActionState,
} from "../../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BookOpen } from "lucide-react";

type SubjectOption = {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  semesterNumber: number;
  type: string;
};

export default function EnrollmentEditForm({
  enrollmentId,
  studentName,
  programName,
  subjects,
  currentSubjectIds,
}: {
  enrollmentId: string;
  studentName: string;
  programName: string;
  subjects: SubjectOption[];
  currentSubjectIds: string[];
}) {
  const router = useRouter();
  const initialState: EnrollmentActionState = {};
  const boundAction = updateEnrollmentSubjectsAction.bind(null, enrollmentId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    () => new Set(currentSubjectIds),
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push(`/enrollment/${enrollmentId}`);
    }
    if (state?.error) toast.error(state.error);
  }, [state, router, enrollmentId]);

  const filteredSubjects = useMemo(() => {
    if (!search) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
    );
  }, [subjects, search]);

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

  // Group by semester number
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
      {Array.from(selectedSubjectIds).map((id) => (
        <input key={id} type="hidden" name="subjectIds" value={id} />
      ))}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Program</span>
                <span className="font-medium">{programName}</span>
              </div>
            </CardContent>
          </Card>

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
              isPending || selectedSubjectIds.size === 0 || creditExceeded
            }
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/enrollment/${enrollmentId}`)}
          >
            Cancel
          </Button>
        </div>

        {/* Right: Subject selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                Update the subjects for this enrollment.
              </CardDescription>
              <div className="pt-2">
                <Input
                  placeholder="Search subjects by name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {groupedSubjects.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No subjects found.
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
