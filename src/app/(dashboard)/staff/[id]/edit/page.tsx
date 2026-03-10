import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StaffEditForm } from "./staff-edit-form";

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
    title: staff ? `Edit ${staff.user.fullName}` : "Edit Staff",
  };
}

export default async function StaffEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [staff, departments] = await Promise.all([
    db.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    }),
    db.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!staff) notFound();

  const serialized = {
    ...staff,
    salary: staff.salary ? Number(staff.salary) : null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Staff</h1>
        <p className="text-muted-foreground">
          Update details for {staff.user.fullName} ({staff.staffIdNumber})
        </p>
      </div>
      <StaffEditForm staff={serialized} departments={departments} />
    </div>
  );
}
