import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { FeeStructureEditForm } from "./fee-structure-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fs = await db.feeStructure.findUnique({
    where: { id },
    select: { category: true, program: { select: { code: true } } },
  });
  return {
    title: fs
      ? `Edit ${fs.program.code} — ${fs.category}`
      : "Edit Fee Structure",
  };
}

export default async function FeeStructureEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) return null;

  const isAdmin =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "FINANCE";
  if (!isAdmin) redirect(`/fees/structures/${id}`);

  const [feeStructure, programs, academicYears, semesters] = await Promise.all([
    db.feeStructure.findUnique({ where: { id } }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    db.academicYear.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
    db.semester.findMany({
      include: { academicYear: { select: { name: true } } },
      orderBy: [{ academicYear: { startDate: "desc" } }, { startDate: "asc" }],
    }),
  ]);

  if (!feeStructure) notFound();

  const serialized = {
    ...feeStructure,
    amount: Number(feeStructure.amount),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Fee Structure
        </h1>
        <p className="text-muted-foreground">Update fee structure details.</p>
      </div>
      <FeeStructureEditForm
        feeStructure={serialized}
        programs={programs}
        academicYears={academicYears}
        semesters={semesters}
      />
    </div>
  );
}
