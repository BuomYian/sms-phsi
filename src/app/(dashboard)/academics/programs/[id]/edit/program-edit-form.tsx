"use client";

import { useActionState } from "react";
import {
  updateProgramAction,
  type AcademicActionState,
} from "../../../actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
}

interface ProgramData {
  id: string;
  name: string;
  code: string;
  durationSemesters: number;
  totalCredits: number;
  departmentId: string;
  description: string | null;
  entryRequirements: string | null;
  isActive: boolean;
}

export function ProgramEditForm({
  program,
  departments,
}: {
  program: ProgramData;
  departments: Department[];
}) {
  const boundAction = updateProgramAction.bind(null, program.id);
  const [state, formAction, isPending] = useActionState<
    AcademicActionState,
    FormData
  >(boundAction, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>
            Update the program&apos;s information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={program.name}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={program.code}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Program code cannot be changed.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select name="departmentId" defaultValue={program.departmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationSemesters">Duration (semesters) *</Label>
              <Input
                id="durationSemesters"
                name="durationSemesters"
                type="number"
                min={1}
                max={12}
                defaultValue={program.durationSemesters}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalCredits">Total Credits *</Label>
              <Input
                id="totalCredits"
                name="totalCredits"
                type="number"
                min={1}
                defaultValue={program.totalCredits}
                required
                disabled={isPending}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={program.isActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={program.description || ""}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryRequirements">Entry Requirements</Label>
            <Textarea
              id="entryRequirements"
              name="entryRequirements"
              rows={3}
              defaultValue={program.entryRequirements || ""}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isPending} asChild>
          <Link href={`/academics/programs/${program.id}`}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
