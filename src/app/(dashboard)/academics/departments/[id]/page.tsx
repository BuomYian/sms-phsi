import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DepartmentDetail } from "./department-detail";

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
  return { title: dept ? dept.name : "Department" };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const department = await db.department.findUnique({
    where: { id },
    include: {
      headOfDepartment: {
        include: { user: { select: { fullName: true, email: true } } },
      },
      staff: {
        include: {
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { user: { fullName: "asc" } },
      },
      programs: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          _count: { select: { students: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!department) notFound();

  return (
    <div className="space-y-6">
      <DepartmentDetail department={department} />
    </div>
  );
}
