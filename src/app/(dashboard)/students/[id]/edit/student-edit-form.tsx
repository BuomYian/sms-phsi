"use client";

import { useActionState } from "react";
import { updateStudentAction, type StudentActionState } from "../../actions";

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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface Program {
  id: string;
  name: string;
  code: string;
}

interface StudentData {
  id: string;
  studentIdNumber: string;
  programId: string;
  gender: string;
  dob: Date;
  nationality: string;
  nationalId: string | null;
  address: string | null;
  stateCounty: string | null;
  bloodType: string | null;
  allergies: string | null;
  disabilities: string | null;
  medicalNotes: string | null;
  emergencyContact: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianRelationship: string | null;
  guardianAddress: string | null;
  user: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  program: Program | null;
}

export function StudentEditForm({ student }: { student: StudentData }) {
  const boundAction = updateStudentAction.bind(null, student.id);
  const [state, formAction, isPending] = useActionState<
    StudentActionState,
    FormData
  >(boundAction, {});

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

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update the student&apos;s personal details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={student.user.fullName}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={student.user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={student.user.phone || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input value={student.gender} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              name="nationality"
              defaultValue={student.nationality || "South Sudanese"}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              name="nationalId"
              defaultValue={student.nationalId || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={student.address || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stateCounty">State / County</Label>
            <Input
              id="stateCounty"
              name="stateCounty"
              defaultValue={student.stateCounty || ""}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardian / Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Guardian / Emergency Contact</CardTitle>
          <CardDescription>
            Update guardian and emergency information.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Guardian Name</Label>
            <Input
              id="guardianName"
              name="guardianName"
              defaultValue={student.guardianName || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input
              id="guardianPhone"
              name="guardianPhone"
              type="tel"
              defaultValue={student.guardianPhone || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Guardian Email</Label>
            <Input
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              defaultValue={student.guardianEmail || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianRelationship">Relationship</Label>
            <Select
              name="guardianRelationship"
              defaultValue={student.guardianRelationship || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Guardian">Guardian</SelectItem>
                <SelectItem value="Sibling">Sibling</SelectItem>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianAddress">Guardian Address</Label>
            <Input
              id="guardianAddress"
              name="guardianAddress"
              defaultValue={student.guardianAddress || ""}
              disabled={isPending}
            />
          </div>

          <Separator className="md:col-span-2 lg:col-span-3" />

          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              name="emergencyContact"
              defaultValue={student.emergencyContact || ""}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>Update medical details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bloodType">Blood Type</Label>
            <Select
              name="bloodType"
              defaultValue={student.bloodType || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              name="allergies"
              rows={2}
              defaultValue={student.allergies || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabilities">Disabilities</Label>
            <Textarea
              id="disabilities"
              name="disabilities"
              rows={2}
              defaultValue={student.disabilities || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <Textarea
              id="medicalNotes"
              name="medicalNotes"
              rows={2}
              defaultValue={student.medicalNotes || ""}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isPending} asChild>
          <Link href={`/students/${student.id}`}>Cancel</Link>
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
