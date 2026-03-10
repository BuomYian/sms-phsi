import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProgramEditForm } from "./program-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await db.program.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: program ? `Edit ${program.name}` : "Edit Program" };
}

export default async function ProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [program, departments] = await Promise.all([
    db.program.findUnique({ where: { id } }),
    db.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!program) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Program</h1>
        <p className="text-muted-foreground">
          Update details for {program.name} ({program.code})
        </p>
      </div>
      <ProgramEditForm program={program} departments={departments} />
    </div>
  );
}
