"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateExamScheduleAction,
  deleteExamScheduleAction,
  type GradeActionState,
} from "../../../actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Props = {
  exam: {
    id: string;
    subjectId: string;
    semesterId: string;
    classId: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    duration: number;
  };
  subjects: { id: string; code: string; name: string }[];
  semesters: {
    id: string;
    name: string;
    academicYearName: string;
    isCurrent: boolean;
  }[];
  classes: { id: string; name: string }[];
};

export default function ExamEditForm({
  exam,
  subjects,
  semesters,
  classes,
}: Props) {
  const router = useRouter();
  const initialState: GradeActionState = {};
  const [state, formAction, isPending] = useActionState(
    updateExamScheduleAction,
    initialState,
  );
  const [deletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push("/grades/exams");
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteExamScheduleAction(exam.id);
      if (result.success) {
        toast.success(result.message);
        router.push("/grades/exams");
      }
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Update the exam schedule information.
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deletePending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Exam Schedule?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this exam schedule entry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={exam.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject</Label>
              <Select name="subjectId" defaultValue={exam.subjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesterId">Semester</Label>
              <Select name="semesterId" defaultValue={exam.semesterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
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
          </div>

          {classes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <Select name="classId" defaultValue={exam.classId ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                name="date"
                defaultValue={exam.date}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input name="venue" defaultValue={exam.venue} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                name="startTime"
                defaultValue={exam.startTime}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                type="time"
                name="endTime"
                defaultValue={exam.endTime}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                type="number"
                name="duration"
                min={30}
                max={300}
                defaultValue={exam.duration}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Update Exam"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/grades/exams")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
