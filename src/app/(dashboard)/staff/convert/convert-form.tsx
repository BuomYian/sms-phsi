"use client";

import { useActionState } from "react";
import { convertToStaffAction, type StaffActionState } from "../actions";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Loader2, CheckCircle, UserCog } from "lucide-react";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
}

interface EligibleUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export function ConvertToStaffForm({
  departments,
  eligibleUsers,
}: {
  departments: Department[];
  eligibleUsers: EligibleUser[];
}) {
  const [state, formAction, isPending] = useActionState<
    StaffActionState,
    FormData
  >(convertToStaffAction, {});

  if (eligibleUsers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <UserCog className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            All existing users already have staff records.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/staff/new">Register New Staff Instead</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
          <CardTitle>Select User</CardTitle>
          <CardDescription>
            Choose from users who don&apos;t yet have a staff record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="userId">User *</Label>
            <Select name="userId" required disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} — {u.email} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Details</CardTitle>
          <CardDescription>
            Configure the staff role and assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role">Assign Role</Label>
            <Select name="role" disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentId">Department</Label>
            <Select name="departmentId" disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select department..." />
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
            <Label htmlFor="designation">Designation *</Label>
            <Input
              id="designation"
              name="designation"
              placeholder="e.g. Lecturer, Lab Technician"
              defaultValue="Staff"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select
              name="employmentType"
              defaultValue="FULL_TIME"
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="qualifications">Qualifications</Label>
            <Input
              id="qualifications"
              name="qualifications"
              placeholder="e.g. BSc Nursing, MPH"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Convert to Staff
        </Button>
        <Button variant="outline" asChild>
          <Link href="/staff">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
