"use client";

import {
  approveGradeAction,
  rejectGradeAction,
  bulkApproveGradesAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { STATUS_COLORS } from "@/constants";
import { toast } from "sonner";
import { useState, useTransition } from "react";

type GradeRow = {
  id: string;
  caMarks: number | null;
  examMarks: number | null;
  totalMarks: number | null;
  gradeLetter: string | null;
  status: string;
  courseEnrollment: {
    subject: { id: string; code: string; name: string };
    enrollment: {
      student: {
        studentIdNumber: string;
        user: { fullName: string };
      };
    };
  };
  submitter: { fullName: string } | null;
};

export default function GradeReviewClient({
  grades,
  showActions,
}: {
  grades: GradeRow[];
  showActions: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();

  const allSelected = grades.length > 0 && selected.size === grades.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(grades.map((g) => g.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkApprove() {
    if (selected.size === 0) return;
    startBulkTransition(async () => {
      const result = await bulkApproveGradesAction(Array.from(selected));
      if (result.success) {
        toast.success(result.message);
        setSelected(new Set());
      }
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Card>
      {showActions && selected.size > 0 && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {selected.size} grade{selected.size !== 1 ? "s" : ""} selected
            </CardTitle>
            <Button
              size="sm"
              disabled={bulkPending}
              onClick={handleBulkApprove}
            >
              {bulkPending ? "Approving…" : "Approve Selected"}
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {showActions && (
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
              )}
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-center">CA</TableHead>
              <TableHead className="text-center">Exam</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead>Submitted By</TableHead>
              {!showActions && (
                <TableHead className="text-center">Status</TableHead>
              )}
              {showActions && (
                <TableHead className="text-right">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 9 : 9}
                  className="h-24 text-center"
                >
                  No grades found.
                </TableCell>
              </TableRow>
            ) : (
              grades.map((g) => (
                <ReviewRow
                  key={g.id}
                  grade={g}
                  showActions={showActions}
                  isSelected={selected.has(g.id)}
                  onToggle={() => toggle(g.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReviewRow({
  grade,
  showActions,
  isSelected,
  onToggle,
}: {
  grade: GradeRow;
  showActions: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveGradeAction(grade.id);
      if (result.success) toast.success(result.message);
      if (result.error) toast.error(result.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectGradeAction(grade.id);
      if (result.success) toast.success(result.message);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <TableRow>
      {showActions && (
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={onToggle} />
        </TableCell>
      )}
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
      <TableCell className="text-sm text-muted-foreground">
        {grade.submitter?.fullName ?? "—"}
      </TableCell>
      {!showActions && (
        <TableCell className="text-center">
          <Badge
            variant="secondary"
            className={STATUS_COLORS[grade.status] ?? ""}
          >
            {grade.status}
          </Badge>
        </TableCell>
      )}
      {showActions && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleReject}
            >
              {pending ? "…" : "Reject"}
            </Button>
            <Button size="sm" disabled={pending} onClick={handleApprove}>
              {pending ? "…" : "Approve"}
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
