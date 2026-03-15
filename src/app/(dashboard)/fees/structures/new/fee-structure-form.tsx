"use client";

import { useActionState, useEffect, useState } from "react";
import { createFeeStructureAction, type FeeActionState } from "../../actions";
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

const FEE_CATEGORIES = [
  { value: "TUITION", label: "Tuition" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "LAB_FEE", label: "Lab Fee" },
  { value: "LIBRARY_FEE", label: "Library Fee" },
  { value: "CLINICAL_ATTACHMENT", label: "Clinical Attachment" },
  { value: "EXAMINATION", label: "Examination" },
  { value: "ID_CARD", label: "ID Card" },
  { value: "OTHER", label: "Other" },
];

type Props = {
  programs: { id: string; name: string; code: string }[];
  academicYears: { id: string; name: string }[];
  semesters: {
    id: string;
    name: string;
    academicYearId: string;
    academicYear: { name: string };
  }[];
};

export default function FeeStructureForm({
  programs,
  academicYears,
  semesters,
}: Props) {
  const initialState: FeeActionState = {};
  const [state, formAction, isPending] = useActionState(
    createFeeStructureAction,
    initialState,
  );
  const [selectedYear, setSelectedYear] = useState("");

  const filteredSemesters = selectedYear
    ? semesters.filter((s) => s.academicYearId === selectedYear)
    : semesters;

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Fee Structure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Program *</Label>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Select
                name="academicYearId"
                required
                onValueChange={setSelectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester *</Label>
              <Select name="semesterId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSemesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.academicYear.name} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fee Category *</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {FEE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step={0.01}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Fee Structure"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
