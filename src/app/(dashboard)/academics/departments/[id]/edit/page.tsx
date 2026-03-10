import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DepartmentEditForm } from "./department-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dept = await db.department.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: dept ? `Edit ${dept.name}` : "Edit Department" };
}

export default async function DepartmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [department, staffMembers] = await Promise.all([
    db.department.findUnique({ where: { id } }),
    db.staff.findMany({
      select: { id: true, user: { select: { fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
  ]);

  if (!department) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Department</h1>
        <p className="text-muted-foreground">
          Update details for {department.name}
        </p>
      </div>
      <DepartmentEditForm department={department} staffMembers={staffMembers} />
    </div>
  );
}
