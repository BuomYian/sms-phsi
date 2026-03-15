import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import FeeStructureForm from "./fee-structure-form";

export const metadata = { title: "Create Fee Structure" };

export default async function NewFeeStructurePage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "FINANCE";
  if (!isAdmin) redirect("/fees/structures");

  const [programs, academicYears, semesters] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Fee Structure
        </h1>
        <p className="text-muted-foreground">
          Define a new fee category for a program and semester.
        </p>
      </div>
      <FeeStructureForm
        programs={programs}
        academicYears={academicYears}
        semesters={semesters}
      />
    </div>
  );
}
