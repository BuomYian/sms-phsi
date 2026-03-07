import { db } from "@/lib/db";
import ProgramForm from "./program-form";

export const metadata = { title: "New Program" };

export default async function NewProgramPage() {
  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Program</h1>
        <p className="text-muted-foreground">Create a new academic program.</p>
      </div>
      <ProgramForm departments={departments} />
    </div>
  );
}
