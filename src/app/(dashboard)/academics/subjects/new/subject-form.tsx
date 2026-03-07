"use client";

import { useActionState, useEffect } from "react";
import { createSubjectAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type ProgramOption = { id: string; name: string; code: string };

export default function SubjectForm({
  programs,
}: {
  programs: ProgramOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createSubjectAction,
    {},
  );

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Subject Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., Anatomy I"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                required
                placeholder="e.g., ANAT-101"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="programId">Program *</Label>
              <Select name="programId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditHours">Credit Hours *</Label>
              <Input
                id="creditHours"
                name="creditHours"
                type="number"
                min={1}
                max={8}
                required
                defaultValue={3}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="semesterNumber">Semester *</Label>
              <Input
                id="semesterNumber"
                name="semesterNumber"
                type="number"
                min={1}
                max={8}
                required
                defaultValue={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue="CORE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORE">Core</SelectItem>
                  <SelectItem value="ELECTIVE">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Subject"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
