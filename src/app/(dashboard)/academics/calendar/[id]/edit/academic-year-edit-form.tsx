"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateAcademicYearAction,
  type AcademicActionState,
} from "../../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type AcademicYearData = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
};

export default function AcademicYearEditForm({
  academicYear,
}: {
  academicYear: AcademicYearData;
}) {
  const router = useRouter();
  const initialState: AcademicActionState = {};
  const boundAction = updateAcademicYearAction.bind(null, academicYear.id);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push(`/academics/calendar/${academicYear.id}`);
    }
    if (state?.error) toast.error(state.error);
  }, [state, router, academicYear.id]);

  const toDateStr = (d: Date) => new Date(d).toISOString().split("T")[0];

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Academic Year Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={academicYear.name}
              placeholder="e.g. 2024/2025"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                defaultValue={toDateStr(academicYear.startDate)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
                defaultValue={toDateStr(academicYear.endDate)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isCurrent"
              name="isCurrent"
              value="true"
              defaultChecked={academicYear.isCurrent}
            />
            <Label htmlFor="isCurrent">Set as current academic year</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/academics/calendar/${academicYear.id}`)
              }
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
