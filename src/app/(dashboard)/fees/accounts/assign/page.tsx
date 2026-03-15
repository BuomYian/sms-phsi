import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import AssignFeeForm from "./assign-fee-form";

export const metadata = { title: "Assign Fee" };

export default async function AssignFeePage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "FINANCE";
  if (!isAdmin) redirect("/fees");

  const feeStructures = await db.feeStructure.findMany({
    include: {
      program: { select: { name: true, code: true } },
      academicYear: { select: { name: true } },
      semester: { select: { name: true } },
    },
    orderBy: [{ academicYear: { startDate: "desc" } }, { category: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assign Fee</h1>
        <p className="text-muted-foreground">
          Assign a fee to all active students in a program. Scholarship
          discounts are applied automatically.
        </p>
      </div>
      <AssignFeeForm
        feeStructures={feeStructures.map((fs) => ({
          ...fs,
          amount: Number(fs.amount),
        }))}
      />
    </div>
  );
}
