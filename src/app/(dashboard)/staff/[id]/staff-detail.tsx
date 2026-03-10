"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  User,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

interface StaffDetailProps {
  staff: {
    id: string;
    staffIdNumber: string;
    designation: string;
    employmentType: string;
    dateOfHire: Date;
    salary: number | null;
    qualifications: string | null;
    gender: string | null;
    dob: Date | null;
    nationality: string | null;
    nationalId: string | null;
    address: string | null;
    department: { name: string } | null;
    user: {
      email: string;
      fullName: string;
      phone: string | null;
      avatarUrl: string | null;
      isActive: boolean;
      role: string;
      createdAt: Date;
    };
    subjectInstructors: {
      subject: { name: string; code: string; creditHours: number };
    }[];
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

export function StaffDetail({ staff }: StaffDetailProps) {
  const fullName = staff.user.fullName;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/staff">
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
              <Badge variant={staff.user.isActive ? "default" : "secondary"}>
                {staff.user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {staff.staffIdNumber} · {staff.designation}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/staff/${staff.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Staff
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
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
                value={staff.dob ? formatDate(staff.dob) : null}
              />
              <InfoRow icon={User} label="Gender" value={staff.gender} />
              <InfoRow icon={Mail} label="Email" value={staff.user.email} />
              <InfoRow icon={Phone} label="Phone" value={staff.user.phone} />
              <InfoRow icon={MapPin} label="Address" value={staff.address} />
              <InfoRow
                icon={User}
                label="Nationality"
                value={staff.nationality}
              />
              <InfoRow
                icon={User}
                label="National ID"
                value={staff.nationalId}
              />
              <InfoRow
                icon={Calendar}
                label="Account Created"
                value={formatDate(staff.user.createdAt)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                icon={Briefcase}
                label="Designation"
                value={staff.designation}
              />
              <InfoRow
                icon={Briefcase}
                label="Department"
                value={staff.department?.name}
              />
              <InfoRow
                icon={Briefcase}
                label="System Role"
                value={staff.user.role}
              />
              <InfoRow
                icon={Briefcase}
                label="Employment Type"
                value={staff.employmentType.replace("_", " ")}
              />
              <InfoRow
                icon={Calendar}
                label="Date of Hire"
                value={formatDate(staff.dateOfHire)}
              />
              <InfoRow
                icon={Briefcase}
                label="Salary"
                value={
                  staff.salary != null ? formatCurrency(staff.salary) : null
                }
              />
              <InfoRow
                icon={GraduationCap}
                label="Qualifications"
                value={staff.qualifications}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.subjectInstructors.length > 0 ? (
                <div className="space-y-2">
                  {staff.subjectInstructors.map((si, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span>
                        {si.subject.code} — {si.subject.name}
                      </span>
                      <Badge variant="outline">
                        {si.subject.creditHours} credits
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No subjects assigned yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
