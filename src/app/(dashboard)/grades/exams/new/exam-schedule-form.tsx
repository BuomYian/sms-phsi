"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExamScheduleAction, type GradeActionState } from "../../actions";
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
import { toast } from "sonner";

type Props = {
  subjects: { id: string; code: string; name: string }[];
  semesters: {
    id: string;
    name: string;
    academicYearName: string;
    isCurrent: boolean;
  }[];
  classes: { id: string; name: string }[];
  defaultValues?: {
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
};

export default function ExamScheduleForm({
  subjects,
  semesters,
  classes,
  defaultValues,
}: Props) {
  const router = useRouter();
  const initialState: GradeActionState = {};
  const [state, formAction, isPending] = useActionState(
    createExamScheduleAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push("/grades/exams");
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  const currentSemester = semesters.find((s) => s.isCurrent);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Exam Details</CardTitle>
        <CardDescription>
          Fill in the exam schedule information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {defaultValues && (
            <input type="hidden" name="id" value={defaultValues.id} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject</Label>
              <Select
                name="subjectId"
                defaultValue={defaultValues?.subjectId ?? ""}
              >
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
              <Select
                name="semesterId"
                defaultValue={
                  defaultValues?.semesterId ?? currentSemester?.id ?? ""
                }
              >
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
              <Select
                name="classId"
                defaultValue={defaultValues?.classId ?? ""}
              >
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
                defaultValue={defaultValues?.date ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                name="venue"
                placeholder="e.g. Hall A"
                defaultValue={defaultValues?.venue ?? ""}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                name="startTime"
                defaultValue={defaultValues?.startTime ?? "08:00"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                type="time"
                name="endTime"
                defaultValue={defaultValues?.endTime ?? "11:00"}
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
                defaultValue={defaultValues?.duration ?? 180}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Schedule Exam"}
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
