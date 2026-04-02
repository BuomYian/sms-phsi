import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileForm } from "./profile-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      fullName: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      securityQuestion: true,
      student: {
        select: {
          studentIdNumber: true,
          yearOfStudy: true,
          status: true,
          admissionDate: true,
          program: { select: { name: true } },
        },
      },
      staff: {
        select: {
          staffIdNumber: true,
          designation: true,
          employmentType: true,
          dateOfHire: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your account information.
          </p>
        </div>
      </div>

      <ProfileForm
        user={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
          hasSecurityQuestion: !!user.securityQuestion,
          studentIdNumber: user.student?.studentIdNumber ?? null,
          staffIdNumber: user.staff?.staffIdNumber ?? null,
          studentProgram: user.student?.program?.name ?? null,
          studentYear: user.student?.yearOfStudy ?? null,
          studentStatus: user.student?.status ?? null,
          studentAdmissionDate:
            user.student?.admissionDate?.toISOString() ?? null,
          staffDesignation: user.staff?.designation ?? null,
          staffDepartment: user.staff?.department?.name ?? null,
          staffEmploymentType: user.staff?.employmentType ?? null,
          staffDateOfHire: user.staff?.dateOfHire?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
