"use client";

import { useActionState, useEffect } from "react";
import { createProgramAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";

type DeptOption = { id: string; name: string };

export default function ProgramForm({
  departments,
}: {
  departments: DeptOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createProgramAction,
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
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., Diploma in Nursing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" required placeholder="e.g., DN" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select name="departmentId" required>
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
                required
                defaultValue={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCredits">Total Credits *</Label>
            <Input
              id="totalCredits"
              name="totalCredits"
              type="number"
              min={1}
              required
              defaultValue={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Program description"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Program"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
