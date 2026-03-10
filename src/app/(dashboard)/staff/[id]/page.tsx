import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StaffDetail } from "./staff-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await db.staff.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } } },
  });
  return {
    title: staff ? staff.user.fullName : "Staff Member",
  };
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const staff = await db.staff.findUnique({
    where: { id },
    include: {
      department: { select: { name: true } },
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          role: true,
          createdAt: true,
        },
      },
      subjectInstructors: {
        include: {
          subject: { select: { name: true, code: true, creditHours: true } },
        },
      },
    },
  });

  if (!staff) notFound();

  const serialized = {
    ...staff,
    salary: staff.salary ? Number(staff.salary) : null,
  };

  return (
    <div className="space-y-6">
      <StaffDetail staff={serialized} />
    </div>
  );
}
