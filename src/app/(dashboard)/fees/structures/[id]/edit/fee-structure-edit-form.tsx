"use client";

import { useActionState, useState } from "react";
import {
  updateFeeStructureAction,
  type FeeActionState,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

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

interface FeeStructureData {
  id: string;
  programId: string;
  academicYearId: string;
  semesterId: string;
  category: string;
  amount: number;
  description: string | null;
}

type Props = {
  feeStructure: FeeStructureData;
  programs: { id: string; name: string; code: string }[];
  academicYears: { id: string; name: string }[];
  semesters: {
    id: string;
    name: string;
    academicYearId: string;
    academicYear: { name: string };
  }[];
};

export function FeeStructureEditForm({
  feeStructure,
  programs,
  academicYears,
  semesters,
}: Props) {
  const boundAction = updateFeeStructureAction.bind(null, feeStructure.id);
  const [state, formAction, isPending] = useActionState<
    FeeActionState,
    FormData
  >(boundAction, {});

  const [selectedYear, setSelectedYear] = useState(feeStructure.academicYearId);

  const filteredSemesters = selectedYear
    ? semesters.filter((s) => s.academicYearId === selectedYear)
    : semesters;

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
          <CardTitle>Fee Structure Details</CardTitle>
          <CardDescription>
            Update the fee structure information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Program *</Label>
            <Select name="programId" defaultValue={feeStructure.programId}>
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
                defaultValue={feeStructure.academicYearId}
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
              <Select name="semesterId" defaultValue={feeStructure.semesterId}>
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
            <Select name="category" defaultValue={feeStructure.category}>
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
            <Label htmlFor="amount">Amount (USD) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0}
              step={0.01}
              required
              defaultValue={feeStructure.amount}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={feeStructure.description || ""}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isPending} asChild>
          <Link href={`/fees/structures/${feeStructure.id}`}>Cancel</Link>
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
