"use client";

import { useActionState, useEffect } from "react";
import { bulkAssignFeesAction, type FeeActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type FeeStructure = {
  id: string;
  category: string;
  amount: number;
  program: { name: string; code: string };
  academicYear: { name: string };
  semester: { name: string };
};

export default function AssignFeeForm({
  feeStructures,
}: {
  feeStructures: FeeStructure[];
}) {
  const initialState: FeeActionState = {};
  const [bulkState, bulkAction, bulkPending] = useActionState(
    bulkAssignFeesAction,
    initialState,
  );

  useEffect(() => {
    if (bulkState?.success) toast.success(bulkState.message);
    if (bulkState?.error) toast.error(bulkState.error);
  }, [bulkState]);

  return (
    <form action={bulkAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Assign Fee to Program Students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a fee structure. All active students in the associated
            program who haven&apos;t been assigned this fee yet will be
            assigned. Scholarships are automatically applied.
          </p>

          <div className="space-y-2">
            <Label>Fee Structure *</Label>
            <Select name="feeStructureId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select fee structure" />
              </SelectTrigger>
              <SelectContent>
                {feeStructures.map((fs) => (
                  <SelectItem key={fs.id} value={fs.id}>
                    {fs.program.code} — {fs.category.replace("_", " ")} ·{" "}
                    {fs.academicYear.name} {fs.semester.name} ({" "}
                    {formatCurrency(fs.amount)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={bulkPending}>
            {bulkPending ? "Assigning…" : "Assign to All Program Students"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
