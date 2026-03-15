"use client";

import { useActionState, useEffect } from "react";
import { createScholarshipAction, type FeeActionState } from "../../actions";
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

const SCHOLARSHIP_TYPES = [
  "Full Scholarship",
  "Partial Scholarship",
  "Need-Based Aid",
  "Merit-Based",
  "Government Sponsored",
  "NGO Sponsored",
  "Institutional",
];

type Props = {
  students: {
    id: string;
    studentIdNumber: string;
    user: { fullName: string };
  }[];
};

export default function ScholarshipForm({ students }: Props) {
  const initialState: FeeActionState = {};
  const [state, formAction, isPending] = useActionState(
    createScholarshipAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Scholarship Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Student *</Label>
            <Select name="studentId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.studentIdNumber} — {s.user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scholarship Type *</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {SCHOLARSHIP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsor">Sponsor Name *</Label>
            <Input
              id="sponsor"
              name="sponsor"
              required
              placeholder="e.g. UNHCR, World Bank, Government of South Sudan"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="percentage">Coverage Percentage</Label>
              <Input
                id="percentage"
                name="percentage"
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="e.g., 100 for full coverage"
              />
              <p className="text-xs text-muted-foreground">
                Set to 100 for full scholarship (student pays nothing).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Fixed Amount (USD)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="Or a fixed amount"
              />
              <p className="text-xs text-muted-foreground">
                Used if no percentage is set.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Scholarship"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
