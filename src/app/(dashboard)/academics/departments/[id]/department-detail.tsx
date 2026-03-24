"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteDepartmentAction } from "../../actions";

interface DepartmentDetailProps {
  department: {
    id: string;
    name: string;
    code: string | null;
    headOfDepartment: {
      user: { fullName: string; email: string };
    } | null;
    staff: {
      id: string;
      staffIdNumber: string;
      designation: string;
      user: { fullName: string; email: string };
    }[];
    programs: {
      id: string;
      name: string;
      code: string;
      isActive: boolean;
      _count: { students: number };
    }[];
  };
}

export function DepartmentDetail({ department }: DepartmentDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function handleDelete() {
    setDeleting(true);
    startTransition(async () => {
      const result = await deleteDepartmentAction(department.id);
      setDeleting(false);
      if (result.success) {
        toast.success(result.message);
        router.push("/academics/departments");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/academics/departments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{department.name}</h1>
              {department.code && (
                <Badge variant="outline">{department.code}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Head:{" "}
              {department.headOfDepartment?.user.fullName ?? "Not assigned"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/academics/departments/${department.id}/edit`}>
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
                <AlertDialogTitle>Delete Department?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{department.name}&quot;.
                  This action cannot be undone.
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Staff Members</p>
              <p className="text-lg font-bold">{department.staff.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Programs</p>
              <p className="text-lg font-bold">{department.programs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-lg font-bold">
                {department.programs.reduce(
                  (sum, p) => sum + p._count.students,
                  0,
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Programs</CardTitle>
            </CardHeader>
            <CardContent>
              {department.programs.length > 0 ? (
                <div className="space-y-2">
                  {department.programs.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <div>
                        <Link
                          href={`/academics/programs/${program.id}`}
                          className="font-medium hover:underline"
                        >
                          {program.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {program.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {program._count.students} students
                        </span>
                        <Badge
                          variant={program.isActive ? "default" : "secondary"}
                        >
                          {program.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No programs in this department yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              {department.staff.length > 0 ? (
                <div className="space-y-2">
                  {department.staff.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <div>
                        <Link
                          href={`/staff/${member.id}`}
                          className="font-medium hover:underline"
                        >
                          {member.user.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {member.staffIdNumber}
                        </span>
                        <Badge variant="outline">{member.designation}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No staff assigned to this department yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
