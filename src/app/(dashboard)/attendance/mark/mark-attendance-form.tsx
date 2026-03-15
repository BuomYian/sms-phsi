"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/constants";
import { toast } from "sonner";
import { bulkMarkAttendanceAction } from "../actions";
import {
  CheckCircle,
  Loader2,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

type StudentRow = {
  courseEnrollmentId: string;
  studentName: string;
  studentIdNumber: string;
  existingStatus: string | null;
};

type Props = {
  subjects: { id: string; code: string; name: string }[];
  currentSemesterId: string | null;
};

const statusButtons = [
  {
    value: "PRESENT",
    label: "Present",
    icon: CheckCircle,
    color: "text-green-600",
  },
  { value: "ABSENT", label: "Absent", icon: XCircle, color: "text-red-600" },
  { value: "LATE", label: "Late", icon: Clock, color: "text-yellow-600" },
  {
    value: "EXCUSED",
    label: "Excused",
    icon: ShieldAlert,
    color: "text-blue-600",
  },
] as const;

export default function MarkAttendanceForm({
  subjects,
  currentSemesterId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Fetch enrolled students when subject or date changes
  useEffect(() => {
    if (!selectedSubject || !date) {
      setStudents([]);
      setStatuses({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchStudents() {
      try {
        const res = await fetch(
          `/api/attendance/students?subjectId=${encodeURIComponent(selectedSubject)}&date=${encodeURIComponent(date)}${currentSemesterId ? `&semesterId=${encodeURIComponent(currentSemesterId)}` : ""}`,
        );
        if (!res.ok) throw new Error("Failed to load students");
        const data: StudentRow[] = await res.json();
        if (cancelled) return;
        setStudents(data);
        // Initialize statuses from existing records or default to PRESENT
        const initial: Record<string, string> = {};
        for (const s of data) {
          initial[s.courseEnrollmentId] = s.existingStatus ?? "PRESENT";
        }
        setStatuses(initial);
      } catch {
        if (!cancelled) {
          toast.error("Failed to load students.");
          setStudents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [selectedSubject, date, currentSemesterId]);

  function setAllStatuses(status: string) {
    const updated: Record<string, string> = {};
    for (const s of students) {
      updated[s.courseEnrollmentId] = status;
    }
    setStatuses(updated);
  }

  function handleSubmit() {
    if (students.length === 0) return;

    const records = students.map((s) => ({
      courseEnrollmentId: s.courseEnrollmentId,
      date,
      status: statuses[s.courseEnrollmentId] ?? "PRESENT",
    }));

    startTransition(async () => {
      const result = await bulkMarkAttendanceAction(records);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.push("/attendance");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Subject and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Subject & Date</CardTitle>
          <CardDescription>
            Choose a subject and date to load enrolled students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
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
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading students…</span>
        </div>
      )}

      {!loading && students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Students ({students.length})
                </CardTitle>
                <CardDescription>
                  Click a status for each student, or use quick actions below.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllStatuses("PRESENT")}
                >
                  All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllStatuses("ABSENT")}
                >
                  All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => (
                  <TableRow key={student.courseEnrollmentId}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.studentName}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {student.studentIdNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {statusButtons.map(
                          ({ value, label, icon: Icon, color }) => {
                            const isActive =
                              statuses[student.courseEnrollmentId] === value;
                            return (
                              <Button
                                key={value}
                                type="button"
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                className={isActive ? "" : "opacity-50"}
                                onClick={() =>
                                  setStatuses((prev) => ({
                                    ...prev,
                                    [student.courseEnrollmentId]: value,
                                  }))
                                }
                              >
                                <Icon
                                  className={`mr-1 h-3 w-3 ${isActive ? "" : color}`}
                                />
                                {label}
                              </Button>
                            );
                          },
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && selectedSubject && students.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No enrolled students found for this subject in the current semester.
          </CardContent>
        </Card>
      )}

      {/* Summary and Submit */}
      {students.length > 0 && !loading && (
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {statusButtons.map(({ value, label }) => {
              const count = Object.values(statuses).filter(
                (s) => s === value,
              ).length;
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className={STATUS_COLORS[value]}
                >
                  {label}: {count}
                </Badge>
              );
            })}
          </div>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Attendance"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
