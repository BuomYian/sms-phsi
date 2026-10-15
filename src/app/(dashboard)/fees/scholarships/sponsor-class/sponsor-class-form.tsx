"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sponsorClassAction, type FeeActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHOLARSHIP_TYPES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { Award, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ClassOption = {
  id: string;
  name: string;
  programCode: string;
  academicYear: string;
  yearStartDate: string;
  activeStudents: number;
};

export default function SponsorClassForm({
  classes,
  existingSponsors,
}: {
  classes: ClassOption[];
  existingSponsors: string[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [type, setType] = useState("Full Scholarship");
  const [coverageMode, setCoverageMode] = useState("percentage");
  const [startDate, setStartDate] = useState("");
  const [recalculate, setRecalculate] = useState(true);

  const [state, formAction, isPending] = useActionState<
    FeeActionState,
    FormData
  >(sponsorClassAction, {});

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  const selected = classes.find((c) => c.id === classId);

  // Default the award start to the class's academic year start. The fees
  // already billed sit on that year's semesters, and picking today's date
  // instead would scope them out — the action would succeed and change
  // nothing.
  function handleClassChange(id: string) {
    setClassId(id);
    const c = classes.find((x) => x.id === id);
    if (c && !startDate) setStartDate(c.yearStartDate);
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="coverageMode" value={coverageMode} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="classId" value={classId} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Sponsorship details</CardTitle>
          <CardDescription>
            Every active student in the class receives this award.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Class *</Label>
            <Select value={classId} onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.programCode} — {c.name} · {c.activeStudents} active
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground">
                Will create up to {selected.activeStudents} scholarship(s) and
                recalculate fees for {selected.activeStudents} active student(s)
                in {selected.name}.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sponsor">Sponsor *</Label>
              <Input
                id="sponsor"
                name="sponsor"
                list="sponsor-options"
                placeholder="e.g. Mission 21"
                required
                disabled={isPending}
              />
              <datalist id="sponsor-options">
                {existingSponsors.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Use the exact same spelling each time so repeat runs recognise
                existing awards.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          <div className="space-y-2">
            <Label>Coverage *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={coverageMode === "percentage" ? "default" : "outline"}
                size="sm"
                onClick={() => setCoverageMode("percentage")}
              >
                Percentage of each fee
              </Button>
              <Button
                type="button"
                variant={coverageMode === "amount" ? "default" : "outline"}
                size="sm"
                onClick={() => setCoverageMode("amount")}
              >
                Fixed amount per fee
              </Button>
            </div>
            {coverageMode === "percentage" ? (
              <>
                <Input
                  name="percentage"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  defaultValue={100}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  100 means a full scholarship, and keeps covering future fees
                  whatever their amount.
                </p>
              </>
            ) : (
              <>
                <Input
                  name="amount"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  A fixed amount stops covering in full once a larger fee
                  appears.
                </p>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Must cover the semesters of any fees already billed, or those
                fees will be left untouched.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Set this to the end of the sponsored period, e.g. the end of
                the final year.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="recalculateExisting"
              name="recalculateExisting"
              checked={recalculate}
              onCheckedChange={(v) => setRecalculate(v === true)}
              disabled={isPending}
            />
            <Label
              htmlFor="recalculateExisting"
              className="text-sm font-normal leading-snug"
            >
              Also apply to fees already billed to this class (recommended)
            </Label>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This waives the sponsored portion of every fee whose semester
              falls inside the award dates. Gross billed amounts are kept
              intact; waived money is excluded from Outstanding. Running it
              twice is safe — students already sponsored are skipped.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={isPending || !classId}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sponsoring…
              </>
            ) : (
              "Sponsor Class"
            )}
          </Button>
        </CardContent>
      </Card>

      {state.summary && (
        <Card className="max-w-2xl border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Award className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-400">
              {state.summary.className}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Active students</dt>
                <dd className="font-medium">{state.summary.students}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Scholarships created</dt>
                <dd className="font-medium">
                  {state.summary.scholarshipsCreated}
                </dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">
                  Skipped (already sponsored)
                </dt>
                <dd className="font-medium">
                  {state.summary.scholarshipsSkipped}
                </dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Fees recalculated</dt>
                <dd className="font-medium">
                  {state.summary.feesRecalculated}
                </dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Total sponsored</dt>
                <dd className="font-medium text-emerald-600">
                  {formatCurrency(state.summary.waivedTotal)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
