"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { STATUS_COLORS } from "@/constants";
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  User,
  Heart,
} from "lucide-react";
import Link from "next/link";

interface StudentDetailProps {
  student: {
    id: string;
    studentIdNumber: string;
    dob: Date | null;
    gender: string;
    address: string | null;
    stateCounty: string | null;
    nationality: string | null;
    status: string;
    admissionDate: Date;
    admissionType: string;
    bloodType: string | null;
    allergies: string | null;
    medicalNotes: string | null;
    emergencyContact: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
    guardianRelationship: string | null;
    program: {
      name: string;
      code: string;
      department: { name: string } | null;
    } | null;
    user: {
      email: string;
      fullName: string;
      phone: string | null;
      avatarUrl: string | null;
      isActive: boolean;
      createdAt: Date;
    };
    enrollments: {
      id: string;
      status: string;
      semester: {
        name: string;
        academicYear: { name: string };
      };
      courseEnrollments: {
        id: string;
        subject: { name: string; code: string; creditHours: number };
        grade: {
          caMarks: number | null;
          examMarks: number | null;
          totalMarks: number | null;
          gradeLetter: string | null;
        } | null;
      }[];
    }[];
    studentFees: {
      id: string;
      amountCharged: unknown;
      amountPaid: unknown;
      balance: unknown;
      status: string;
      feeStructure: {
        category: string;
        amount: unknown;
        currency: string;
        description: string | null;
      };
    }[];
    payments: { amount: unknown; paymentDate: Date }[];
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

export function StudentDetail({ student }: StudentDetailProps) {
  const fullName = student.user.fullName;

  const totalBilled = student.studentFees.reduce(
    (sum, f) => sum + Number(f.amountCharged),
    0,
  );
  const totalPaid = student.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/students">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[student.status]}
              >
                {student.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {student.studentIdNumber} ·{" "}
              {student.program?.name ?? "No program assigned"}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/students/${student.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Student
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="guardian">Guardian</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={student.dob ? formatDate(student.dob) : null}
              />
              <InfoRow icon={User} label="Gender" value={student.gender} />
              <InfoRow icon={Mail} label="Email" value={student.user.email} />
              <InfoRow icon={Phone} label="Phone" value={student.user.phone} />
              <InfoRow icon={MapPin} label="Address" value={student.address} />
              <InfoRow
                icon={User}
                label="Nationality"
                value={student.nationality}
              />
              <InfoRow
                icon={Calendar}
                label="Admission Date"
                value={formatDate(student.admissionDate)}
              />
              <InfoRow
                icon={GraduationCap}
                label="Admission Type"
                value={student.admissionType}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoRow
                icon={GraduationCap}
                label="Program"
                value={student.program?.name}
              />
              <InfoRow
                icon={GraduationCap}
                label="Program Code"
                value={student.program?.code}
              />
              <InfoRow
                icon={GraduationCap}
                label="Department"
                value={student.program?.department?.name}
              />
            </CardContent>
          </Card>

          {student.enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enrollment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {enrollment.semester.academicYear.name} —{" "}
                            {enrollment.semester.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.courseEnrollments.length} subject(s)
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[enrollment.status]}
                        >
                          {enrollment.status}
                        </Badge>
                      </div>
                      {enrollment.courseEnrollments.length > 0 && (
                        <div className="mt-3">
                          <Separator className="mb-3" />
                          <div className="space-y-2">
                            {enrollment.courseEnrollments.map((ce) => (
                              <div
                                key={ce.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>
                                  {ce.subject.code} — {ce.subject.name} (
                                  {ce.subject.creditHours} cr)
                                </span>
                                {ce.grade ? (
                                  <Badge variant="outline">
                                    {ce.grade.gradeLetter ?? "—"} (
                                    {ce.grade.totalMarks ?? "—"}%)
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">
                                    No grade
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Billed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalBilled)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Paid</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalBilled - totalPaid)}
                </p>
              </CardContent>
            </Card>
          </div>

          {student.studentFees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fee Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {student.studentFees.map((fee) => (
                    <div
                      key={fee.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {fee.feeStructure.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fee.feeStructure.description ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(Number(fee.amountCharged))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {formatCurrency(Number(fee.amountPaid))}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[fee.status]}
                      >
                        {fee.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Guardian Tab */}
        <TabsContent value="guardian" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoRow
                icon={User}
                label="Guardian Name"
                value={student.guardianName}
              />
              <InfoRow
                icon={Phone}
                label="Guardian Phone"
                value={student.guardianPhone}
              />
              <InfoRow
                icon={Mail}
                label="Guardian Email"
                value={student.guardianEmail}
              />
              <InfoRow
                icon={User}
                label="Relationship"
                value={student.guardianRelationship}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoRow
                icon={User}
                label="Emergency Contact"
                value={student.emergencyContact}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoRow
                icon={Heart}
                label="Blood Type"
                value={student.bloodType}
              />
              <InfoRow
                icon={Heart}
                label="Allergies"
                value={student.allergies}
              />
              <InfoRow
                icon={Heart}
                label="Medical Notes"
                value={student.medicalNotes}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
