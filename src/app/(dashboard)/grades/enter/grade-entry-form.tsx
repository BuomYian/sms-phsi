"use client";

import { useActionState, useState, useEffect } from "react";
import { submitGradeAction, type GradeActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Subject = {
  id: string;
  code: string;
  name: string;
  courseEnrollments: {
    id: string;
    enrollment: {
      student: {
        studentIdNumber: string;
        user: { fullName: string };
      };
    };
    grade: {
      caMarks: number | null;
      examMarks: number | null;
      totalMarks: number | null;
      gradeLetter: string | null;
      status: string;
    } | null;
  }[];
};

export default function GradeEntryForm({ subjects }: { subjects: Subject[] }) {
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const subject = subjects.find((s) => s.id === selectedSubject);
  const enrollments = subject?.courseEnrollments ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a subject to grade" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>
              {subject?.code} — {subject?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28 text-center">CA (0-40)</TableHead>
                  <TableHead className="w-28 text-center">
                    Exam (0-60)
                  </TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No students enrolled in this subject.
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((ce) => (
                    <GradeRow key={ce.id} courseEnrollment={ce} />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GradeRow({
  courseEnrollment,
}: {
  courseEnrollment: Subject["courseEnrollments"][0];
}) {
  const initialState: GradeActionState = {};
  const [state, formAction, isPending] = useActionState(
    submitGradeAction,
    initialState,
  );
  const [ca, setCa] = useState(
    courseEnrollment.grade?.caMarks?.toString() ?? "",
  );
  const [exam, setExam] = useState(
    courseEnrollment.grade?.examMarks?.toString() ?? "",
  );

  const caNum = parseFloat(ca);
  const examNum = parseFloat(exam);
  const total = !isNaN(caNum) && !isNaN(examNum) ? caNum + examNum : null;

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">
        {courseEnrollment.enrollment.student.studentIdNumber}
      </TableCell>
      <TableCell>{courseEnrollment.enrollment.student.user.fullName}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          max={40}
          step={0.5}
          value={ca}
          onChange={(e) => setCa(e.target.value)}
          className="h-8 text-center"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          max={60}
          step={0.5}
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          className="h-8 text-center"
        />
      </TableCell>
      <TableCell className="text-center font-medium">
        {total !== null ? total.toFixed(1) : "—"}
      </TableCell>
      <TableCell className="text-center">
        {courseEnrollment.grade?.gradeLetter ? (
          <Badge variant="outline">{courseEnrollment.grade.gradeLetter}</Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-center">
        {courseEnrollment.grade?.status ? (
          <Badge
            variant={
              courseEnrollment.grade.status === "APPROVED"
                ? "default"
                : "secondary"
            }
          >
            {courseEnrollment.grade.status}
          </Badge>
        ) : (
          <Badge variant="outline">NEW</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <form action={formAction}>
          <input
            type="hidden"
            name="courseEnrollmentId"
            value={courseEnrollment.id}
          />
          <input type="hidden" name="caMarks" value={ca} />
          <input type="hidden" name="examMarks" value={exam} />
          <Button type="submit" size="sm" disabled={isPending || !ca || !exam}>
            {isPending ? "…" : "Submit"}
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}
