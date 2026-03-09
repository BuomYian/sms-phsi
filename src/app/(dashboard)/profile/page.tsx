import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileForm } from "./profile-form";

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
      student: { select: { studentIdNumber: true } },
      staff: { select: { staffIdNumber: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your account information.
        </p>
      </div>

      <ProfileForm
        user={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
          studentIdNumber: user.student?.studentIdNumber ?? null,
          staffIdNumber: user.staff?.staffIdNumber ?? null,
        }}
      />
    </div>
  );
}
