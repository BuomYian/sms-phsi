"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateTimetableEntryAction,
  deleteTimetableEntryAction,
  type TimetableActionState,
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
import { DAYS_OF_WEEK } from "@/constants";
import { Trash2 } from "lucide-react";

type EntryData = {
  id: string;
  subjectId: string;
  instructorId: string;
  semesterId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
};

type Props = {
  entry: EntryData;
  subjects: { id: string; name: string; code: string; programName: string }[];
  instructors: { id: string; fullName: string; staffIdNumber: string }[];
  semesters: {
    id: string;
    name: string;
    academicYearName: string;
    isCurrent: boolean;
  }[];
};

export default function TimetableEditForm({
  entry,
  subjects,
  instructors,
  semesters,
}: Props) {
  const router = useRouter();
  const initialState: TimetableActionState = {};
  const boundAction = updateTimetableEntryAction.bind(null, entry.id);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push("/timetable");
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  async function handleDelete() {
    const result = await deleteTimetableEntryAction(entry.id);
    if (result.success) {
      toast.success(result.message);
      router.push("/timetable");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Class Details</CardTitle>
              <CardDescription>
                Update the schedule for this timetable entry.
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" type="button">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this class from the timetable.
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
        <CardContent className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select name="subjectId" required defaultValue={entry.subjectId}>
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
            <Select
              name="instructorId"
              required
              defaultValue={entry.instructorId}
            >
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
            <Select name="semesterId" required defaultValue={entry.semesterId}>
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
            <Select
              name="dayOfWeek"
              required
              defaultValue={String(entry.dayOfWeek)}
            >
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
                defaultValue={entry.startTime}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Input
                name="endTime"
                type="time"
                required
                defaultValue={entry.endTime}
              />
            </div>
          </div>

          {/* Room */}
          <div className="space-y-2">
            <Label>Room *</Label>
            <Input
              name="room"
              required
              defaultValue={entry.room}
              placeholder="e.g. Room 101, Lab A"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
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
