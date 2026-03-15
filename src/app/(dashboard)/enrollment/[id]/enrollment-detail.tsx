"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveEnrollmentAction,
  rejectEnrollmentAction,
  deleteEnrollmentAction,
  setConditionalEnrollmentAction,
} from "../actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { STATUS_COLORS } from "@/constants";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle,
  Edit,
  Trash2,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";

type EnrollmentData = {
  id: string;
  status: string;
  registrationDate: Date;
  approvedDate: Date | null;
  notes: string | null;
  student: {
    id: string;
    studentIdNumber: string;
    user: { fullName: string; email: string; avatarUrl: string | null };
    program: { name: string; code: string };
  };
  semester: {
    id: string;
    name: string;
    academicYear: { name: string };
  };
  approver: { fullName: string } | null;
  courseEnrollments: {
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
      creditHours: number;
      semesterNumber: number;
      type: string;
    };
    grade: {
      totalMarks: number | null;
      gradeLetter: string | null;
      status: string;
    } | null;
    _count: { attendances: number };
  }[];
};

export default function EnrollmentDetail({
  enrollment,
  isAdmin,
}: {
  enrollment: EnrollmentData;
  isAdmin: boolean;
  sessionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [condDialogOpen, setCondDialogOpen] = useState(false);
  const [condNotes, setCondNotes] = useState("");

  const totalCredits = enrollment.courseEnrollments.reduce(
    (sum, ce) => sum + ce.subject.creditHours,
    0,
  );

  const coreCount = enrollment.courseEnrollments.filter(
    (ce) => ce.subject.type === "CORE",
  ).length;
  const electiveCount = enrollment.courseEnrollments.filter(
    (ce) => ce.subject.type === "ELECTIVE",
  ).length;

  const isPending = enrollment.status === "PENDING";
  const isConditional = enrollment.status === "CONDITIONAL";
  const canModify = isPending || isConditional;

  async function handleAction(action: "approve" | "reject" | "delete") {
    setLoading(action);
    let result;
    if (action === "approve") {
      result = await approveEnrollmentAction(enrollment.id);
    } else if (action === "reject") {
      result = await rejectEnrollmentAction(enrollment.id);
    } else {
      result = await deleteEnrollmentAction(enrollment.id);
    }
    setLoading(null);

    if (result.success) {
      toast.success(result.message);
      if (action === "delete") {
        router.push("/enrollment");
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.error);
    }
  }

  async function handleConditional() {
    if (!condNotes.trim()) {
      toast.error("Please provide notes for the condition.");
      return;
    }
    setLoading("conditional");
    const result = await setConditionalEnrollmentAction(
      enrollment.id,
      condNotes,
    );
    setLoading(null);
    if (result.success) {
      toast.success(result.message);
      setCondDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Enrollment Details
            </h1>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[enrollment.status]}
            >
              {enrollment.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {enrollment.semester.academicYear.name} — {enrollment.semester.name}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && canModify && (
            <Button variant="outline" asChild>
              <Link href={`/enrollment/${enrollment.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit Subjects
              </Link>
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Enrollment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this enrollment and all course
                    registrations. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction("delete")}
                    disabled={loading === "delete"}
                  >
                    {loading === "delete" ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Conditional notes banner */}
      {enrollment.notes && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-300">
                Conditional Note
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                {enrollment.notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Student info & Admin actions */}
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <Link
                    href={`/students/${enrollment.student.id}`}
                    className="font-medium hover:underline"
                  >
                    {enrollment.student.user.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono">
                    {enrollment.student.studentIdNumber}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Program</span>
                  <span className="font-medium">
                    {enrollment.student.program.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-xs">
                    {enrollment.student.user.email}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Enrollment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered</span>
                <span>{formatDate(enrollment.registrationDate)}</span>
              </div>
              {enrollment.approver && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {enrollment.status === "APPROVED"
                        ? "Approved by"
                        : "Reviewed by"}
                    </span>
                    <span>{enrollment.approver.fullName}</span>
                  </div>
                  {enrollment.approvedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Review Date</span>
                      <span>{formatDate(enrollment.approvedDate)}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subjects</span>
                <span className="font-medium flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {enrollment.courseEnrollments.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Core / Elective</span>
                <span>
                  {coreCount} / {electiveCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Credits</span>
                <span className="font-bold">{totalCredits}</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {isAdmin && isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Review Actions</CardTitle>
                <CardDescription>
                  Approve, reject, or set conditions for this enrollment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleAction("approve")}
                  disabled={loading !== null}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {loading === "approve" ? "Approving..." : "Approve"}
                </Button>

                <Dialog open={condDialogOpen} onOpenChange={setCondDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Set Conditional
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Conditional Enrollment</DialogTitle>
                      <DialogDescription>
                        Provide conditions the student must meet.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Condition Notes *</Label>
                        <Input
                          value={condNotes}
                          onChange={(e) => setCondNotes(e.target.value)}
                          placeholder="e.g. Must clear outstanding fees by..."
                        />
                      </div>
                      <Button
                        onClick={handleConditional}
                        disabled={loading === "conditional"}
                        className="w-full"
                      >
                        {loading === "conditional"
                          ? "Saving..."
                          : "Set Conditional"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleAction("reject")}
                  disabled={loading !== null}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {loading === "reject" ? "Rejecting..." : "Reject"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Subjects Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enrolled Subjects</CardTitle>
                  <CardDescription>
                    {totalCredits} total credit hours across{" "}
                    {enrollment.courseEnrollments.length} subject(s).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollment.courseEnrollments.map((ce) => (
                    <TableRow key={ce.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/academics/subjects/${ce.subject.id}`}
                          className="hover:underline"
                        >
                          {ce.subject.code}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        {ce.subject.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {ce.subject.semesterNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        {ce.subject.creditHours}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ce.subject.type === "CORE" ? "default" : "secondary"
                          }
                        >
                          {ce.subject.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {ce._count.attendances > 0
                          ? ce._count.attendances
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {ce.grade ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {ce.grade.gradeLetter ?? "—"}
                            </span>
                            {ce.grade.totalMarks !== null && (
                              <span className="text-xs text-muted-foreground">
                                ({ce.grade.totalMarks}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {enrollment.courseEnrollments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No subjects enrolled.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
