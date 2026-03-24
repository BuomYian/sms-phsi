"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Pencil,
  Trash2,
  GraduationCap,
  BookOpen,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProgramAction } from "../../actions";

interface ProgramDetailProps {
  program: {
    id: string;
    name: string;
    code: string;
    durationSemesters: number;
    totalCredits: number;
    description: string | null;
    entryRequirements: string | null;
    isActive: boolean;
    department: { name: string } | null;
    subjects: {
      id: string;
      name: string;
      code: string;
      creditHours: number;
      semesterNumber: number;
      type: string;
      instructors: {
        staff: { user: { fullName: string } };
      }[];
    }[];
    _count: { students: number };
  };
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function ProgramDetail({ program }: ProgramDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function handleDelete() {
    setDeleting(true);
    startTransition(async () => {
      const result = await deleteProgramAction(program.id);
      setDeleting(false);
      if (result.success) {
        toast.success(result.message);
        router.push("/academics/programs");
      } else {
        toast.error(result.error);
      }
    });
  }

  // Group subjects by semester
  const semesters = new Map<number, typeof program.subjects>();
  for (const subject of program.subjects) {
    const sem = subject.semesterNumber;
    if (!semesters.has(sem)) semesters.set(sem, []);
    semesters.get(sem)!.push(subject);
  }
  const sortedSemesters = [...semesters.entries()].sort(([a], [b]) => a - b);

  const totalSubjectCredits = program.subjects.reduce(
    (sum, s) => sum + s.creditHours,
    0,
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/academics/programs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{program.name}</h1>
              <Badge variant={program.isActive ? "default" : "secondary"}>
                {program.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {program.code} · {program.department?.name ?? "No department"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/academics/programs/${program.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
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
                <AlertDialogTitle>Delete Program?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{program.name}&quot; and
                  all its subjects. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
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
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-bold">
                {program.durationSemesters} semesters
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold">{program.totalCredits}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Subjects</p>
              <p className="text-lg font-bold">
                {program.subjects.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalSubjectCredits} cr)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Enrolled Students</p>
              <p className="text-lg font-bold">{program._count.students}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Program Name" value={program.name} />
              <InfoItem label="Code" value={program.code} />
              <InfoItem label="Department" value={program.department?.name} />
              <InfoItem
                label="Duration"
                value={`${program.durationSemesters} semesters`}
              />
              <InfoItem
                label="Total Credits"
                value={String(program.totalCredits)}
              />
              <InfoItem
                label="Status"
                value={program.isActive ? "Active" : "Inactive"}
              />
            </CardContent>
          </Card>

          {program.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {program.description}
                </p>
              </CardContent>
            </Card>
          )}

          {program.entryRequirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entry Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {program.entryRequirements}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-4">
          {sortedSemesters.length > 0 ? (
            sortedSemesters.map(([semNum, subjects]) => (
              <Card key={semNum}>
                <CardHeader>
                  <CardTitle className="text-base">Semester {semNum}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            {subject.code} — {subject.name}
                          </span>
                          {subject.instructors.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {subject.instructors
                                .map((i) => i.staff.user.fullName)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{subject.type}</Badge>
                          <Badge variant="secondary">
                            {subject.creditHours} cr
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-end text-sm text-muted-foreground">
                      Semester total:{" "}
                      {subjects.reduce((s, sub) => s + sub.creditHours, 0)}{" "}
                      credits
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No subjects added to this program yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
