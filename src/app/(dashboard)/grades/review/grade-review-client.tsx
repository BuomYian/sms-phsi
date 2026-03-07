"use client";

import { approveGradeAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useTransition } from "react";

type GradeRow = {
  id: string;
  caMarks: number | null;
  examMarks: number | null;
  totalMarks: number | null;
  gradeLetter: string | null;
  courseEnrollment: {
    subject: { code: string; name: string };
    enrollment: {
      student: {
        studentIdNumber: string;
        user: { fullName: string };
      };
    };
  };
  submitter: { fullName: string } | null;
};

export default function GradeReviewClient({ grades }: { grades: GradeRow[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-center">CA</TableHead>
              <TableHead className="text-center">Exam</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No grades pending review.
                </TableCell>
              </TableRow>
            ) : (
              grades.map((g) => <ReviewRow key={g.id} grade={g} />)
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReviewRow({ grade }: { grade: GradeRow }) {
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveGradeAction(grade.id);
      if (result.success) toast.success(result.message);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">
            {grade.courseEnrollment.enrollment.student.user.fullName}
          </p>
          <p className="text-xs text-muted-foreground">
            {grade.courseEnrollment.enrollment.student.studentIdNumber}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{grade.courseEnrollment.subject.name}</p>
          <p className="text-xs text-muted-foreground">
            {grade.courseEnrollment.subject.code}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-center">{grade.caMarks ?? "—"}</TableCell>
      <TableCell className="text-center">{grade.examMarks ?? "—"}</TableCell>
      <TableCell className="text-center font-medium">
        {grade.totalMarks ?? "—"}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline">{grade.gradeLetter}</Badge>
      </TableCell>
      <TableCell>{grade.submitter?.fullName ?? "—"}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" disabled={pending} onClick={handleApprove}>
          {pending ? "…" : "Approve"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
