"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTimetableEntryAction,
  type TimetableActionState,
} from "../actions";
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
import { DAYS_OF_WEEK } from "@/constants";

type Props = {
  subjects: { id: string; name: string; code: string; programName: string }[];
  instructors: { id: string; fullName: string; staffIdNumber: string }[];
  semesters: {
    id: string;
    name: string;
    academicYearName: string;
    isCurrent: boolean;
  }[];
};

export default function TimetableEntryForm({
  subjects,
  instructors,
  semesters,
}: Props) {
  const router = useRouter();
  const initialState: TimetableActionState = {};
  const [state, formAction, isPending] = useActionState(
    createTimetableEntryAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push("/timetable");
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  const currentSemester = semesters.find((s) => s.isCurrent);

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>
            Schedule a subject at a specific day, time, and room.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select name="subjectId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.programName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructor */}
          <div className="space-y-2">
            <Label>Instructor *</Label>
            <Select name="instructorId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.fullName} ({i.staffIdNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester */}
          <div className="space-y-2">
            <Label>Semester *</Label>
            <Select
              name="semesterId"
              required
              defaultValue={currentSemester?.id}
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

          {/* Day of Week */}
          <div className="space-y-2">
            <Label>Day *</Label>
            <Select name="dayOfWeek" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                name="startTime"
                type="time"
                required
                defaultValue="08:00"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Input name="endTime" type="time" required defaultValue="09:30" />
            </div>
          </div>

          {/* Room */}
          <div className="space-y-2">
            <Label>Room *</Label>
            <Input name="room" required placeholder="e.g. Room 101, Lab A" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Entry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/timetable")}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
