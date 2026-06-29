import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ProgramSelectionForm from "./program-selection-form";

export const metadata = { title: "Choose Your Programme" };

const FOUNDATION_YEAR_CODE = "FOUND-Y1";

export default async function NewProgramSelectionPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/dashboard");

  const student = await db.student.findUnique({
    where: { userId: session.id },
    include: {
      program: true,
      programSelections: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!student) redirect("/dashboard");
  if (student.program.code !== FOUNDATION_YEAR_CODE) redirect("/program-selection");

  const latest = student.programSelections[0];
  if (latest?.status === "PENDING" || latest?.status === "APPROVED") {
    redirect("/program-selection");
  }

  // Only Nursing and Midwifery are selectable — not Foundation Year itself
  const programs = await db.program.findMany({
    where: { isActive: true, code: { not: FOUNDATION_YEAR_CODE } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, description: true },
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Choose Your Programme</h1>
        <p className="text-muted-foreground">
          Select the programme you wish to specialise in after completing Foundation Year.
          Your request will be reviewed and approved by an administrator.
        </p>
      </div>
      <ProgramSelectionForm programs={programs} />
    </div>
  );
}
