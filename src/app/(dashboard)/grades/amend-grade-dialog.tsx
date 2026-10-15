"use client";

import { useActionState, useState } from "react";
import { amendGradeAction, type GradeActionState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

type AmendableGrade = {
  id: string;
  caMarks: number | null;
  examMarks: number | null;
  totalMarks: number | null;
  gradeLetter: string | null;
  status: string;
  previousTotalMarks: number | null;
  previousGradeLetter: string | null;
  amendedDate: Date | null;
  amendmentReason: string | null;
  studentName: string;
  subjectCode: string;
};

function letterFor(total: number): string {
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "F";
}

export default function AmendGradeDialog({ grade }: { grade: AmendableGrade }) {
  const [open, setOpen] = useState(false);
  const [ca, setCa] = useState(grade.caMarks?.toString() ?? "");
  const [exam, setExam] = useState(grade.examMarks?.toString() ?? "");

  const [, formAction, isPending] = useActionState<GradeActionState, FormData>(
    async (prev, formData) => {
      const result = await amendGradeAction(prev, formData);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      }
      if (result.error) toast.error(result.error);
      return result;
    },
    {},
  );

  // Re-seed from the server values whenever the dialog is reopened, so a
  // cancelled edit does not linger in the inputs.
  function handleOpenChange(next: boolean) {
    if (next) {
      setCa(grade.caMarks?.toString() ?? "");
      setExam(grade.examMarks?.toString() ?? "");
    }
    setOpen(next);
  }

  const caNum = parseFloat(ca);
  const examNum = parseFloat(exam);
  const total =
    !isNaN(caNum) && !isNaN(examNum)
      ? Math.round((caNum + examNum) * 10) / 10
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-1 h-3 w-3" />
          Amend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Amend Grade</DialogTitle>
          <DialogDescription>
            Correcting {grade.subjectCode} for {grade.studentName}. The grade
            stays {grade.status} and the transcript updates immediately.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="gradeId" value={grade.id} />
          <input type="hidden" name="caMarks" value={ca} />
          <input type="hidden" name="examMarks" value={exam} />

          {grade.amendedDate && grade.previousTotalMarks !== null && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p className="font-medium">Previously amended</p>
              <p className="text-muted-foreground">
                Superseded mark: {grade.previousTotalMarks}
                {grade.previousGradeLetter
                  ? ` (${grade.previousGradeLetter})`
                  : ""}
                {grade.amendmentReason ? ` — ${grade.amendmentReason}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Amending again replaces this record; the full history remains in
                the audit log.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="amend-ca">CA (0–40)</Label>
              <Input
                id="amend-ca"
                type="number"
                min={0}
                max={40}
                step={0.5}
                value={ca}
                onChange={(e) => setCa(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amend-exam">Exam (0–60)</Label>
              <Input
                id="amend-exam"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>New total</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {total !== null ? `${total} (${letterFor(total)})` : "—"}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Current mark: {grade.totalMarks ?? "—"}
            {grade.gradeLetter ? ` (${grade.gradeLetter})` : ""}
          </p>

          <div className="space-y-2">
            <Label htmlFor="amend-reason">Reason for amendment</Label>
            <Textarea
              id="amend-reason"
              name="reason"
              rows={2}
              placeholder="e.g. Exam script re-marked after remark request"
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !ca || !exam}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Amend Grade"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
