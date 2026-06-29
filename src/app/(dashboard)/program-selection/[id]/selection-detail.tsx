"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_COLORS } from "@/constants";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { approveProgramSelection, rejectProgramSelection } from "../actions";
import { toast } from "sonner";

type Props = {
  selection: {
    id: string;
    status: string;
    notes: string | null;
    createdAt: Date;
    reviewedAt: Date | null;
    student: {
      studentIdNumber: string;
      yearOfStudy: number;
      user: { fullName: string; email: string };
      program: { name: string };
    };
    requestedProgram: { name: string };
    reviewer: { fullName: string } | null;
  };
};

export default function SelectionDetail({ selection }: Props) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const isPending = selection.status === "PENDING";

  function handleApprove() {
    startTransition(async () => {
      const result = await approveProgramSelection(selection.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Programme selection approved.");
      }
    });
  }

  function handleReject() {
    if (!rejectNotes.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    startTransition(async () => {
      const result = await rejectProgramSelection(selection.id, rejectNotes);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Programme selection rejected.");
        setShowRejectForm(false);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/program-selection">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programme Selection Request</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Name" value={selection.student.user.fullName} />
          <Row label="Email" value={selection.student.user.email} />
          <Row label="Student ID" value={selection.student.studentIdNumber} />
          <Row label="Current Programme" value={selection.student.program.name} />
          <Row label="Year of Study" value={`Year ${selection.student.yearOfStudy}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Requested Programme" value={selection.requestedProgram.name} bold />
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground w-36">Status</span>
            <Badge className={STATUS_COLORS[selection.status]}>{selection.status}</Badge>
          </div>
          <Row label="Submitted" value={formatDate(selection.createdAt)} />
          {selection.reviewedAt && (
            <Row
              label="Reviewed"
              value={`${formatDate(selection.reviewedAt)}${selection.reviewer ? ` by ${selection.reviewer.fullName}` : ""}`}
            />
          )}
          {selection.notes && <Row label="Notes" value={selection.notes} />}
        </CardContent>
      </Card>

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={pending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {pending ? "Processing..." : "Approve"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                  disabled={pending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Reason for rejection (required)..."
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={pending}
                  >
                    {pending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
