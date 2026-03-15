"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSemesterAction,
  updateSemesterAction,
  deleteSemesterAction,
  deleteAcademicYearAction,
  type AcademicActionState,
} from "../../actions";
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
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  CalendarDays,
  Edit,
  GraduationCap,
  Plus,
  Trash2,
  Clock,
  BookOpen,
} from "lucide-react";

type Semester = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  academicYearId: string;
  _count: {
    enrollments: number;
    timetableEntries: number;
    examSchedules: number;
  };
};

type AcademicYearData = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  semesters: Semester[];
};

export default function AcademicYearDetail({
  academicYear,
}: {
  academicYear: AcademicYearData;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<Semester | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalEnrollments = academicYear.semesters.reduce(
    (sum, s) => sum + s._count.enrollments,
    0,
  );
  const totalTimetable = academicYear.semesters.reduce(
    (sum, s) => sum + s._count.timetableEntries,
    0,
  );
  const totalExams = academicYear.semesters.reduce(
    (sum, s) => sum + s._count.examSchedules,
    0,
  );

  const now = new Date();
  const isActive =
    now >= new Date(academicYear.startDate) &&
    now <= new Date(academicYear.endDate);

  async function handleDeleteYear() {
    setDeleting(true);
    const result = await deleteAcademicYearAction(academicYear.id);
    setDeleting(false);
    if (result.success) {
      toast.success(result.message);
      router.push("/academics/calendar");
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteSemester(semId: string) {
    const result = await deleteSemesterAction(semId);
    if (result.success) {
      toast.success(result.message);
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
              {academicYear.name}
            </h1>
            {academicYear.isCurrent && <Badge>Current</Badge>}
            {isActive && !academicYear.isCurrent && (
              <Badge variant="outline">Active</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {formatDate(academicYear.startDate)} —{" "}
            {formatDate(academicYear.endDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/academics/calendar/${academicYear.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Academic Year?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete &quot;{academicYear.name}&quot; and all its
                  semesters. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteYear}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Semesters</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {academicYear.semesters.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Timetable Entries
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTimetable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Exam Schedules
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
          </CardContent>
        </Card>
      </div>

      {/* Semesters Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Semesters</CardTitle>
              <CardDescription>
                Manage the semesters for this academic year.
              </CardDescription>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Semester
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Semester</DialogTitle>
                  <DialogDescription>
                    Create a new semester for {academicYear.name}.
                  </DialogDescription>
                </DialogHeader>
                <SemesterForm
                  academicYearId={academicYear.id}
                  onSuccess={() => {
                    setAddOpen(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {academicYear.semesters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No semesters yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicYear.semesters.map((sem) => {
                  const semActive =
                    now >= new Date(sem.startDate) &&
                    now <= new Date(sem.endDate);
                  return (
                    <TableRow key={sem.id}>
                      <TableCell className="font-medium">{sem.name}</TableCell>
                      <TableCell>{formatDate(sem.startDate)}</TableCell>
                      <TableCell>{formatDate(sem.endDate)}</TableCell>
                      <TableCell>
                        {sem.isCurrent ? (
                          <Badge>Current</Badge>
                        ) : semActive ? (
                          <Badge variant="outline">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{sem._count.enrollments}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditSemester(sem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Semester?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &quot;{sem.name}
                                  &quot;. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSemester(sem.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Semester Dialog */}
      <Dialog
        open={!!editSemester}
        onOpenChange={(open) => !open && setEditSemester(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <DialogDescription>
              Update semester details for {academicYear.name}.
            </DialogDescription>
          </DialogHeader>
          {editSemester && (
            <SemesterForm
              academicYearId={academicYear.id}
              semester={editSemester}
              onSuccess={() => {
                setEditSemester(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Semester Form (used for both create and edit) ----
function SemesterForm({
  academicYearId,
  semester,
  onSuccess,
}: {
  academicYearId: string;
  semester?: Semester;
  onSuccess: () => void;
}) {
  const isEdit = !!semester;
  const initialState: AcademicActionState = {};

  const boundAction = isEdit
    ? updateSemesterAction.bind(null, semester!.id)
    : createSemesterAction;

  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    }
    if (state?.error) toast.error(state.error);
  }, [state, onSuccess]);

  const toDateStr = (d: Date) => new Date(d).toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      {!isEdit && (
        <input type="hidden" name="academicYearId" value={academicYearId} />
      )}

      <div className="space-y-2">
        <Label htmlFor="semName">Name *</Label>
        <Input
          id="semName"
          name="name"
          required
          defaultValue={semester?.name}
          placeholder="e.g. Semester 1"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="semStart">Start Date *</Label>
          <Input
            id="semStart"
            name="startDate"
            type="date"
            required
            defaultValue={semester ? toDateStr(semester.startDate) : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="semEnd">End Date *</Label>
          <Input
            id="semEnd"
            name="endDate"
            type="date"
            required
            defaultValue={semester ? toDateStr(semester.endDate) : ""}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="semIsCurrent"
          name="isCurrent"
          value="true"
          defaultChecked={semester?.isCurrent}
        />
        <Label htmlFor="semIsCurrent">Set as current semester</Label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Semester"}
        </Button>
      </div>
    </form>
  );
}
