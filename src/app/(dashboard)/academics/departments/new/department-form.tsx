"use client";

import { useActionState, useEffect } from "react";
import { createDepartmentAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DepartmentForm() {
  const [state, formAction, isPending] = useActionState(
    createDepartmentAction,
    {},
  );

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Department Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g., Nursing Sciences"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input id="code" name="code" required placeholder="e.g., NS" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional description"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Department"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
