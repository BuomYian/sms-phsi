"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Pencil,
  BookOpen,
  Users,
  GraduationCap,
  User,
} from "lucide-react";
import Link from "next/link";

interface SubjectDetailProps {
  subject: {
    id: string;
    name: string;
    code: string;
    creditHours: number;
    semesterNumber: number;
    type: string;
    description: string | null;
    program: { id: string; name: string; code: string } | null;
    instructors: {
      staff: {
        user: { fullName: string; email: string };
      };
    }[];
    prerequisites: {
      prerequisite: { name: string; code: string };
    }[];
    prerequisiteOf: {
      subject: { name: string; code: string };
    }[];
    _count: { courseEnrollments: number };
  };
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function SubjectDetail({ subject }: SubjectDetailProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/academics/subjects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <Badge variant="outline">{subject.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {subject.code} · Semester {subject.semesterNumber}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/academics/subjects/${subject.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Subject
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Credit Hours</p>
              <p className="text-lg font-bold">{subject.creditHours}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Semester</p>
              <p className="text-lg font-bold">{subject.semesterNumber}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Instructors</p>
              <p className="text-lg font-bold">{subject.instructors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Enrollments</p>
              <p className="text-lg font-bold">
                {subject._count.courseEnrollments}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Subject Name" value={subject.name} />
          <InfoItem label="Code" value={subject.code} />
          <InfoItem
            label="Program"
            value={
              subject.program
                ? `${subject.program.name} (${subject.program.code})`
                : null
            }
          />
          <InfoItem label="Credit Hours" value={String(subject.creditHours)} />
          <InfoItem label="Semester" value={String(subject.semesterNumber)} />
          <InfoItem label="Type" value={subject.type} />
        </CardContent>
      </Card>

      {subject.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{subject.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Instructors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          {subject.instructors.length > 0 ? (
            <div className="space-y-2">
              {subject.instructors.map((si, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span className="font-medium">{si.staff.user.fullName}</span>
                  <span className="text-muted-foreground">
                    {si.staff.user.email}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No instructors assigned yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prerequisites */}
      {(subject.prerequisites.length > 0 ||
        subject.prerequisiteOf.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subject.prerequisites.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  This subject requires:
                </p>
                <div className="space-y-1">
                  {subject.prerequisites.map((p, i) => (
                    <Badge key={i} variant="secondary" className="mr-1">
                      {p.prerequisite.code} — {p.prerequisite.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {subject.prerequisiteOf.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Required by:
                </p>
                <div className="space-y-1">
                  {subject.prerequisiteOf.map((p, i) => (
                    <Badge key={i} variant="outline" className="mr-1">
                      {p.subject.code} — {p.subject.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
