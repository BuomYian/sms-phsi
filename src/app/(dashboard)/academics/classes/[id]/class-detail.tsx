"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Users,
  BookOpen,
  UserPlus,
  ArrowUpRight,
  Trash2,
  GraduationCap,
  Pencil,
  PlusCircle,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  enrollStudentsInClassAction,
  removeStudentFromClassAction,
  promoteStudentsAction,
  deleteClassAction,
  updateClassAction,
  addSubjectOfferingAction,
  completeSubjectOfferingAction,
  removeSubjectOfferingAction,
  type ClassActionState,
} from "../actions";

interface ClassInfo {
  id: string;
  name: string;
  yearLevel: number;
  programName: string;
  programCode: string;
  academicYearName: string;
  isLastYear: boolean;
}

interface ClassStudentItem {
  classStudentId: string;
  studentId: string;
  studentIdNumber: string;
  fullName: string;
  email: string;
  status: string;
}

interface OfferingSubject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  semesterNumber: number;
  type: string;
  instructors: { name: string; semester: string }[];
}

interface OfferingItem {
  id: string;
  status: string;
  semesterId: string;
  semesterName: string;
  subject: OfferingSubject;
}

interface AvailableSubject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  semesterNumber: number;
}

interface AvailableStudent {
  id: string;
  studentIdNumber: string;
  fullName: string;
}

interface CalendarSemester {
  id: string;
  name: string;
}

interface ClassDetailProps {
  cls: ClassInfo;
  students: ClassStudentItem[];
  offerings: OfferingItem[];
  availableSubjects: AvailableSubject[];
  calendarSemesters: CalendarSemester[];
  availableStudents: AvailableStudent[];
}

export function ClassDetail({
  cls,
  students,
  offerings,
  availableSubjects,
  calendarSemesters,
  availableStudents,
}: ClassDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const initialState: ClassActionState = {};
  const [, renameAction, renaming] = useActionState(
    async (prev: ClassActionState, formData: FormData) => {
      const result = await updateClassAction(cls.id, prev, formData);
      if (result?.success) {
        toast.success(result.message);
        setRenameOpen(false);
      }
      if (result?.error) toast.error(result.error);
      return result;
    },
    initialState,
  );

  // Enroll dialog
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [enrollSearch, setEnrollSearch] = useState("");

  // Promote dialog
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteStudents, setPromoteStudents] = useState<Set<string>>(
    new Set(),
  );

  // Add subject offering dialog
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState(
    calendarSemesters[0]?.id ?? "",
  );

  function handleAddOffering() {
    if (!selectedSubjectId || !selectedSemesterId) return;
    startTransition(async () => {
      const result = await addSubjectOfferingAction(
        cls.id,
        selectedSubjectId,
        selectedSemesterId,
      );
      if (result.success) {
        toast.success(result.message);
        setAddSubjectOpen(false);
        setSelectedSubjectId("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCompleteOffering(offeringId: string) {
    startTransition(async () => {
      const result = await completeSubjectOfferingAction(offeringId, cls.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  function handleRemoveOffering(offeringId: string) {
    startTransition(async () => {
      const result = await removeSubjectOfferingAction(offeringId, cls.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  const activeStudents = students.filter((s) => s.status === "ACTIVE");

  const filteredAvailable = enrollSearch
    ? availableStudents.filter(
        (s) =>
          s.fullName.toLowerCase().includes(enrollSearch.toLowerCase()) ||
          s.studentIdNumber.toLowerCase().includes(enrollSearch.toLowerCase()),
      )
    : availableStudents;

  function toggleStudent(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  function handleEnroll() {
    if (selectedStudents.size === 0) return;
    startTransition(async () => {
      const result = await enrollStudentsInClassAction(
        cls.id,
        Array.from(selectedStudents),
      );
      if (result.success) {
        toast.success(result.message);
        setEnrollOpen(false);
        setSelectedStudents(new Set());
        setEnrollSearch("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(classStudentId: string) {
    startTransition(async () => {
      const result = await removeStudentFromClassAction(classStudentId, cls.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  function handlePromote() {
    if (promoteStudents.size === 0) return;
    startTransition(async () => {
      const result = await promoteStudentsAction(
        cls.id,
        Array.from(promoteStudents),
      );
      if (result.success) {
        toast.success(result.message);
        setPromoteOpen(false);
        setPromoteStudents(new Set());
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteClass() {
    setDeleting(true);
    startTransition(async () => {
      const result = await deleteClassAction(cls.id);
      setDeleting(false);
      if (result.success) {
        toast.success(result.message);
        router.push("/academics/classes");
      } else {
        toast.error(result.error);
      }
    });
  }

  const activeOfferings = offerings.filter((o) => o.status === "ACTIVE");
  const completedOfferings = offerings.filter((o) => o.status === "COMPLETED");
  const totalCredits = offerings.reduce((sum, o) => sum + o.subject.creditHours, 0);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/academics/classes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <p className="text-sm text-muted-foreground">
              {cls.programName} ({cls.programCode}) · {cls.academicYearName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeStudents.length > 0 && (
            <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {cls.isLastYear ? (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Graduate Students
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Promote Students
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {cls.isLastYear
                      ? "Graduate Students"
                      : `Promote to Year ${cls.yearLevel + 1}`}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {cls.isLastYear
                      ? "Select students to mark as graduated."
                      : `Select students to promote to Year ${cls.yearLevel + 1}.`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPromoteStudents(
                          new Set(activeStudents.map((s) => s.studentId)),
                        )
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPromoteStudents(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {activeStudents.map((s) => (
                      <label
                        key={s.studentId}
                        className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={promoteStudents.has(s.studentId)}
                          onCheckedChange={() =>
                            setPromoteStudents(
                              toggleStudent(promoteStudents, s.studentId),
                            )
                          }
                        />
                        <div>
                          <p className="text-sm font-medium">{s.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {s.studentIdNumber}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handlePromote}
                    disabled={promoteStudents.size === 0 || isPending}
                    className="w-full"
                  >
                    {isPending
                      ? "Processing..."
                      : cls.isLastYear
                        ? `Graduate ${promoteStudents.size} Student(s)`
                        : `Promote ${promoteStudents.size} Student(s)`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Class</DialogTitle>
              </DialogHeader>
              <form action={renameAction} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input
                    name="name"
                    defaultValue={cls.name}
                    required
                    minLength={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={renaming}>
                  {renaming ? "Saving..." : "Save"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{cls.name}&quot;. Classes
                  with enrolled students cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteClass}
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-lg font-bold">{activeStudents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Subjects Offered</p>
              <p className="text-lg font-bold">{offerings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold">{totalCredits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Students ({activeStudents.length})
          </CardTitle>
          <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enroll Students into {cls.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Search by name or ID..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                />
                {availableStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No available students for this program.
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedStudents(
                            new Set(filteredAvailable.map((s) => s.id)),
                          )
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudents(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredAvailable.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={selectedStudents.has(s.id)}
                            onCheckedChange={() =>
                              setSelectedStudents(
                                toggleStudent(selectedStudents, s.id),
                              )
                            }
                          />
                          <div>
                            <p className="text-sm font-medium">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {s.studentIdNumber}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                <Button
                  onClick={handleEnroll}
                  disabled={selectedStudents.size === 0 || isPending}
                  className="w-full"
                >
                  {isPending
                    ? "Enrolling..."
                    : `Enroll ${selectedStudents.size} Student(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No students enrolled yet. Click &quot;Enroll Students&quot; to add
              students.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.classStudentId}>
                    <TableCell className="font-mono text-sm">
                      {s.studentIdNumber}
                    </TableCell>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "ACTIVE"
                            ? "default"
                            : s.status === "COMPLETED"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === "ACTIVE" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Student
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {s.fullName} from {cls.name}? This only
                                removes the class membership, not their
                                enrollment records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemove(s.classStudentId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subject Offerings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Subject Offerings</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Only subjects added here are taught and appear on transcripts.
            </p>
          </div>
          {availableSubjects.length > 0 && (
            <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Subject to Offerings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={selectedSemesterId}
                      onValueChange={setSelectedSemesterId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendarSemesters.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={selectedSubjectId}
                      onValueChange={setSelectedSubjectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-mono text-xs mr-2 text-muted-foreground">
                              {s.code}
                            </span>
                            {s.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({s.creditHours} cr)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddOffering}
                    disabled={!selectedSubjectId || !selectedSemesterId || isPending}
                    className="w-full"
                  >
                    {isPending ? "Adding..." : "Add to Offerings"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active offerings */}
          {activeOfferings.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Clock className="h-4 w-4 text-blue-500" />
                Currently Being Taught ({activeOfferings.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Instructor(s)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOfferings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/academics/subjects/${o.subject.id}`}
                          className="text-primary hover:underline"
                        >
                          {o.subject.code}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{o.subject.name}</TableCell>
                      <TableCell className="text-center">{o.subject.creditHours}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.semesterName}</TableCell>
                      <TableCell>
                        {o.subject.instructors.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {o.subject.instructors.map((inst, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {inst.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Mark Taught
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark as Taught?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This records that <strong>{o.subject.name}</strong> has been fully taught. This cannot be undone and the subject will not appear as an option in future offerings for this class.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCompleteOffering(o.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Offering?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove <strong>{o.subject.name}</strong> from this semester&apos;s offerings? This also removes all student enrollments for this subject. Only possible if no grades have been entered.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveOffering(o.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Completed offerings */}
          {completedOfferings.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-muted-foreground">
                <History className="h-4 w-4" />
                Already Taught — Historical Record ({completedOfferings.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead>Semester Taught</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOfferings.map((o) => (
                    <TableRow key={o.id} className="opacity-70">
                      <TableCell className="font-mono text-sm">{o.subject.code}</TableCell>
                      <TableCell className="font-medium">{o.subject.name}</TableCell>
                      <TableCell className="text-center">{o.subject.creditHours}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.semesterName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {offerings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No subjects offered yet.</p>
              <p className="text-xs mt-1">Click &quot;Add Subject&quot; to begin adding subjects for this semester.</p>
            </div>
          )}

          {availableSubjects.length === 0 && offerings.length > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              All programme subjects for this year level have been offered.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
