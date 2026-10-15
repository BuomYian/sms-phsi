"use client";

import {
  approveGradeAction,
  rejectGradeAction,
  bulkApproveGradesAction,
} from "../actions";
import AmendGradeDialog from "../amend-grade-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STATUS_COLORS } from "@/constants";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useTransition } from "react";

type GradeRow = {
  id: string;
  caMarks: number | null;
  examMarks: number | null;
  totalMarks: number | null;
  gradeLetter: string | null;
  status: string;
  previousCaMarks: number | null;
  previousExamMarks: number | null;
  previousTotalMarks: number | null;
  previousGradeLetter: string | null;
  amendedDate: Date | null;
  amendmentReason: string | null;
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
  amender: { fullName: string } | null;
};

export default function GradeReviewClient({
  grades,
  showBulkSelect,
}: {
  grades: GradeRow[];
  showBulkSelect: boolean;
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
      {showBulkSelect && selected.size > 0 && (
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
              {showBulkSelect && (
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
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showBulkSelect ? 10 : 9}
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
                  showBulkSelect={showBulkSelect}
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
  showBulkSelect,
  isSelected,
  onToggle,
}: {
  grade: GradeRow;
  showBulkSelect: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();

  // The previous* fields only carry meaning once the grade has been amended.
  const wasAmended = grade.amendedDate !== null;

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
      {showBulkSelect && (
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
      <TableCell className="text-center">
        {grade.caMarks ?? "—"}
        {wasAmended && grade.previousCaMarks !== null && (
          <span className="block text-xs text-muted-foreground line-through">
            {grade.previousCaMarks}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {grade.examMarks ?? "—"}
        {wasAmended && grade.previousExamMarks !== null && (
          <span className="block text-xs text-muted-foreground line-through">
            {grade.previousExamMarks}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center font-medium">
        {grade.totalMarks ?? "—"}
        {wasAmended && grade.previousTotalMarks !== null && (
          <span className="block text-xs font-normal text-muted-foreground line-through">
            {grade.previousTotalMarks}
            {grade.previousGradeLetter ? ` (${grade.previousGradeLetter})` : ""}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline">{grade.gradeLetter}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {grade.submitter?.fullName ?? "—"}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Badge
            variant="secondary"
            className={STATUS_COLORS[grade.status] ?? ""}
          >
            {grade.status}
          </Badge>
          {wasAmended && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  Amended
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Amended by {grade.amender?.fullName ?? "—"} on{" "}
                {formatDateTime(grade.amendedDate!)}
                {grade.amendmentReason ? ` — ${grade.amendmentReason}` : ""}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {grade.status === "SUBMITTED" ? (
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
        ) : grade.status === "APPROVED" || grade.status === "PUBLISHED" ? (
          <div className="flex justify-end">
            <AmendGradeDialog
              grade={{
                id: grade.id,
                caMarks: grade.caMarks,
                examMarks: grade.examMarks,
                totalMarks: grade.totalMarks,
                gradeLetter: grade.gradeLetter,
                status: grade.status,
                previousTotalMarks: grade.previousTotalMarks,
                previousGradeLetter: grade.previousGradeLetter,
                amendedDate: grade.amendedDate,
                amendmentReason: grade.amendmentReason,
                studentName:
                  grade.courseEnrollment.enrollment.student.user.fullName,
                subjectCode: grade.courseEnrollment.subject.code,
              }}
            />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
